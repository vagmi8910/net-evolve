"""
clustering.py

Purpose: Unknown Traffic Discovery (RoNeTC+ Phase 5).
Selects high-uncertainty network traffic flows using Dirichlet uncertainty estimates,
extracts multi-view latent representations, and clusters them using K-Means, DBSCAN,
or HDBSCAN to discover candidate novel traffic / zero-day attack classes.
"""
from __future__ import annotations

from typing import Dict, Any, Optional, Tuple

import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics import (
    adjusted_rand_score,
    normalized_mutual_info_score,
    silhouette_score,
)

from utils.logger import get_logger

logger = get_logger(__name__)


def filter_uncertain_samples(
    uncertainties: np.ndarray,
    threshold: float,
) -> np.ndarray:
    """Returns boolean mask of samples whose uncertainty exceeds the threshold."""
    return uncertainties >= threshold


def compute_cluster_purity(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Computes cluster purity: sum_k (max_j |c_k cap t_j|) / N."""
    if len(y_true) == 0:
        return 0.0
    purity_sum = 0
    unique_clusters = np.unique(y_pred)
    for c in unique_clusters:
        mask = (y_pred == c)
        if np.sum(mask) == 0:
            continue
        labels_in_cluster = y_true[mask]
        _, counts = np.unique(labels_in_cluster, return_counts=True)
        purity_sum += counts.max()
    return float(purity_sum / len(y_true))


def compute_clustering_metrics(
    embeddings: np.ndarray,
    cluster_labels: np.ndarray,
    true_labels: Optional[np.ndarray] = None,
) -> Dict[str, Any]:
    """Computes intrinsic and extrinsic clustering evaluation metrics."""
    metrics: Dict[str, Any] = {
        "n_samples": len(embeddings),
        "n_clusters": len(np.unique(cluster_labels[cluster_labels >= 0])),
        "n_noise": int(np.sum(cluster_labels == -1)),
    }

    # Silhouette score (requires at least 2 non-noise clusters and n_samples > n_clusters)
    valid_mask = cluster_labels >= 0
    if np.sum(valid_mask) > metrics["n_clusters"] > 1:
        try:
            metrics["silhouette_score"] = float(
                silhouette_score(embeddings[valid_mask], cluster_labels[valid_mask])  # type: ignore
            )
        except Exception as e:
            logger.warning(f"Could not compute silhouette score: {e}")
            metrics["silhouette_score"] = None
    else:
        metrics["silhouette_score"] = None

    # Extrinsic metrics against ground-truth unknown classes
    if true_labels is not None:
        metrics["adjusted_rand_index"] = float(
            adjusted_rand_score(true_labels, cluster_labels)  # type: ignore
        )
        metrics["normalized_mutual_info"] = float(
            normalized_mutual_info_score(true_labels, cluster_labels)  # type: ignore
        )
        metrics["cluster_purity"] = compute_cluster_purity(true_labels, cluster_labels)

    return metrics


class NovelTrafficClusterer:
    """Clusters latent flow representations to discover novel attack classes."""

    def __init__(
        self,
        algorithm: str = "kmeans",
        n_clusters: int = 5,
        eps: float = 0.5,
        min_samples: int = 5,
        random_state: int = 42,
    ):
        self.algorithm = algorithm.lower()
        self.n_clusters = n_clusters
        self.eps = eps
        self.min_samples = min_samples
        self.random_state = random_state
        self.model: Any = None

    def fit_predict(self, embeddings: np.ndarray) -> np.ndarray:
        """Fits clustering algorithm on embeddings and returns cluster labels."""
        if len(embeddings) == 0:
            return np.array([], dtype=int)

        if self.algorithm == "kmeans":
            k = min(self.n_clusters, len(embeddings))
            self.model = KMeans(
                n_clusters=k,
                random_state=self.random_state,
                n_init="auto",
            )
            labels = self.model.fit_predict(embeddings)  # type: ignore
        elif self.algorithm == "dbscan":
            self.model = DBSCAN(eps=self.eps, min_samples=self.min_samples)
            labels = self.model.fit_predict(embeddings)  # type: ignore
        elif self.algorithm == "hdbscan":
            try:
                import hdbscan  # type: ignore[import-not-found]
                self.model = hdbscan.HDBSCAN(min_cluster_size=self.min_samples)
                labels = np.asarray(self.model.fit_predict(embeddings))
            except ImportError:
                logger.warning("hdbscan package not installed. Falling back to DBSCAN.")
                self.model = DBSCAN(eps=self.eps, min_samples=self.min_samples)
                labels = self.model.fit_predict(embeddings)  # type: ignore
        else:
            raise ValueError(f"Unknown clustering algorithm: {self.algorithm}")

        return np.asarray(labels)
