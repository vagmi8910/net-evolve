"""
test_incremental_learning.py

Unit tests for Incremental Learning head expansion, ExemplarBuffer, and continual training.
"""
import sys
from pathlib import Path
import pytest
import torch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from models.ronetc_model import RoNeTCClassifier
from preprocessing.view_encoder import ViewEncoder
from incremental.continual_learner import (
    expand_classifier_head,
    ExemplarBuffer,
    IncrementalLearner,
)


def _make_config(num_classes=5):
    return {
        "ronetc": {
            "flow": {"packets_per_flow": 12},
            "views": {
                "ip_header": {"max_bytes": 64},
                "transport_header": {"max_bytes": 64},
                "payload": {"max_bytes": 64},
            },
            "global_local_extractor": {
                "enabled": True,
                "packets_per_channel": 4,
                "patch_size": 2,
                "local_conv_channels": 32,
                "transformer": {
                    "num_layers": 1,
                    "num_heads": 4,
                    "ff_dim": 64,
                    "dropout": 0.0,
                },
                "pooling": "avg",
                "feature_dim": 64,
            },
            "opinion_generator": {
                "num_classes": num_classes,
            },
            "fusion": {
                "combination_order": ["ip", "transport", "payload"],
                "conflict_clamp_min": 1e-7,
            },
        }
    }


class TestIncrementalLearning:
    def test_expand_classifier_head(self):
        config = _make_config(num_classes=5)
        enc = ViewEncoder(64)
        model = RoNeTCClassifier.from_config(config, enc.shape, enc.shape, enc.shape)

        old_weight = model.opinion_generator.ip_opinion.fc.weight.clone()
        new_k = expand_classifier_head(model, num_new_classes=2)

        assert new_k == 7
        assert model.opinion_generator.num_classes == 7
        assert model.opinion_generator.ip_opinion.fc.out_features == 7
        assert model.opinion_generator.transport_opinion.fc.out_features == 7
        assert model.opinion_generator.payload_opinion.fc.out_features == 7

        # Check that old weights were preserved
        new_weight = model.opinion_generator.ip_opinion.fc.weight
        assert torch.allclose(new_weight[:5], old_weight)

    def test_exemplar_buffer(self):
        buffer = ExemplarBuffer(max_per_class=10)
        ip = torch.randn(25, 12, 8, 8)
        tr = torch.randn(25, 12, 8, 8)
        pay = torch.randn(25, 12, 8, 8)
        labels = torch.tensor([0] * 15 + [1] * 10)

        buffer.add_samples(ip, tr, pay, labels)
        ex_ip, ex_tr, ex_pay, ex_labels = buffer.get_all_exemplars()

        # Class 0 capped at 10, Class 1 capped at 10 -> total 20
        assert len(ex_ip) == 20
        assert len(ex_labels) == 20

    def test_incremental_learner_step(self):
        config = _make_config(num_classes=5)
        enc = ViewEncoder(64)
        model = RoNeTCClassifier.from_config(config, enc.shape, enc.shape, enc.shape)
        device = torch.device("cpu")

        learner = IncrementalLearner(model, device=device)

        # Store prior known classes (0 to 4)
        prior_ip = torch.randn(10, 12, 8, 8)
        prior_tr = torch.randn(10, 12, 8, 8)
        prior_pay = torch.randn(10, 12, 8, 8)
        prior_labels = torch.tensor([0, 1, 2, 3, 4, 0, 1, 2, 3, 4])
        learner.store_prior_knowledge(prior_ip, prior_tr, prior_pay, prior_labels)

        # Learn new class (label 5)
        new_ip = torch.randn(6, 12, 8, 8)
        new_tr = torch.randn(6, 12, 8, 8)
        new_pay = torch.randn(6, 12, 8, 8)
        new_labels = torch.tensor([5, 5, 5, 5, 5, 5])

        result = learner.learn_new_classes(new_ip, new_tr, new_pay, new_labels, epochs=1, batch_size=8)
        assert result["total_classes"] == 6

        # Test continual evaluation
        eval_res = learner.evaluate_continual(
            prior_ip, prior_tr, prior_pay, prior_labels,
            old_classes=[0, 1, 2, 3, 4],
            new_classes=[5]
        )
        assert "overall_accuracy" in eval_res
        assert "forgetting_measure" in eval_res
