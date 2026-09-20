"""
opinion_generator.py

Purpose: Implements the Single-View and Multi-View Opinion Generators (RoNeTC Phase 3).
Converts extracted feature embeddings into Dirichlet distribution parameters and
subjective logic opinions (belief masses and uncertainty) using a softplus activation.
"""
from __future__ import annotations

from typing import Dict, Any

import torch
import torch.nn as nn
import torch.nn.functional as F


class SingleViewOpinionGenerator(nn.Module):
    """Generates a subjective logic opinion from a 1D feature representation of a single view.

    Parameters
    ----------
    feature_dim : int
        Dimension of the input feature vector.
    num_classes : int
        Number of known classes (K).
    """

    def __init__(self, feature_dim: int, num_classes: int):
        super().__init__()
        self.feature_dim = feature_dim
        self.num_classes = num_classes
        self.fc = nn.Linear(feature_dim, num_classes)

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """Parameters
        ----------
        x : torch.Tensor of shape (B, feature_dim)

        Returns
        -------
        Dict with keys:
            - 'evidence': shape (B, K), non-negative support e_k >= 0
            - 'alpha': shape (B, K), Dirichlet parameters alpha_k = e_k + 1
            - 'belief': shape (B, K), belief mass b_k = e_k / S
            - 'uncertainty': shape (B, 1), vacuity / uncertainty u = K / S
            - 'S': shape (B, 1), Dirichlet intensity S = sum(alpha)
        """
        evidence = F.softplus(self.fc(x))
        alpha = evidence + 1.0
        S = torch.sum(alpha, dim=1, keepdim=True)
        belief = evidence / S
        uncertainty = self.num_classes / S

        return {
            "evidence": evidence,
            "alpha": alpha,
            "belief": belief,
            "uncertainty": uncertainty,
            "S": S,
        }


class MultiViewOpinionGenerator(nn.Module):
    """Generates opinions independently for IP, Transport, and Payload views."""

    def __init__(self, feature_dim: int, num_classes: int):
        super().__init__()
        self.feature_dim = feature_dim
        self.num_classes = num_classes

        self.ip_opinion = SingleViewOpinionGenerator(feature_dim, num_classes)
        self.transport_opinion = SingleViewOpinionGenerator(feature_dim, num_classes)
        self.payload_opinion = SingleViewOpinionGenerator(feature_dim, num_classes)

    @classmethod
    def from_config(cls, config: dict) -> MultiViewOpinionGenerator:
        rc = config["ronetc"]
        feature_dim = rc["global_local_extractor"]["feature_dim"]
        num_classes = rc["opinion_generator"]["num_classes"]
        return cls(feature_dim=feature_dim, num_classes=num_classes)

    def forward(self, features: Dict[str, torch.Tensor]) -> Dict[str, Dict[str, torch.Tensor]]:
        """Parameters
        ----------
        features : Dict with 'ip_features', 'transport_features', 'payload_features'

        Returns
        -------
        Dict with keys 'ip', 'transport', 'payload' mapping to opinion dicts.
        """
        return {
            "ip": self.ip_opinion(features["ip_features"]),
            "transport": self.transport_opinion(features["transport_features"]),
            "payload": self.payload_opinion(features["payload_features"]),
        }
