"""
backend/services/incident_service.py

In-memory and persistent incident store for SOC triage.
Manages automatic incident creation from high-uncertainty zero-day events,
severity scoring, deduplication, and investigation lifecycle transitions.
"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from backend.schemas.traffic import TrafficEvent
from backend.schemas.incident import Incident, IncidentUpdateRequest


class IncidentService:
    _instance: Optional[IncidentService] = None

    def __init__(self):
        self.incidents: Dict[str, Incident] = {}
        # Mapping from (source_ip, category) to incident_id for deduplication
        self.active_groups: Dict[str, str] = {}

    @classmethod
    def get_instance(cls) -> IncidentService:
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def process_event(self, event: TrafficEvent) -> Optional[Incident]:
        """Creates or updates a security incident if the event is rejected as unknown/suspicious."""
        if not event.open_set.is_unknown and event.decision.status == "ALLOWED":
            return None

        u = event.open_set.uncertainty
        severity = "CRITICAL" if u >= 0.40 else ("HIGH" if u >= 0.25 else "MEDIUM")
        attack_category = event.ground_truth if event.ground_truth else "Potential Zero-Day"
        group_key = f"{event.source.ip}:{attack_category}"

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if group_key in self.active_groups and self.active_groups[group_key] in self.incidents:
            inc_id = self.active_groups[group_key]
            inc = self.incidents[inc_id]
            inc.occurrences += 1
            inc.last_seen = now_str
            inc.uncertainty = max(inc.uncertainty, u)
            if event.event_id not in inc.event_ids:
                inc.event_ids.append(event.event_id)
            return inc

        # Create new incident
        inc_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
        recommendations = [
            f"Inspect source IP {event.source.ip} connection persistence and geographic origin.",
            f"Review multi-view packet features: Transport uncertainty was {event.views['transport'].uncertainty:.3f}.",
            "Quarantine endpoint if repeated payload entropy exceeds baseline thresholds.",
            "Forward captured flow embeddings to Zero-Day Discovery clustering pool.",
        ]

        inc = Incident(
            id=inc_id,
            title=f"Zero-Day Anomaly from {event.source.ip} ({attack_category})",
            severity=severity,
            status="NEW",
            detected_at=now_str,
            source_ip=event.source.ip,
            destination_ip=event.destination.ip,
            attack_category=f"Candidate: {attack_category}-like" if "like" not in attack_category else attack_category,
            uncertainty=round(u, 4),
            confidence=event.prediction.confidence,
            occurrences=1,
            first_seen=now_str,
            last_seen=now_str,
            event_ids=[event.event_id],
            cluster_id=None,
            recommendations=recommendations,
        )

        self.incidents[inc_id] = inc
        self.active_groups[group_key] = inc_id
        return inc

    def list_incidents(
        self,
        status: Optional[str] = None,
        severity: Optional[str] = None,
    ) -> List[Incident]:
        res = list(self.incidents.values())
        if status:
            res = [i for i in res if i.status.upper() == status.upper()]
        if severity:
            res = [i for i in res if i.severity.upper() == severity.upper()]
        # Sort newest first
        res.sort(key=lambda x: x.last_seen, reverse=True)
        return res

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        return self.incidents.get(incident_id)

    def update_incident(self, incident_id: str, update: IncidentUpdateRequest) -> Optional[Incident]:
        inc = self.incidents.get(incident_id)
        if not inc:
            return None
        if update.status:
            inc.status = update.status.upper()
        if update.severity:
            inc.severity = update.severity.upper()
        return inc

    def clear(self):
        self.incidents.clear()
        self.active_groups.clear()
