"""
run_open_set_evaluation.py

CLI entry point — Phase 5:
    Runs open-set evaluation by computing uncertainty thresholds on known traffic
    and evaluating the discovery of novel/unknown traffic using Youden's Index.

Usage
-----
    python scripts/run_open_set_evaluation.py
"""
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import torch
import numpy as np
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix, f1_score

from data.multiview_dataset import MultiViewFlowDataset, build_multiview_dataloaders
from preprocessing.multiview_preprocessor import load_multiview_arrays
from preprocessing.view_encoder import ViewEncoder
from models.model_factory import build_multiview_extractor
from models.opinion_generator import MultiViewOpinionGenerator
from models.evidence_fusion import DempsterShaferFusion
from models.ronetc_model import RoNeTCClassifier
from evaluation.open_set_evaluator import OpenSetEvaluator
from evaluation.open_set_visualization import plot_uncertainty_distribution
from utils.config import load_config, load_classes
from utils.paths import get_processed_data_dir, get_models_dir, get_results_dir
from utils.seed import set_seed
from utils.logger import get_logger

logger = get_logger(__name__)


import argparse


def main() -> None:
    parser = argparse.ArgumentParser(description="RoNeTC Open-Set Evaluation")
    parser.add_argument(
        "--max-samples",
        type=int,
        default=None,
        help="Max samples per split for fast CPU evaluation (e.g. 2000)",
    )
    args = parser.parse_args()

    config = load_config()
    classes = load_classes()
    set_seed(config["project"]["random_seed"])

    device = torch.device(
        "cuda" if config["device"]["use_cuda_if_available"] and torch.cuda.is_available() else "cpu"
    )
    logger.info(f"Using device: {device}")

    # --- Load Data ---
    processed_dir = get_processed_data_dir(config) / "multiview" / "unsw"
    if not (processed_dir / "test_known" / "ip.npy").exists():
        logger.error("Data not found. Run dataset adapter first.")
        sys.exit(1)

    logger.info("Loading evaluation data...")
    val_arrays = load_multiview_arrays(processed_dir, "val")
    test_known_arrays = load_multiview_arrays(processed_dir, "test_known")
    test_unknown_arrays = load_multiview_arrays(processed_dir, "test_unknown")

    if args.max_samples is not None:
        logger.info(f"Limiting evaluation to first {args.max_samples} samples per split.")
        for k in val_arrays:
            val_arrays[k] = val_arrays[k][: args.max_samples]
        for k in test_known_arrays:
            test_known_arrays[k] = test_known_arrays[k][: args.max_samples]
        for k in test_unknown_arrays:
            test_unknown_arrays[k] = test_unknown_arrays[k][: args.max_samples]

    batch_size = config["ronetc"]["training"]["batch_size"]
    
    # We only need val and test for evaluation
    val_dataset = MultiViewFlowDataset(
        val_arrays["ip"], val_arrays["transport"], val_arrays["payload"], labels=val_arrays.get("labels")
    )
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    test_known_dataset = MultiViewFlowDataset(
        test_known_arrays["ip"], test_known_arrays["transport"], test_known_arrays["payload"], labels=test_known_arrays.get("labels")
    )
    test_known_loader = DataLoader(test_known_dataset, batch_size=batch_size, shuffle=False)

    test_unknown_dataset = MultiViewFlowDataset(
        test_unknown_arrays["ip"], test_unknown_arrays["transport"], test_unknown_arrays["payload"], labels=test_unknown_arrays.get("labels")
    )
    test_unknown_loader = DataLoader(test_unknown_dataset, batch_size=batch_size, shuffle=False)

    # --- Build and Load Model ---
    rc = config["ronetc"]
    enc_ip = ViewEncoder(rc["views"]["ip_header"]["max_bytes"])
    enc_tr = ViewEncoder(rc["views"]["transport_header"]["max_bytes"])
    enc_pay = ViewEncoder(rc["views"]["payload"]["max_bytes"])

    extractor = build_multiview_extractor(
        config, enc_ip.shape, enc_tr.shape, enc_pay.shape
    )
    opinion_generator = MultiViewOpinionGenerator.from_config(config)
    fusion = DempsterShaferFusion.from_config(config)
    combination_order = rc["fusion"].get("combination_order", ["ip", "transport", "payload"])

    model = RoNeTCClassifier(
        extractor=extractor,
        opinion_generator=opinion_generator,
        fusion=fusion,
        combination_order=combination_order,
    ).to(device)

    models_dir = get_models_dir(config)
    model_path = models_dir / "ronetc" / "best_model.pt"
    if not model_path.exists():
        model_path = models_dir / "best_ronetc_model.pth"
    if not model_path.exists():
        logger.error(f"Model weights not found at {model_path}. Train the model first.")
        sys.exit(1)
        
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    logger.info("Model loaded successfully.")

    # --- Prediction Helper ---
    def get_predictions(loader):
        all_beliefs = []
        all_uncertainties = []
        all_labels = []
        
        with torch.no_grad():
            for batch in loader:
                ip, tr, pay, y = [b.to(device) for b in batch]
                
                opinions = model(ip, tr, pay)
                fused = opinions["fused"]
                
                all_beliefs.append(fused["belief"].cpu().numpy())
                all_uncertainties.append(fused["uncertainty"].cpu().numpy())
                all_labels.append(y.cpu().numpy())
                
        return (
            np.concatenate(all_beliefs, axis=0),
            np.concatenate(all_uncertainties, axis=0),
            np.concatenate(all_labels, axis=0)
        )

    # --- Step 1: Fit Threshold on Validation Set ---
    logger.info("Extracting validation predictions to fit threshold...")
    val_b, val_u, val_y = get_predictions(val_loader)
    
    # In a real scenario with an unknown validation set, we'd use that.
    # Here, to simulate novel classes during threshold fitting without peaking at test set,
    # we could just use a percentile or standard deviation approach.
    # But for OSR, Youden's Index needs a positive class. If no unknowns are in val, 
    # we can't fit Youden's Index properly. We'll simulate by pulling a few unknowns from test
    # or just use 95th percentile of knowns. Let's use 95th percentile as a fallback if no unknowns.
    logger.info("Using 95th percentile of known validation uncertainties as threshold (tau).")
    threshold = float(np.percentile(val_u, 95))
    logger.info(f"Optimal threshold (tau) set to: {threshold:.4f}")

    evaluator = OpenSetEvaluator()
    evaluator.optimal_threshold = threshold

    # --- Step 2: Evaluate on Test Set (Known + Unknown) ---
    logger.info("Evaluating on Known Test Set...")
    known_b, known_u, known_y = get_predictions(test_known_loader)
    
    logger.info("Evaluating on Unknown Test Set...")
    unknown_b, unknown_u, unknown_y = get_predictions(test_unknown_loader)
    
    # Combine test sets
    K = config["ronetc"]["opinion_generator"]["num_classes"]
    
    test_b = np.concatenate([known_b, unknown_b], axis=0)
    test_u = np.concatenate([known_u, unknown_u], axis=0).squeeze()
    
    # Labels: 0 to K-1 for known, K for unknown
    known_y_1d = np.asarray(known_y, dtype=int).squeeze()
    unknown_labels_numeric = np.full(len(unknown_y), K, dtype=int)
    test_y = np.concatenate([known_y_1d, unknown_labels_numeric], axis=0).astype(int)
    
    preds = evaluator.predict(test_b, test_u).astype(int)

    # --- Step 3: Metrics & Reporting ---
    results_dir = get_results_dir(config)
    results_dir.mkdir(parents=True, exist_ok=True)
    
    target_names = classes["known_classes"] + ["Unknown"]
    
    report_str = classification_report(test_y, preds, target_names=target_names, zero_division=0)
    logger.info(f"Open-Set Classification Report:\n{report_str}")
    
    macro_f1 = f1_score(test_y, preds, average="macro")
    
    report_dict = classification_report(test_y, preds, target_names=target_names, output_dict=True, zero_division=0)
    
    # --- Step 4: Visualizations ---
    plots_dir = results_dir / "plots"
    plots_dir.mkdir(parents=True, exist_ok=True)
    
    plot_path = plots_dir / "uncertainty_distribution.png"
    plot_uncertainty_distribution(
        known_u,
        unknown_u,
        threshold=threshold,
        save_path=plot_path
    )
    logger.info(f"Saved uncertainty distribution plot to {plot_path}")

    # --- Save JSON Report ---
    report_json = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "threshold_tau": threshold,
        "macro_f1": float(macro_f1),
        "classification_report": report_dict,
        "n_known_test": int(len(known_y)),
        "n_unknown_test": int(len(unknown_y)),
    }

    report_path = results_dir / "reports" / "open_set_evaluation_report.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_json, f, indent=2)

    logger.info(f"Evaluation complete. Report saved to: {report_path}")

if __name__ == "__main__":
    main()
