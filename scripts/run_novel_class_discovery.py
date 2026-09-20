"""
run_novel_class_discovery.py

CLI entry point — RoNeTC+ Phase 5:
    Loads preprocessed evaluation tensors and trained RoNeTC model ->
    Computes uncertainty for all samples -> Filters high-uncertainty (unknown) traffic ->
    Extracts multi-view latent embeddings -> Clusters novel traffic into candidate classes ->
    Computes ARI, NMI, Cluster Purity, and Silhouette score ->
    Saves discovery report to results/reports/novel_discovery_report.json.

Usage:
    python scripts/run_novel_class_discovery.py --algorithm kmeans --n-clusters 5
"""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import numpy as np
import torch
from torch.utils.data import DataLoader

from data.multiview_dataset import MultiViewFlowDataset
from preprocessing.multiview_preprocessor import load_multiview_arrays
from preprocessing.view_encoder import ViewEncoder
from models.ronetc_model import RoNeTCClassifier
from discovery.clustering import (
    NovelTrafficClusterer,
    filter_uncertain_samples,
    compute_clustering_metrics,
)
from utils.config import load_config, load_classes
from utils.paths import get_processed_data_dir, get_models_dir, get_results_dir
from utils.seed import set_seed
from utils.logger import get_logger

logger = get_logger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="RoNeTC+ Novel Class Discovery")
    parser.add_argument("--algorithm", type=str, default="kmeans", choices=["kmeans", "dbscan", "hdbscan"])
    parser.add_argument("--n-clusters", type=int, default=5, help="Expected novel clusters (for k-means)")
    parser.add_argument("--threshold", type=float, default=None, help="Explicit uncertainty threshold (overrides Youden)")
    parser.add_argument("--max-samples", type=int, default=None, help="Max samples for fast CPU execution")
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

    # Load data
    processed_dir = get_processed_data_dir(config) / "multiview" / "unsw"
    if not (processed_dir / "test_unknown" / "ip.npy").exists():
        logger.error("Test unknown data not found. Run dataset adapter first.")
        sys.exit(1)

    logger.info("Loading test unknown dataset for novel class discovery...")
    test_unknown_arrays = load_multiview_arrays(processed_dir, "test_unknown")

    if args.max_samples is not None:
        logger.info(f"Limiting to first {args.max_samples} unknown samples.")
        for k in test_unknown_arrays:
            test_unknown_arrays[k] = test_unknown_arrays[k][: args.max_samples]

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
        logger.info(f"Loaded model weights from {checkpoint_path}")
    else:
        logger.warning(f"No trained checkpoint at {checkpoint_path}. Using initialized weights for dry run.")

    model.eval()

    # Inference & Extract Embeddings + Uncertainty
    dataset = MultiViewFlowDataset(
        test_unknown_arrays["ip"],
        test_unknown_arrays["transport"],
        test_unknown_arrays["payload"],
        labels=test_unknown_arrays.get("labels"),
    )
    loader = DataLoader(dataset, batch_size=128, shuffle=False)

    all_embeddings = []
    all_uncertainties = []
    all_labels = []

    with torch.no_grad():
        for batch in loader:
            if len(batch) == 4:
                ip, tr, pay, y = batch
                all_labels.extend(y.numpy())
            else:
                ip, tr, pay = batch

            ip, tr, pay = ip.to(device), tr.to(device), pay.to(device)
            out = model(ip, tr, pay)
            embeds = model.extract_embeddings(ip, tr, pay)

            u = out["fused"]["uncertainty"].squeeze(-1)
            all_uncertainties.extend(u.cpu().numpy())
            all_embeddings.append(embeds.cpu().numpy())

    embeddings = np.vstack(all_embeddings)
    uncertainties = np.array(all_uncertainties)
    true_labels = np.array(all_labels) if all_labels else None

    # Determine uncertainty threshold
    threshold = args.threshold
    if threshold is None:
        # Check open-set report if available
        os_report = get_results_dir(config) / "reports" / "open_set_evaluation_report.json"
        if os_report.exists():
            with open(os_report, "r") as f:
                rep = json.load(f)
                threshold = rep.get("threshold_tau", rep.get("optimal_threshold", 0.5))
        else:
            threshold = 0.5
    logger.info(f"Filtering unknown samples with uncertainty threshold >= {threshold:.4f}")

    mask = filter_uncertain_samples(uncertainties, threshold)
    filtered_embeddings = embeddings[mask]
    filtered_labels = true_labels[mask] if true_labels is not None else None

    logger.info(f"Selected {len(filtered_embeddings)} / {len(embeddings)} samples for clustering.")

    # Clustering
    clusterer = NovelTrafficClusterer(
        algorithm=args.algorithm,
        n_clusters=args.n_clusters,
        random_state=config["project"]["random_seed"],
    )
    cluster_assignments = clusterer.fit_predict(filtered_embeddings)

    # Metrics
    metrics = compute_clustering_metrics(
        filtered_embeddings, cluster_assignments, true_labels=filtered_labels
    )

    results_dir = get_results_dir(config)
    report_path = results_dir / "reports" / "novel_discovery_report.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)

    report = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "algorithm": args.algorithm,
        "uncertainty_threshold": threshold,
        "metrics": metrics,
        "cluster_distribution": {
            int(c): int(np.sum(cluster_assignments == c)) for c in np.unique(cluster_assignments)
        },
    }

    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    logger.info(f"Discovery complete. Report saved to: {report_path}")
    logger.info(f"Discovered {metrics['n_clusters']} clusters | Purity: {metrics.get('cluster_purity', 'N/A')}")


if __name__ == "__main__":
    main()
