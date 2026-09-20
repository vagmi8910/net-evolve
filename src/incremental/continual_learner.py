"""
continual_learner.py

Purpose: Incremental Learning (RoNeTC+ Phase 6).
Enables the RoNeTCClassifier to continuously incorporate newly discovered and verified
attack traffic categories without retraining from scratch, utilizing dynamic classifier
head expansion and replay buffer rehearsal to prevent catastrophic forgetting.
"""
from __future__ import annotations

from typing import Dict, List, Tuple, Optional, Any
import numpy as np
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import accuracy_score, f1_score

from models.ronetc_model import RoNeTCClassifier
from losses.ronetc_loss import RoNeTCLoss, calculate_annealing_factor
from utils.logger import get_logger

logger = get_logger(__name__)


def expand_classifier_head(model: RoNeTCClassifier, num_new_classes: int) -> int:
    """Expands the output linear layers of all three view opinion generators.

    Parameters
    ----------
    model : RoNeTCClassifier
    num_new_classes : int
        Number of verified novel classes to append.

    Returns
    -------
    int : new total class count K_new.
    """
    og = model.opinion_generator
    k_old = og.num_classes
    k_new = k_old + num_new_classes

    for name in ["ip_opinion", "transport_opinion", "payload_opinion"]:
        view_gen = getattr(og, name)
        old_fc = view_gen.fc
        in_dim = old_fc.in_features

        new_fc = nn.Linear(in_dim, k_new).to(old_fc.weight.device)

        # Preserve previously learned weights and biases
        with torch.no_grad():
            new_fc.weight[:k_old] = old_fc.weight
            new_fc.bias[:k_old] = old_fc.bias
            # Xavier initialize new class weights
            nn.init.xavier_uniform_(new_fc.weight[k_old:])
            nn.init.zeros_(new_fc.bias[k_old:])

        view_gen.fc = new_fc
        view_gen.num_classes = k_new

    og.num_classes = k_new
    logger.info(f"Expanded RoNeTCClassifier output heads from {k_old} to {k_new} classes.")
    return k_new


class ExemplarBuffer:
    """Replay memory storing representative exemplars per class to prevent forgetting."""

    def __init__(self, max_per_class: int = 50):
        self.max_per_class = max_per_class
        self.memory: Dict[int, Dict[str, torch.Tensor]] = {}

    def add_samples(
        self,
        ip: torch.Tensor,
        tr: torch.Tensor,
        pay: torch.Tensor,
        labels: torch.Tensor,
    ) -> None:
        unique_labels = torch.unique(labels)
        for lbl in unique_labels:
            c = int(lbl.item())
            mask = labels == c
            c_ip, c_tr, c_pay = ip[mask], tr[mask], pay[mask]

            if c not in self.memory:
                self.memory[c] = {
                    "ip": c_ip[: self.max_per_class].cpu(),
                    "transport": c_tr[: self.max_per_class].cpu(),
                    "payload": c_pay[: self.max_per_class].cpu(),
                }
            else:
                existing = self.memory[c]
                cat_ip = torch.cat([existing["ip"], c_ip.cpu()], dim=0)[: self.max_per_class]
                cat_tr = torch.cat([existing["transport"], c_tr.cpu()], dim=0)[: self.max_per_class]
                cat_pay = torch.cat([existing["payload"], c_pay.cpu()], dim=0)[: self.max_per_class]
                self.memory[c] = {"ip": cat_ip, "transport": cat_tr, "payload": cat_pay}

    def get_all_exemplars(self) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        all_ip, all_tr, all_pay, all_labels = [], [], [], []
        for c, data in self.memory.items():
            n = len(data["ip"])
            all_ip.append(data["ip"])
            all_tr.append(data["transport"])
            all_pay.append(data["payload"])
            all_labels.append(torch.full((n,), c, dtype=torch.long))

        if not all_ip:
            return torch.empty(0), torch.empty(0), torch.empty(0), torch.empty(0)

        return (
            torch.cat(all_ip, dim=0),
            torch.cat(all_tr, dim=0),
            torch.cat(all_pay, dim=0),
            torch.cat(all_labels, dim=0),
        )


