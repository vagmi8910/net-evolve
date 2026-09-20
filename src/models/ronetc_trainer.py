"""
ronetc_trainer.py

Purpose: Training loop for RoNeTCClassifier using Evidential Deep Learning (EDL)
multi-view loss with dynamic KL annealing, early stopping, and checkpoint saving.
"""
from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple

import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import ReduceLROnPlateau
from torch.utils.data import DataLoader
from sklearn.metrics import accuracy_score, f1_score

from losses.ronetc_loss import RoNeTCLoss, calculate_annealing_factor
from utils.logger import get_logger

logger = get_logger(__name__)


class RoNeTCTrainer:
    """Trainer for the unified RoNeTCClassifier."""

    def __init__(self, model: nn.Module, device: torch.device, config: dict):
        self.model = model.to(device)
        self.device = device
        self.config = config

        rc_train = config["ronetc"]["training"]
        self.num_classes = config["ronetc"]["opinion_generator"]["num_classes"]
        self.epochs = rc_train["epochs"]
        self.lr = rc_train["learning_rate"]
        self.weight_decay = rc_train.get("weight_decay", 1e-4)
        self.patience = rc_train.get("early_stopping_patience", 7)
        self.annealing_epochs = rc_train.get("annealing_epochs", 10)
        self.annealing_ceiling = rc_train.get("annealing_ceiling", 1.0)

        self.criterion = RoNeTCLoss(num_classes=self.num_classes)
        self.optimizer = AdamW(self.model.parameters(), lr=self.lr, weight_decay=self.weight_decay)
        self.scheduler = ReduceLROnPlateau(self.optimizer, mode="min", factor=0.5, patience=2)

    def _step_batch(
        self,
        ip: torch.Tensor,
        tr: torch.Tensor,
        pay: torch.Tensor,
        y: torch.Tensor,
        lambda_t: float,
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """Compute the joint RoNeTC loss (Eq. 12) for a single batch."""
        out = self.model(ip, tr, pay)

        # L_all = L(fused) + sum_{v=1}^3 L(v)
        loss_fused = self.criterion(out["fused"]["alpha"], y, lambda_t).mean()
        loss_ip = self.criterion(out["ip"]["alpha"], y, lambda_t).mean()
        loss_tr = self.criterion(out["transport"]["alpha"], y, lambda_t).mean()
        loss_pay = self.criterion(out["payload"]["alpha"], y, lambda_t).mean()

        total_loss = loss_fused + loss_ip + loss_tr + loss_pay
        preds = torch.argmax(out["fused"]["belief"], dim=-1)
        return total_loss, preds

    def train_epoch(self, loader: DataLoader, epoch: int) -> Tuple[float, float, float]:
        self.model.train()
        total_loss = 0.0
        all_preds, all_labels = [], []
        lambda_t = calculate_annealing_factor(epoch, self.annealing_epochs, self.annealing_ceiling)

        for ip, tr, pay, y in loader:
            ip, tr, pay, y = ip.to(self.device), tr.to(self.device), pay.to(self.device), y.to(self.device)
            self.optimizer.zero_grad()
            loss, preds = self._step_batch(ip, tr, pay, y, lambda_t)
            loss.backward()
            self.optimizer.step()

            total_loss += loss.item() * len(y)
            all_preds.extend(preds.cpu().tolist())
            all_labels.extend(y.cpu().tolist())

        n = len(all_labels)
        avg_loss = total_loss / n if n > 0 else 0.0
        acc = accuracy_score(all_labels, all_preds) if n > 0 else 0.0
        f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0) if n > 0 else 0.0
        return avg_loss, acc, f1

    @torch.no_grad()
    def evaluate(self, loader: DataLoader, epoch: int) -> Tuple[float, float, float]:
        self.model.eval()
        total_loss = 0.0
        all_preds, all_labels = [], []
        lambda_t = calculate_annealing_factor(epoch, self.annealing_epochs, self.annealing_ceiling)

        for ip, tr, pay, y in loader:
            ip, tr, pay, y = ip.to(self.device), tr.to(self.device), pay.to(self.device), y.to(self.device)
            loss, preds = self._step_batch(ip, tr, pay, y, lambda_t)

            total_loss += loss.item() * len(y)
            all_preds.extend(preds.cpu().tolist())
            all_labels.extend(y.cpu().tolist())

        n = len(all_labels)
        avg_loss = total_loss / n if n > 0 else 0.0
        acc = accuracy_score(all_labels, all_preds) if n > 0 else 0.0
        f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0) if n > 0 else 0.0
        return avg_loss, acc, f1

    def train(self, train_loader: DataLoader, val_loader: DataLoader, save_dir: Path) -> Dict[str, List[float]]:
        save_dir = Path(save_dir)
        checkpoint_dir = save_dir / "ronetc"
        checkpoint_dir.mkdir(parents=True, exist_ok=True)
        best_model_path = checkpoint_dir / "best_model.pt"

        history: Dict[str, List[float]] = {
            "train_loss": [],
            "val_loss": [],
            "train_acc": [],
            "val_acc": [],
            "val_macro_f1": [],
        }

        best_val_loss = float("inf")
        patience_counter = 0

        for epoch in range(1, self.epochs + 1):
            train_loss, train_acc, train_f1 = self.train_epoch(train_loader, epoch)
            val_loss, val_acc, val_f1 = self.evaluate(val_loader, epoch)

            self.scheduler.step(val_loss)

            history["train_loss"].append(train_loss)
            history["val_loss"].append(val_loss)
            history["train_acc"].append(train_acc)
            history["val_acc"].append(val_acc)
            history["val_macro_f1"].append(val_f1)

            logger.info(
                f"Epoch {epoch:02d}/{self.epochs:02d} | "
                f"Train Loss: {train_loss:.4f}, Acc: {train_acc:.4f} | "
                f"Val Loss: {val_loss:.4f}, Acc: {val_acc:.4f}, Macro F1: {val_f1:.4f}"
            )

            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                torch.save(self.model.state_dict(), best_model_path)
                logger.info(f"Saved best model checkpoint to {best_model_path}")
            else:
                patience_counter += 1
                if patience_counter >= self.patience:
                    logger.info(f"Early stopping triggered at epoch {epoch}")
                    break

        return history
