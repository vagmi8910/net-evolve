"""
backend/schemas/discovery.py

Pydantic schemas for Novel Class Discovery (RoNeTC+ Phase 5).
"""
from __future__ import annotations
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class ClusterPoint(BaseModel):
    id: str
    x: float
    y: float
    cluster_id: int
    uncertainty: float
    ground_truth: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None


class SemanticAttackProfile(BaseModel):
    cluster_id: int
    candidate_name: str
    risk_level: str
    behavior_signature: str
    protocol_distribution: str
    payload_profile: str
    sample_count: int
    recommended_action: str


class ClusterMetrics(BaseModel):
    silhouette_score: Optional[float] = None
    cluster_purity: Optional[float] = None
    normalized_mutual_info: Optional[float] = None
    adjusted_rand_index: Optional[float] = None


class DiscoveryResponse(BaseModel):
    total_unknown_flows: int
    algorithm: str
    n_clusters: int
    points: List[ClusterPoint]
    metrics: ClusterMetrics
    profiles: List[SemanticAttackProfile]
