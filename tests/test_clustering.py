import sys
from pathlib import Path
import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from discovery.clustering import (
    NovelTrafficClusterer,
    filter_uncertain_samples,
    compute_cluster_purity,
    compute_clustering_metrics,
)


class TestClustering:
    def test_filter_uncertain_samples(self):
        u = np.array([0.1, 0.4, 0.7, 0.9, 0.3])
        mask = filter_uncertain_samples(u, threshold=0.5)
        assert np.array_equal(mask, np.array([False, False, True, True, False]))

    def test_kmeans_clustering(self):
        np.random.seed(42)
        c1 = np.random.randn(20, 16) + 5
        c2 = np.random.randn(20, 16) - 5
        X = np.vstack([c1, c2])

        clusterer = NovelTrafficClusterer(algorithm="kmeans", n_clusters=2, random_state=42)
        labels = clusterer.fit_predict(X)

        assert len(labels) == 40
        assert len(np.unique(labels)) == 2

    def test_compute_cluster_purity(self):
        y_true = np.array([0, 0, 0, 1, 1, 1])
        y_pred = np.array([0, 0, 1, 1, 1, 1])
        purity = compute_cluster_purity(y_true, y_pred)
        # cluster 0 has true [0, 0] -> max 2
        # cluster 1 has true [0, 1, 1, 1] -> max 3
        # purity = (2 + 3) / 6 = 5/6 = 0.8333
        assert pytest.approx(purity, 0.01) == 5 / 6

    def test_compute_clustering_metrics(self):
        np.random.seed(42)
        c1 = np.random.randn(20, 8) + 5
        c2 = np.random.randn(20, 8) - 5
        X = np.vstack([c1, c2])
        y_true = np.array([0] * 20 + [1] * 20)

        clusterer = NovelTrafficClusterer(algorithm="kmeans", n_clusters=2, random_state=42)
        labels = clusterer.fit_predict(X)
        metrics = compute_clustering_metrics(X, labels, true_labels=y_true)

        assert metrics["n_samples"] == 40
        assert metrics["n_clusters"] == 2
        assert metrics["adjusted_rand_index"] > 0.8
        assert metrics["cluster_purity"] > 0.8
