"""
global_local_extractor.py

Purpose: Implements the Global-Local Feature Extractor (RoNeTC Phase 2).
Combines CNN (local packet features) and Transformer (global cross-packet features)
with residual fusion to produce high-quality flow representations for each protocol view.
"""
from __future__ import annotations

import math
from typing import Dict, Tuple, Optional

import torch
import torch.nn as nn

from models.packet_splice import PacketSplice


class LocalFeatureRepresentation(nn.Module):
    """Encodes local feature information of individual packets in the flow sequence.

    Uses a 3x3 convolution layer followed by a point-wise (1x1) convolution layer
    projecting channels from in_channels (C) to out_channels (D), where D > C.
    """

    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=1)
        self.bn2 = nn.BatchNorm2d(out_channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)
        out = self.conv2(out)
        out = self.bn2(out)
        out = self.relu(out)
        return out


class GlobalFeatureRepresentation(nn.Module):
    """Captures global dependencies across packet fields using a Vision Transformer.

    Unfolds input X_L of shape (B, D, H, W) into N non-overlapping p x p patches,
    capturing state transitions of the same fields across packets.
    """

    def __init__(
        self,
        channels: int,
        patch_size: int,
        num_layers: int,
        num_heads: int,
        ff_dim: int,
        dropout: float = 0.0,
        H: Optional[int] = None,
        W: Optional[int] = None,
    ):
        super().__init__()
        self.channels = channels
        self.patch_size = patch_size
        self.H = H
        self.W = W

        if H is not None and H % patch_size != 0:
            raise ValueError(f"H ({H}) must be divisible by patch_size ({patch_size})")
        if W is not None and W % patch_size != 0:
            raise ValueError(f"W ({W}) must be divisible by patch_size ({patch_size})")

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=channels,
            nhead=num_heads,
            dim_feedforward=ff_dim,
            dropout=dropout,
            batch_first=True,
            activation="relu",
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, D, H, W = x.shape
        p = self.patch_size

        if H % p != 0 or W % p != 0:
            raise ValueError(
                f"Input spatial dimensions ({H}, {W}) must be divisible by patch_size ({p})"
            )

        n_h = H // p
        n_w = W // p
        N = n_h * n_w
        P = p * p

        # Reshape to (B, D, n_h, p, n_w, p)
        x_reshaped = x.view(B, D, n_h, p, n_w, p)
        # Permute to (B, p, p, n_h, n_w, D) -> (B, P, N, D)
        x_permuted = x_reshaped.permute(0, 3, 5, 2, 4, 1).contiguous()
        x_patches = x_permuted.view(B, P, N, D)

        # Merge B and P: (B * P, N, D) so Transformer computes across patches for each position
        x_seq = x_patches.view(B * P, N, D)
        x_trans = self.transformer(x_seq)

        # Fold back into (B, D, H, W)
        x_back = x_trans.view(B, p, p, n_h, n_w, D)
        x_folded = x_back.permute(0, 5, 3, 1, 4, 2).contiguous()
        out = x_folded.view(B, D, H, W)
        return out


class FeatureFusion(nn.Module):
    """Fuses global and local representations with a residual skip connection."""

    def __init__(self, global_channels: int, local_channels: int):
        super().__init__()
        self.pointwise = nn.Conv2d(global_channels, local_channels, kernel_size=1)
        self.fusion_conv = nn.Conv2d(
            local_channels * 2, local_channels, kernel_size=3, padding=1
        )
        self.bn = nn.BatchNorm2d(local_channels)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, global_feat: torch.Tensor, local_skip: torch.Tensor) -> torch.Tensor:
        proj = self.pointwise(global_feat)
        cat = torch.cat([proj, local_skip], dim=1)
        out = self.fusion_conv(cat)
        out = self.bn(out)
        out = self.relu(out)
        return out


