"""
ronetc_model.py

Purpose: Unified RoNeTC PyTorch model integrating multi-view feature extraction,
per-view Dirichlet opinion generation, and Dempster-Shafer evidence fusion.
"""
from __future__ import annotations

from typing import List, Dict, Tuple, Optional

import torch
import torch.nn as nn

from models.global_local_extractor import MultiViewFeatureExtractor
from models.opinion_generator import MultiViewOpinionGenerator
from models.evidence_fusion import DempsterShaferFusion


class RoNeTCClassifier(nn.Module):
    """Unified RoNeTC architecture combining feature extraction, evidential opinion
    generation, and multi-view fusion.
    """

    VALID_VIEWS = {"ip", "transport", "payload"}

    def __init__(
        self,
        extractor: MultiViewFeatureExtractor,
        opinion_generator: MultiViewOpinionGenerator,
        fusion: DempsterShaferFusion,
        combination_order: Optional[List[str]] = None,
    ):
        super().__init__()
        if combination_order is None:
            combination_order = ["ip", "transport", "payload"]

        for v in combination_order:
            if v not in self.VALID_VIEWS:
                raise ValueError(f"Invalid view '{v}' in combination_order. Must be one of {self.VALID_VIEWS}")

        self.extractor = extractor
        self.opinion_generator = opinion_generator
        self.fusion = fusion
        self.combination_order = combination_order

    @classmethod
    def from_config(
        cls,
        config: dict,
        ip_shape: Tuple[int, int],
        transport_shape: Tuple[int, int],
        payload_shape: Tuple[int, int],
    ) -> RoNeTCClassifier:
        extractor = MultiViewFeatureExtractor.from_config(
            config,
            ip_shape=ip_shape,
            transport_shape=transport_shape,
            payload_shape=payload_shape,
        )
        opinion_generator = MultiViewOpinionGenerator.from_config(config)
        fusion = DempsterShaferFusion.from_config(config)
        combination_order = config.get("ronetc", {}).get("fusion", {}).get(
            "combination_order", ["ip", "transport", "payload"]
        )
        return cls(
            extractor=extractor,
            opinion_generator=opinion_generator,
            fusion=fusion,
            combination_order=combination_order,
        )

    def forward(
        self, ip: torch.Tensor, transport: torch.Tensor, payload: torch.Tensor
    ) -> Dict[str, Dict[str, torch.Tensor]]:
        """Forward pass for multi-view inputs.

        Parameters
        ----------
        ip, transport, payload : torch.Tensor of shape (B, l, H, W)

        Returns
        -------
        Dict with keys: 'ip', 'transport', 'payload', 'fused'
        Each value is an opinion dict with 'evidence', 'alpha', 'belief', 'uncertainty', 'S'.
        """
        features = self.extractor(ip, transport, payload)
        opinions = self.opinion_generator(features)

        ordered_opinions = [opinions[view] for view in self.combination_order]
        fused_opinion = self.fusion(ordered_opinions)

        opinions["fused"] = fused_opinion
        return opinions

    def extract_embeddings(
        self, ip: torch.Tensor, transport: torch.Tensor, payload: torch.Tensor
    ) -> torch.Tensor:
        """Extract concatenated multi-view feature embeddings for clustering / discovery.

        Returns
        -------
        torch.Tensor of shape (B, 3 * feature_dim)
        """
        features = self.extractor(ip, transport, payload)
        return torch.cat(
            [features["ip_features"], features["transport_features"], features["payload_features"]],
            dim=-1,
        )

