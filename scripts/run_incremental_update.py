"""
run_incremental_update.py

CLI entry point — RoNeTC+ Phase 6:
    Demonstrates incremental learning of verified novel attack classes:
    1. Loads preprocessed known classes and stores exemplars in memory buffer.
    2. Takes discovered/verified novel classes (e.g. from test_unknown partition).
    3. Dynamically expands RoNeTCClassifier output heads from K -> K + C_new.
    4. Fine-tunes model on combined novel samples + exemplar replay.
    5. Evaluates retention on old classes, accuracy on new classes, and forgetting measure.
    6. Saves updated model checkpoint and incremental learning report.

Usage:
    python scripts/run_incremental_update.py --novel-classes 2 --epochs 5
"""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import numpy as np
import torch

from preprocessing.multiview_preprocessor import load_multiview_arrays
from preprocessing.view_encoder import ViewEncoder
from models.ronetc_model import RoNeTCClassifier
from incremental.continual_learner import IncrementalLearner
from utils.config import load_config, load_classes
from utils.paths import get_processed_data_dir, get_models_dir, get_results_dir
from utils.seed import set_seed
from utils.logger import get_logger

logger = get_logger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="RoNeTC+ Incremental Learning")
    parser.add_argument("--novel-classes", type=int, default=2, help="Number of novel classes to incorporate")
    parser.add_argument("--epochs", type=int, default=5, help="Fine-tuning rehearsal epochs")
    parser.add_argument("--batch-size", type=int, default=64, help="Batch size")
    return parser.parse_args()


def main():
    args = parse_args()
    config = load_config()
    classes = load_classes()
    set_seed(config["project"]["random_seed"])

    device = torch.device(
        "cuda" if config["device"]["use_cuda_if_available"] and torch.cuda.is_available() else "cpu"
    )
    logger.info(f"Using device: {device}")

    # Paths
    processed_dir = get_processed_data_dir(config) / "multiview" / "unsw"
    if not (processed_dir / "val" / "ip.npy").exists():
        logger.error("Validation data not found. Run dataset adapter first.")
        sys.exit(1)

    val_arrays = load_multiview_arrays(processed_dir, "val")
    test_unknown_arrays = load_multiview_arrays(processed_dir, "test_unknown")

    # Build model
    rc = config["ronetc"]
    enc_ip = ViewEncoder(rc["views"]["ip_header"]["max_bytes"])
    enc_tr = ViewEncoder(rc["views"]["transport_header"]["max_bytes"])
    enc_pay = ViewEncoder(rc["views"]["payload"]["max_bytes"])

    model = RoNeTCClassifier.from_config(config, enc_ip.shape, enc_tr.shape, enc_pay.shape).to(device)

    models_dir = get_models_dir(config)
    checkpoint_path = models_dir / "ronetc" / "best_model.pt"
    if checkpoint_path.exists():
        model.load_state_dict(torch.load(checkpoint_path, map_location=device))
        logger.info(f"Loaded base model checkpoint from {checkpoint_path}")

    learner = IncrementalLearner(model, device=device)

    # Store exemplars from known validation set
    prior_ip = torch.as_tensor(val_arrays["ip"][:500], dtype=torch.float32)
    prior_tr = torch.as_tensor(val_arrays["transport"][:500], dtype=torch.float32)
    prior_pay = torch.as_tensor(val_arrays["payload"][:500], dtype=torch.float32)
    prior_labels = torch.as_tensor(val_arrays["labels"][:500], dtype=torch.long)

    known_class_list = classes.get("known_classes", classes.get("known", []))
    K = len(known_class_list)

    logger.info(f"Storing prior knowledge exemplars for {K} known classes...")
    learner.store_prior_knowledge(prior_ip, prior_tr, prior_pay, prior_labels)

    # Prepare novel class samples (simulate admin verification on unknown samples)
    unk_ip = torch.as_tensor(test_unknown_arrays["ip"], dtype=torch.float32)
    unk_tr = torch.as_tensor(test_unknown_arrays["transport"], dtype=torch.float32)
    unk_pay = torch.as_tensor(test_unknown_arrays["payload"], dtype=torch.float32)
    
    # Map string unknown labels to integer IDs starting from K
    raw_unk_labels = test_unknown_arrays["labels"]
    uniques, inverse = np.unique(raw_unk_labels, return_inverse=True)
    unk_labels = torch.as_tensor(inverse + K, dtype=torch.long)

    # Select samples belonging to the first N novel classes
    unique_unk = torch.unique(unk_labels)[: args.novel_classes]
    novel_mask = torch.isin(unk_labels, unique_unk)

    novel_ip = unk_ip[novel_mask][:300]
    novel_tr = unk_tr[novel_mask][:300]
    novel_pay = unk_pay[novel_mask][:300]
    novel_labels = unk_labels[novel_mask][:300]

    logger.info(
        f"Incorporating {args.novel_classes} novel classes ({len(novel_labels)} samples) into classifier..."
    )

    update_res = learner.learn_new_classes(
        novel_ip, novel_tr, novel_pay, novel_labels, epochs=args.epochs, batch_size=args.batch_size
    )

    # Continual Evaluation
    test_combined_ip = torch.cat([prior_ip, novel_ip], dim=0)
    test_combined_tr = torch.cat([prior_tr, novel_tr], dim=0)
    test_combined_pay = torch.cat([prior_pay, novel_pay], dim=0)
    test_combined_labels = torch.cat([prior_labels, novel_labels], dim=0)

    old_class_list = list(range(K))
    new_class_list = [int(x.item()) for x in unique_unk]

    eval_res = learner.evaluate_continual(
        test_combined_ip,
        test_combined_tr,
        test_combined_pay,
        test_combined_labels,
        old_classes=old_class_list,
        new_classes=new_class_list,
    )

    # Save updated model
    updated_model_path = models_dir / "ronetc" / "incremental_model.pt"
    torch.save(model.state_dict(), updated_model_path)
    logger.info(f"Saved incrementally updated model to {updated_model_path}")

    # Save report
    results_dir = get_results_dir(config)
    report_path = results_dir / "reports" / "incremental_learning_report.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)

    report = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "epochs": args.epochs,
        "novel_classes_added": args.novel_classes,
        "total_classes": update_res["total_classes"],
        "continual_metrics": eval_res,
        "loss_history": update_res["training_loss"],
    }

    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    logger.info(f"Incremental learning complete. Report saved to {report_path}")
    logger.info(f"Overall Acc: {eval_res['overall_accuracy']:.4f} | Old Class Acc: {eval_res['old_class_accuracy']:.4f} | Forgetting: {eval_res['forgetting_measure']:.4f}")


if __name__ == "__main__":
    main()
