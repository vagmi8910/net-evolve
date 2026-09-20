"""
backend/schemas/traffic.py

Pydantic schemas for network traffic flow events, multi-view evidential opinions,
and open-set decisions.
"""
from __future__ import annotations
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class EndpointInfo(BaseModel):
    ip: str = Field(..., description="IPv4 / IPv6 address")
    port: int = Field(..., description="Port number")


class ViewOpinion(BaseModel):
    evidence: float = Field(..., description="Summed or peak non-negative evidence e_k")
    belief: float = Field(..., description="Maximum belief mass b_k")
    uncertainty: float = Field(..., description="Vacuity uncertainty u = K / S")


class PredictionInfo(BaseModel):
    label: str = Field(..., description="Predicted class name or UNKNOWN")
    class_id: int = Field(..., description="Class integer ID or -1 for unknown")
    confidence: float = Field(..., description="Confidence score [0, 1]")
    beliefs: Optional[Dict[str, float]] = Field(default=None, description="Per-class belief distribution")


class OpenSetInfo(BaseModel):
    uncertainty: float = Field(..., description="Fused Dirichlet uncertainty u")
    threshold: float = Field(..., description="Configured decision threshold tau")
    is_unknown: bool = Field(..., description="True if uncertainty >= threshold")


class DecisionInfo(BaseModel):
    status: str = Field(..., description="ALLOWED, SUSPICIOUS, or BLOCKED")
    reason: str = Field(..., description="Human-readable decision explanation")


class TrafficEvent(BaseModel):
    event_id: str
    timestamp: str
    source: EndpointInfo
    destination: EndpointInfo
    protocol: str = "TCP"
    service: str = "http"
    packets: int = 1
    bytes: int = 0
    duration: float = 0.0
    prediction: PredictionInfo
    open_set: OpenSetInfo
    decision: DecisionInfo
    views: Dict[str, ViewOpinion]
    fused: ViewOpinion
    ground_truth: Optional[str] = None
    source_type: str = "LIVE_SIMULATION"
    features: Optional[Dict[str, Any]] = None


class BatchInferenceRequest(BaseModel):
    flows: List[Dict[str, Any]] = Field(..., description="List of raw tabular flow feature dictionaries")
    source_type: str = "API_REQUEST"


class BatchInferenceResponse(BaseModel):
    total_processed: int
    known_count: int
    unknown_count: int
    avg_latency_ms: float
    events: List[TrafficEvent]
