"""
evidence_fusion.py

Purpose: Implements Dempster-Shafer Multi-View Evidence Theory Fusion (RoNeTC Phase 4).
Dynamically combines opinions (belief scores and uncertainties) from multiple protocol views
using Dempster's rule of combination to produce a joint opinion and overall uncertainty.
"""
from __future__ import annotations

from typing import List, Dict, Any

import torch
import torch.nn as nn


class DempsterShaferFusion(nn.Module):
    """Combines opinions from multiple views using Dempster's combination rule.

    For two opinions M1 = ({b_k^1}, u^1) and M2 = ({b_k^2}, u^2):
        C = sum_{i != j} b_i^1 * b_j^2  (measure of conflict)
        b_k = (b_k^1 * b_k^2 + b_k^1 * u^2 + b_k^2 * u^1) / (1 - C)
        u = (u^1 * u^2) / (1 - C)

    Induced Dirichlet parameters:
        S = K / u
        e_k = b_k * S
        alpha_k = e_k + 1
    """

    def __init__(self, conflict_clamp_min: float = 1e-7):
        super().__init__()
        self.conflict_clamp_min = conflict_clamp_min

    @classmethod
    def from_config(cls, config: dict) -> DempsterShaferFusion:
        clamp_min = config.get("ronetc", {}).get("fusion", {}).get("conflict_clamp_min", 1e-7)
        return cls(conflict_clamp_min=float(clamp_min))

    def fuse_two(self, op1: Dict[str, torch.Tensor], op2: Dict[str, torch.Tensor]) -> Dict[str, torch.Tensor]:
        b1, u1 = op1["belief"], op1["uncertainty"]
        b2, u2 = op2["belief"], op2["uncertainty"]

        K = b1.shape[-1]

        # Conflict C = sum_{i != j} b1_i * b2_j = (sum b1)*(sum b2) - sum(b1 * b2)
        sum_b1 = torch.sum(b1, dim=-1, keepdim=True)
        sum_b2 = torch.sum(b2, dim=-1, keepdim=True)
        sum_prod = torch.sum(b1 * b2, dim=-1, keepdim=True)
        C = sum_b1 * sum_b2 - sum_prod

        denom = 1.0 - C
        denom = torch.clamp(denom, min=self.conflict_clamp_min)

        # Fused belief and uncertainty
        fused_b = (b1 * b2 + b1 * u2 + b2 * u1) / denom
        fused_u = (u1 * u2) / denom

        # Induced Dirichlet parameters (Eq. 7)
        u_safe = torch.clamp(fused_u, min=self.conflict_clamp_min)
        S = K / u_safe
        evidence = fused_b * S
        alpha = evidence + 1.0

        return {
            "belief": fused_b,
            "uncertainty": fused_u,
            "S": S,
            "evidence": evidence,
            "alpha": alpha,
        }

    def forward(self, opinions: List[Dict[str, torch.Tensor]]) -> Dict[str, torch.Tensor]:
        if not opinions:
            raise ValueError("opinions list cannot be empty")

        if len(opinions) == 1:
            op = opinions[0]
            if "S" not in op or "alpha" not in op:
                K = op["belief"].shape[-1]
                u_safe = torch.clamp(op["uncertainty"], min=self.conflict_clamp_min)
                S = K / u_safe
                e = op["belief"] * S
                alpha = e + 1.0
                return {
                    "belief": op["belief"],
                    "uncertainty": op["uncertainty"],
                    "S": S,
                    "evidence": e,
                    "alpha": alpha,
                }
            return op

        current = opinions[0]
        for next_op in opinions[1:]:
            current = self.fuse_two(current, next_op)

        return current
