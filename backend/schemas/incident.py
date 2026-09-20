"""
backend/schemas/incident.py

Pydantic schemas for SOC security incident management.
"""
from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field


class Incident(BaseModel):
    id: str = Field(..., description="Unique incident ID e.g. INC-001")
    title: str = Field(..., description="Brief title of incident")
    severity: str = Field(..., description="CRITICAL, HIGH, MEDIUM, LOW")
    status: str = Field(default="NEW", description="NEW, INVESTIGATING, CONTAINED, RESOLVED, FALSE_POSITIVE")
    detected_at: str
    source_ip: str
    destination_ip: str
    attack_category: str = Field(..., description="Candidate or predicted category")
    uncertainty: float
    confidence: float
    occurrences: int = 1
    first_seen: str
    last_seen: str
    event_ids: List[str] = Field(default_factory=list)
    cluster_id: Optional[int] = None
    recommendations: List[str] = Field(default_factory=list)


class IncidentUpdateRequest(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    notes: Optional[str] = None
