"""
backend/schemas/model.py

Pydantic schemas for Model Observability and Continual Learning status.
"""
from __future__ import annotations
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class ModelInfo(BaseModel):
    name: str = "RoNeTC+"
    version: str = "1.2.0"
    framework: str = "PyTorch 2.4.1"
    architecture: str = "Multi-View Evidential Neural Network"
    total_parameters: int = 186240
    open_set_threshold: float = 0.1844
    views: List[str] = [
        "IP View (Spatial Shape: 11x11, Features: 9)",
        "Transport View (Spatial Shape: 11x11, Features: 7)",
        "Payload View (Spatial Shape: 11x11, Features: 6)",
    ]
    fusion_mechanism: str = "Dempster-Shafer Combination"
    base_classes: List[str] = ["Normal", "DoS", "Exploits", "Fuzzers", "Generic"]
    active_classes: List[str] = ["Normal", "DoS", "Exploits", "Fuzzers", "Generic"]
    discovered_classes: List[str] = []
    checkpoint_path: str = "models/ronetc/best_model.pt"
    status: str = "ACTIVE"
    benchmarks: Dict[str, Any] = {
        "closed_set_accuracy": 0.7913,
        "closed_set_macro_f1": 0.6952,
        "open_set_auroc": 0.9845,
        "known_retention_tpr": 0.9912,
        "unknown_detection_tnr": 0.9840,
        "discovery_purity": 0.7740,
        "catastrophic_forgetting_clean": 0.0000,
    }


class ContinualUpdateStep(BaseModel):
    step_number: int
    name: str
    status: str
    detail: str


class ContinualUpdateResponse(BaseModel):
    success: bool
    status: str
    total_classes: int
    active_classes: List[str]
    historical_accuracy: float
    new_class_accuracy: float
    forgetting_rate: float
    steps: List[ContinualUpdateStep]
