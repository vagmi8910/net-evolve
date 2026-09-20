"""
backend/main.py

FastAPI application gateway for NetEvolve Security (SOC Platform).
Exposes REST and WebSocket endpoints for real-time traffic monitoring,
RoNeTC+ evidential inference, incident management, zero-day discovery,
and continual learning.
"""
from __future__ import annotations
import json
from pathlib import Path
from typing import Dict, List, Optional, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.schemas.traffic import TrafficEvent, BatchInferenceRequest, BatchInferenceResponse
from backend.schemas.incident import Incident, IncidentUpdateRequest
from backend.schemas.discovery import DiscoveryResponse
from backend.schemas.model import ModelInfo, ContinualUpdateResponse
from backend.services.inference_service import InferenceService
from backend.services.simulation_service import SimulationService
from backend.services.incident_service import IncidentService
from backend.services.discovery_service import DiscoveryService
from backend.services.continual_service import ContinualService

ROOT_DIR = Path(__file__).resolve().parents[1]

app = FastAPI(
    title="NetEvolve Security Gateway API",
    description="Enterprise SOC middleware powered by RoNeTC+ Multi-View Evidential Deep Learning",
    version="1.2.0",
)

# Enable CORS for Next.js frontend (ports 3000, 3001, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service singletons
inference_svc = InferenceService.get_instance()
incident_svc = IncidentService.get_instance()
discovery_svc = DiscoveryService.get_instance()
continual_svc = ContinualService.get_instance()
sim_svc = SimulationService.get_instance()

# Load seed registry
SEED_REGISTRY_PATH = ROOT_DIR / "data" / "demo" / "demo_seed_registry.json"
seed_registry: Dict[str, Any] = {"seeds": {}, "category_index": {}}
if SEED_REGISTRY_PATH.exists():
    with open(SEED_REGISTRY_PATH, "r") as f:
        seed_registry = json.load(f)


# -------------------------------------------------------------
# SYSTEM & HEALTH PROBES
# -------------------------------------------------------------
@app.get("/api/health")
def get_health():
    return {
        "status": "HEALTHY",
        "service": "NetEvolve Security Gateway",
        "version": "1.2.0",
        "model_loaded": inference_svc.model is not None,
        "active_classes": inference_svc.current_classes,
        "active_connections": len(sim_svc.connected_websockets),
    }


@app.get("/api/model/info", response_model=ModelInfo)
def get_model_info():
    return ModelInfo(
        active_classes=list(inference_svc.current_classes),
        discovered_classes=list(inference_svc.learned_attacks),
        status="EXPANDED" if inference_svc.is_expanded else "ACTIVE",
    )


# -------------------------------------------------------------
# WEBSOCKET REAL-TIME TRAFFIC STREAM
# -------------------------------------------------------------
@app.websocket("/ws/traffic")
async def websocket_traffic_endpoint(websocket: WebSocket):
    await sim_svc.register_websocket(websocket)
    try:
        while True:
            # Keep socket alive and allow client to send control messages
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                cmd = msg.get("action")
                if cmd == "START":
                    sim_svc.start(
                        speed=float(msg.get("speed", 1.0)),
                        unknown_rate=float(msg.get("unknown_rate", 0.05)),
                        scenario=str(msg.get("scenario", "Mixed Enterprise Traffic")),
                    )
                elif cmd == "PAUSE":
                    sim_svc.pause()
                elif cmd == "RESUME":
                    sim_svc.resume()
                elif cmd == "STOP":
                    sim_svc.stop()
            except Exception:
                pass
    except WebSocketDisconnect:
        sim_svc.unregister_websocket(websocket)
    except Exception:
        sim_svc.unregister_websocket(websocket)


# -------------------------------------------------------------
# SIMULATION CONTROLS (REST)
# -------------------------------------------------------------
class SimStartRequest(BaseModel):
    speed: float = 1.0
    unknown_rate: float = 0.05
    scenario: str = "Mixed Enterprise Traffic"


@app.post("/api/simulation/start")
def start_simulation(req: SimStartRequest):
    sim_svc.start(speed=req.speed, unknown_rate=req.unknown_rate, scenario=req.scenario)
    return {"status": "STARTED", "details": sim_svc.get_status()}


@app.post("/api/simulation/pause")
def pause_simulation():
    sim_svc.pause()
    return {"status": "PAUSED", "details": sim_svc.get_status()}


@app.post("/api/simulation/resume")
def resume_simulation():
    sim_svc.resume()
    return {"status": "RESUMED", "details": sim_svc.get_status()}


@app.post("/api/simulation/stop")
def stop_simulation():
    sim_svc.stop()
    return {"status": "STOPPED", "details": sim_svc.get_status()}


@app.post("/api/simulation/reset")
def reset_simulation():
    sim_svc.reset()
    return {"status": "RESET", "details": sim_svc.get_status()}


@app.get("/api/simulation/status")
def get_simulation_status():
    return sim_svc.get_status()


# -------------------------------------------------------------
# LIVE TRAFFIC & METRICS
# -------------------------------------------------------------
@app.get("/api/traffic/live")
def get_live_traffic(limit: int = 100):
    events = [ev.model_dump() for ev in list(sim_svc.events_buffer)[-limit:]]
    events.reverse()  # Newest first
    return {
        "events": events,
        "metrics": sim_svc.get_status(),
    }