class IncrementalLearner:
    """Manages incremental model fine-tuning with exemplar replay."""

    def __init__(
        self,
        model: RoNeTCClassifier,
        device: torch.device,
        learning_rate: float = 0.0005,
        weight_decay: float = 1e-4,
        max_exemplars_per_class: int = 50,
    ):
        self.model = model.to(device)
        self.device = device
        self.lr = learning_rate
        self.weight_decay = weight_decay
        self.buffer = ExemplarBuffer(max_per_class=max_exemplars_per_class)
        self.initial_old_acc: Optional[float] = None

    def store_prior_knowledge(
        self,
        ip: torch.Tensor,
        tr: torch.Tensor,
        pay: torch.Tensor,
        labels: torch.Tensor,
    ) -> None:
        """Stores exemplars of initial known classes before any expansion."""
        self.buffer.add_samples(ip, tr, pay, labels)

    def learn_new_classes(
        self,
        new_ip: torch.Tensor,
        new_tr: torch.Tensor,
        new_pay: torch.Tensor,
        new_labels: torch.Tensor,
        epochs: int = 5,
        batch_size: int = 32,
    ) -> Dict[str, Any]:
        """Expands head and updates weights using combined novel samples + replay exemplars."""
        unique_new = torch.unique(new_labels)
        current_k = self.model.opinion_generator.num_classes
        max_new_id = int(unique_new.max().item())
        classes_to_add = max(0, (max_new_id + 1) - current_k)

        if classes_to_add > 0:
            expand_classifier_head(self.model, classes_to_add)

        total_k = self.model.opinion_generator.num_classes
        criterion = RoNeTCLoss(num_classes=total_k)
        optimizer = AdamW(self.model.parameters(), lr=self.lr, weight_decay=self.weight_decay)

        # Merge new samples with rehearsal exemplars
        ex_ip, ex_tr, ex_pay, ex_labels = self.buffer.get_all_exemplars()
        if len(ex_ip) > 0:
            comb_ip = torch.cat([new_ip.cpu(), ex_ip], dim=0)
            comb_tr = torch.cat([new_tr.cpu(), ex_tr], dim=0)
            comb_pay = torch.cat([new_pay.cpu(), ex_pay], dim=0)
            comb_labels = torch.cat([new_labels.cpu(), ex_labels], dim=0)
        else:
            comb_ip, comb_tr, comb_pay, comb_labels = new_ip.cpu(), new_tr.cpu(), new_pay.cpu(), new_labels.cpu()

        # Update exemplar memory with new classes as well
        self.buffer.add_samples(new_ip, new_tr, new_pay, new_labels)

        dataset = TensorDataset(comb_ip, comb_tr, comb_pay, comb_labels)
        loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        self.model.train()
        history_loss = []

        for ep in range(1, epochs + 1):
            ep_loss = 0.0
            lambda_t = calculate_annealing_factor(ep, annealing_epochs=epochs)

            for b_ip, b_tr, b_pay, b_y in loader:
                b_ip, b_tr, b_pay, b_y = (
                    b_ip.to(self.device),
                    b_tr.to(self.device),
                    b_pay.to(self.device),
                    b_y.to(self.device),
                )
                optimizer.zero_grad()
                out = self.model(b_ip, b_tr, b_pay)

                loss = (
                    criterion(out["fused"]["alpha"], b_y, lambda_t).mean()
                    + criterion(out["ip"]["alpha"], b_y, lambda_t).mean()
                    + criterion(out["transport"]["alpha"], b_y, lambda_t).mean()
                    + criterion(out["payload"]["alpha"], b_y, lambda_t).mean()
                )
                loss.backward()
                optimizer.step()
                ep_loss += loss.item() * len(b_y)

            avg_loss = ep_loss / len(dataset)
            history_loss.append(avg_loss)
            logger.info(f"Incremental Epoch {ep}/{epochs} - Loss: {avg_loss:.4f}")

        return {
            "total_classes": total_k,
            "training_loss": history_loss,
            "exemplars_in_memory": len(comb_ip),
        }

    @torch.no_grad()
    def evaluate_continual(
        self,
        test_ip: torch.Tensor,
        test_tr: torch.Tensor,
        test_pay: torch.Tensor,
        test_labels: torch.Tensor,
        old_classes: List[int],
        new_classes: List[int],
    ) -> Dict[str, Any]:
        """Evaluates model post-update on old classes and new classes, computing forgetting."""
        self.model.eval()
        test_ip = test_ip.to(self.device)
        test_tr = test_tr.to(self.device)
        test_pay = test_pay.to(self.device)

        out = self.model(test_ip, test_tr, test_pay)
        preds = torch.argmax(out["fused"]["belief"], dim=-1).cpu().numpy()
        y_true = test_labels.cpu().numpy()

        overall_acc = float(accuracy_score(y_true, preds))
        overall_macro_f1 = float(f1_score(y_true, preds, average="macro", zero_division=0))

        old_mask = np.isin(y_true, old_classes)
        new_mask = np.isin(y_true, new_classes)

        old_acc = float(accuracy_score(y_true[old_mask], preds[old_mask])) if np.sum(old_mask) > 0 else 0.0
        new_acc = float(accuracy_score(y_true[new_mask], preds[new_mask])) if np.sum(new_mask) > 0 else 0.0

        if self.initial_old_acc is None:
            self.initial_old_acc = old_acc
            forgetting = 0.0
        else:
            forgetting = max(0.0, self.initial_old_acc - old_acc)

        return {
            "overall_accuracy": overall_acc,
            "overall_macro_f1": overall_macro_f1,
            "old_class_accuracy": old_acc,
            "new_class_accuracy": new_acc,
            "forgetting_measure": forgetting,
        }
