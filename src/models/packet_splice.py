"""
packet_splice.py

Purpose: Slices and arranges packets within a bidirectional flow into 2D grid
channels for the Global-Local Feature Extractor (RoNeTC Phase 1 & 2).
"""
from __future__ import annotations

import math
import torch
import torch.nn as nn
import torch.nn.functional as F


def compute_grid_shape(r: int) -> tuple[int, int]:
    """Compute (g_h, g_w) grid factors such that g_h * g_w == r and g_h <= g_w,
    maximizing g_h (closest to square grid).
    """
    if r <= 0:
        raise ValueError(f"r must be positive, got {r}")
    start = int(math.isqrt(r))
    for i in range(start, 0, -1):
        if r % i == 0:
            return (i, r // i)
    return (1, r)


class PacketSplice(nn.Module):
    """Splices groups of r packets into 2D spatial grid channels.

    Given an input tensor of shape (B, l, H_p, W_p), packets are grouped into
    channels of size r packets each. Each channel is arranged as a (g_h, g_w)
    grid of (H_p, W_p) patches, producing an output tensor of shape:
        (B, C, g_h * H_p, g_w * W_p)
    where C = ceil(l / r).
    """

    def __init__(self, r: int = 4, padding_value: float = 0.0):
        super().__init__()
        self.r = r
        self.padding_value = padding_value
        self.g_h, self.g_w = compute_grid_shape(r)

    def output_spatial_size(self, H_p: int, W_p: int, l: int) -> tuple[int, int, int]:
        """Returns (C, H, W) for the given input packet dimensions and count."""
        C = math.ceil(l / self.r)
        H = self.g_h * H_p
        W = self.g_w * W_p
        return C, H, W

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Parameters
        ----------
        x : torch.Tensor of shape (B, l, H_p, W_p)

        Returns
        -------
        torch.Tensor of shape (B, C, g_h * H_p, g_w * W_p)
        """
        B, l, H_p, W_p = x.shape
        rem = l % self.r
        if rem != 0:
            pad_packets = self.r - rem
            pad_tensor = torch.full(
                (B, pad_packets, H_p, W_p),
                self.padding_value,
                dtype=x.dtype,
                device=x.device,
            )
            x = torch.cat([x, pad_tensor], dim=1)
            l = x.shape[1]

        C = l // self.r
        # Reshape to (B, C, g_h, g_w, H_p, W_p)
        x = x.view(B, C, self.g_h, self.g_w, H_p, W_p)
        # Permute to (B, C, g_h, H_p, g_w, W_p)
        x = x.permute(0, 1, 2, 4, 3, 5).contiguous()
        # Merge spatial dims: (B, C, g_h * H_p, g_w * W_p)
        out = x.view(B, C, self.g_h * H_p, self.g_w * W_p)
        return out
