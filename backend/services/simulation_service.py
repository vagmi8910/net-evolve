"""
backend/services/simulation_service.py

Live network traffic simulation engine.
Runs an asynchronous streaming loop that samples real preprocessed multi-view flows,
executes RoNeTC+ inference, logs open-set alerts, manages KPI statistics,
and broadcasts events to connected WebSocket clients.
"""
from __future__ import annotations
import asyncio
import collections
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Set, Any
from fastapi import WebSocket

from backend.schemas.traffic import TrafficEvent
from backend.services.inference_service import InferenceService
from backend.services.incident_service import IncidentService


class SimulationService:
    _instance: Optional[SimulationService] = None

    def __init__(self):
        self.inference_service = InferenceService.get_instance()
        self.incident_service = IncidentService.get_instance()

        self.is_running: bool = False
        self.is_paused: bool = False
        self.speed: float = 1.0  # 1.0 = 1 flow/second
        self.unknown_rate: float = 0.05  # 5% default
        self.scenario: str = "Mixed Enterprise Traffic"

        self.task: Optional[asyncio.Task] = None
        self.connected_websockets: Set[WebSocket] = set()

        # Bounded event buffer (latest 500 events)
        self.events_buffer: collections.deque[TrafficEvent] = collections.deque(maxlen=500)

        # Real-time aggregated statistics
        self.total_flows: int = 0
        self.known_count: int = 0
        self.suspicious_count: int = 0
        self.unknown_count: int = 0
        self.blocked_count: int = 0
        self.latencies: collections.deque[float] = collections.deque(maxlen=100)

        # Time-bucketed volume counters (HH:MM -> count)
        self.volume_history: collections.deque[Dict[str, Any]] = collections.deque(maxlen=30)
        self.threat_counts: Dict[str, int] = collections.defaultdict(int)
        self.uncertainty_bins: List[int] = [0] * 10  # 0.0-0.1, 0.1-0.2, ... 0.9-1.0

    @classmethod
    def get_instance(cls) -> SimulationService:
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def register_websocket(self, websocket: WebSocket):
        await websocket.accept()
        self.connected_websockets.add(websocket)
        # Send initial state and recent history to newly connected client
        try:
            initial_payload = {
                "type": "INIT_STATE",
                "status": self.get_status(),
                "recent_events": [ev.model_dump() for ev in list(self.events_buffer)[-50:]],
            }
            await websocket.send_text(json.dumps(initial_payload))
        except Exception:
            pass

    def unregister_websocket(self, websocket: WebSocket):
        self.connected_websockets.discard(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        dead_sockets = set()
        text_data = json.dumps(message)
        for ws in self.connected_websockets:
            try:
                await ws.send_text(text_data)
            except Exception:
                dead_sockets.add(ws)
        for dead in dead_sockets:
            self.connected_websockets.discard(dead)

    def start(self, speed: float = 1.0, unknown_rate: float = 0.05, scenario: str = "Mixed Enterprise Traffic"):
        self.speed = speed
        self.unknown_rate = unknown_rate
        self.scenario = scenario
        self.is_running = True
        self.is_paused = False

        if self.task is None or self.task.done():
            self.task = asyncio.create_task(self._simulation_loop())

    def pause(self):
        self.is_paused = True

    def resume(self):
        self.is_paused = False

    def stop(self):
        self.is_running = False
        self.is_paused = False
        if self.task and not self.task.done():
            self.task.cancel()
            self.task = None

    def reset(self):
        self.stop()
        self.events_buffer.clear()
        self.incident_service.clear()
        self.inference_service.reset_model_to_base()
        self.total_flows = 0
        self.known_count = 0
        self.suspicious_count = 0
        self.unknown_count = 0
        self.blocked_count = 0
        self.latencies.clear()
        self.volume_history.clear()
        self.threat_counts.clear()
        self.uncertainty_bins = [0] * 10

    def get_status(self) -> Dict[str, Any]:
        avg_lat = sum(self.latencies) / len(self.latencies) if self.latencies else 12.4
        return {
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "speed": self.speed,
            "unknown_rate": self.unknown_rate,
            "scenario": self.scenario,
            "total_flows": self.total_flows,
            "known_count": self.known_count,
            "suspicious_count": self.suspicious_count,
            "unknown_count": self.unknown_count,
            "blocked_count": self.blocked_count,
            "avg_latency_ms": round(avg_lat, 2),
            "active_connections": len(self.connected_websockets),
            "threat_distribution": dict(self.threat_counts),
            "uncertainty_histogram": self.uncertainty_bins,
            "volume_history": list(self.volume_history),
        }

    async def _simulation_loop(self):
        import numpy as np

        while self.is_running:
            if self.is_paused:
                await asyncio.sleep(0.5)
                continue

            t_start = time.perf_counter()

            # Determine whether this flow should be zero-day unknown
            is_unk = False
            if self.scenario == "Attack Storm":
                # Bursty attack scenario
                is_unk = np.random.rand() < 0.50
            elif self.scenario == "Zero-Day Burst":
                is_unk = np.random.rand() < 0.25
            elif self.scenario == "Clean In-Distribution":
                is_unk = False
            else:
                # Default stochastic injection
                is_unk = np.random.rand() < self.unknown_rate

            # Sample genuine flow tensors and metadata
            ip, tr, pay, lbl, meta = self.inference_service.sample_random_flow(is_unknown=is_unk)

            # Classify using real PyTorch model
            event = self.inference_service.classify_single_tensor(
                ip, tr, pay, true_label=lbl, source_type="LIVE_SIMULATION", **meta
            )

            latency_ms = (time.perf_counter() - t_start) * 1000
            self.latencies.append(latency_ms)

            # Process event in incident management
            incident = self.incident_service.process_event(event)

            # Update metrics
            self.total_flows += 1
            if event.open_set.is_unknown:
                self.unknown_count += 1
                self.blocked_count += 1
            elif event.decision.status == "SUSPICIOUS":
                self.suspicious_count += 1
            else:
                self.known_count += 1

            self.threat_counts[event.prediction.label] += 1

            # Binned uncertainty
            u_idx = min(int(event.open_set.uncertainty * 10), 9)
            self.uncertainty_bins[u_idx] += 1

            # Time volume bucket
            curr_sec = datetime.now().strftime("%H:%M:%S")
            if not self.volume_history or self.volume_history[-1]["time"] != curr_sec:
                self.volume_history.append({"time": curr_sec, "known": 0, "unknown": 0, "total": 0})
            if event.open_set.is_unknown:
                self.volume_history[-1]["unknown"] += 1
            else:
                self.volume_history[-1]["known"] += 1
            self.volume_history[-1]["total"] += 1

            # Store in ring buffer
            self.events_buffer.append(event)

            # Broadcast over WebSocket
            ws_msg = {
                "type": "TRAFFIC_EVENT",
                "event": event.model_dump(),
                "metrics": self.get_status(),
            }
            if incident:
                ws_msg["incident"] = incident.model_dump()

            await self.broadcast(ws_msg)

            # Sleep according to speed multiplier (1.0 = 1 sec delay)
            sleep_duration = max(0.05, 1.0 / max(self.speed, 0.1))
            await asyncio.sleep(sleep_duration)