@app.get("/api/metrics")
def get_soc_metrics():
    status = sim_svc.get_status()
    total = max(1, status["total_flows"])
    return {
        "kpis": {
            "total_flows": status["total_flows"],
            "known_flows": status["known_count"],
            "suspicious_flows": status["suspicious_count"],
            "unknown_flows": status["unknown_count"],
            "blocked_flows": status["blocked_count"],
            "avg_latency_ms": status["avg_latency_ms"],
            "known_percentage": round((status["known_count"] / total) * 100, 1),
            "unknown_percentage": round((status["unknown_count"] / total) * 100, 1),
        },
        "threat_distribution": status["threat_distribution"],
        "uncertainty_histogram": status["uncertainty_histogram"],
        "volume_history": status["volume_history"],
    }


# -------------------------------------------------------------
# INFERENCE & DEMO SEED ATTACKS
# -------------------------------------------------------------
@app.get("/api/demo/seeds")
def get_demo_seeds():
    return {
        "categories": list(seed_registry.get("category_index", {}).keys()),
        "category_index": seed_registry.get("category_index", {}),
        "total_seeds": seed_registry.get("metadata", {}).get("total_seeds", 0),
    }


@app.get("/api/demo/seeds/{category}")
def get_category_seeds(category: str):
    idx_map = seed_registry.get("category_index", {})
    matched_key = None
    for k in idx_map:
        if k.lower() == category.lower():
            matched_key = k
            break
    if not matched_key:
        raise HTTPException(status_code=404, detail=f"Category '{category}' not found in seed library.")
    seed_ids = idx_map[matched_key]
    seeds = [seed_registry["seeds"][sid] for sid in seed_ids if sid in seed_registry["seeds"]]
    return {"category": matched_key, "count": len(seeds), "seeds": seeds}


@app.post("/api/demo/seeds/{seed_id}/run", response_model=TrafficEvent)
def run_seed_attack(seed_id: str):
    seeds = seed_registry.get("seeds", {})
    if seed_id not in seeds:
        raise HTTPException(status_code=404, detail=f"Seed ID '{seed_id}' not found.")
    seed = seeds[seed_id]
    category = seed["category"]
    is_unk = seed.get("is_unknown", False)

    # Sample realistic tensor representations matching this category
    ip, tr, pay, lbl, _ = inference_svc.sample_random_flow(is_unknown=is_unk)

    # Execute actual inference pipeline
    event = inference_svc.classify_single_tensor(
        ip,
        tr,
        pay,
        true_label=category,
        source_ip=seed["source_ip"],
        source_port=seed["source_port"],
        dest_ip=seed["dest_ip"],
        dest_port=seed["dest_port"],
        protocol=seed["protocol"],
        service=seed["service"],
        packets=seed["packets"],
        bytes=seed["bytes"],
        duration=seed["duration"],
        source_type="DEMO_SEED",
    )

    # Record into simulation buffer & incident store
    sim_svc.events_buffer.append(event)
    sim_svc.total_flows += 1
    if event.open_set.is_unknown:
        sim_svc.unknown_count += 1
        sim_svc.blocked_count += 1
    else:
        sim_svc.known_count += 1
    sim_svc.threat_counts[event.prediction.label] += 1

    incident = incident_svc.process_event(event)

    return event


# -------------------------------------------------------------
# INCIDENT MANAGEMENT
# -------------------------------------------------------------
@app.get("/api/incidents", response_model=List[Incident])
def list_incidents(status: Optional[str] = None, severity: Optional[str] = None):
    return incident_svc.list_incidents(status=status, severity=severity)


@app.get("/api/incidents/{incident_id}", response_model=Incident)
def get_incident(incident_id: str):
    inc = incident_svc.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return inc


@app.patch("/api/incidents/{incident_id}", response_model=Incident)
def update_incident(incident_id: str, req: IncidentUpdateRequest):
    inc = incident_svc.update_incident(incident_id, req)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return inc


# -------------------------------------------------------------
# NOVEL CLASS DISCOVERY
# -------------------------------------------------------------
@app.get("/api/discovery/clusters", response_model=DiscoveryResponse)
def get_discovery_clusters(algorithm: str = "kmeans", n_clusters: int = 5):
    return discovery_svc.run_clustering(algorithm=algorithm, n_clusters=n_clusters)


@app.post("/api/discovery/run", response_model=DiscoveryResponse)
def trigger_discovery_run(algorithm: str = "kmeans", n_clusters: int = 5):
    return discovery_svc.run_clustering(algorithm=algorithm, n_clusters=n_clusters)


# -------------------------------------------------------------
# CONTINUAL LEARNING / MODEL EVOLUTION
# -------------------------------------------------------------
@app.post("/api/continual-learning/start", response_model=ContinualUpdateResponse)
def start_continual_learning():
    return continual_svc.execute_continual_update()


@app.post("/api/continual-learning/reset")
def reset_continual_learning():
    continual_svc.reset_to_base()
    return {"status": "RESET_TO_BASE_5_CLASSES", "active_classes": inference_svc.current_classes}