class GlobalLocalFeatureExtractor(nn.Module):
    """Full single-view feature extractor: PacketSplice -> Local -> Global -> Fusion -> Pool -> Linear."""

    def __init__(
        self,
        l: int,
        H_p: int,
        W_p: int,
        r: int,
        D: int,
        patch_size: int,
        transformer_cfg: dict,
        feature_dim: int,
        pooling: str = "avg",
    ):
        super().__init__()
        self.packet_splice = PacketSplice(r=r)
        C, H, W = self.packet_splice.output_spatial_size(H_p, W_p, l)

        self.local_rep = LocalFeatureRepresentation(in_channels=C, out_channels=D)
        self.global_rep = GlobalFeatureRepresentation(
            channels=D,
            patch_size=patch_size,
            num_layers=transformer_cfg.get("num_layers", 2),
            num_heads=transformer_cfg.get("num_heads", 4),
            ff_dim=transformer_cfg.get("ff_dim", 128),
            dropout=transformer_cfg.get("dropout", 0.0),
            H=H,
            W=W,
        )
        self.fusion = FeatureFusion(global_channels=D, local_channels=C)

        if pooling == "max":
            self.pool = nn.AdaptiveMaxPool2d((1, 1))
        else:
            self.pool = nn.AdaptiveAvgPool2d((1, 1))

        self.fc = nn.Linear(C, feature_dim)

    def extract_feature_map(self, x: torch.Tensor) -> torch.Tensor:
        """Extract fused spatial feature map of shape (B, C, H, W)."""
        x_spliced = self.packet_splice(x)
        x_local = self.local_rep(x_spliced)
        x_global = self.global_rep(x_local)
        x_fused = self.fusion(x_global, x_spliced)
        return x_fused

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass producing a 1D feature vector of shape (B, feature_dim)."""
        fm = self.extract_feature_map(x)
        pooled = self.pool(fm).flatten(1)
        out = self.fc(pooled)
        return out


class MultiViewFeatureExtractor(nn.Module):
    """Processes IP Header, Transport Header, and Payload views in parallel with independent weights."""

    def __init__(
        self,
        l: int,
        ip_shape: Tuple[int, int],
        transport_shape: Tuple[int, int],
        payload_shape: Tuple[int, int],
        r: int,
        D: int,
        patch_size: int,
        transformer_cfg: dict,
        feature_dim: int,
        pooling: str = "avg",
    ):
        super().__init__()
        self.ip_extractor = GlobalLocalFeatureExtractor(
            l=l,
            H_p=ip_shape[0],
            W_p=ip_shape[1],
            r=r,
            D=D,
            patch_size=patch_size,
            transformer_cfg=transformer_cfg,
            feature_dim=feature_dim,
            pooling=pooling,
        )
        self.transport_extractor = GlobalLocalFeatureExtractor(
            l=l,
            H_p=transport_shape[0],
            W_p=transport_shape[1],
            r=r,
            D=D,
            patch_size=patch_size,
            transformer_cfg=transformer_cfg,
            feature_dim=feature_dim,
            pooling=pooling,
        )
        self.payload_extractor = GlobalLocalFeatureExtractor(
            l=l,
            H_p=payload_shape[0],
            W_p=payload_shape[1],
            r=r,
            D=D,
            patch_size=patch_size,
            transformer_cfg=transformer_cfg,
            feature_dim=feature_dim,
            pooling=pooling,
        )

    @classmethod
    def from_config(
        cls,
        config: dict,
        ip_shape: Tuple[int, int],
        transport_shape: Tuple[int, int],
        payload_shape: Tuple[int, int],
    ) -> MultiViewFeatureExtractor:
        rc = config["ronetc"]
        flow_cfg = rc["flow"]
        gle_cfg = rc["global_local_extractor"]

        return cls(
            l=flow_cfg["packets_per_flow"],
            ip_shape=ip_shape,
            transport_shape=transport_shape,
            payload_shape=payload_shape,
            r=gle_cfg["packets_per_channel"],
            D=gle_cfg["local_conv_channels"],
            patch_size=gle_cfg["patch_size"],
            transformer_cfg=gle_cfg["transformer"],
            feature_dim=gle_cfg["feature_dim"],
            pooling=gle_cfg.get("pooling", "avg"),
        )

    def forward(
        self, ip: torch.Tensor, transport: torch.Tensor, payload: torch.Tensor
    ) -> Dict[str, torch.Tensor]:
        return {
            "ip_features": self.ip_extractor(ip),
            "transport_features": self.transport_extractor(transport),
            "payload_features": self.payload_extractor(payload),
        }
