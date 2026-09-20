/**
 * frontend/hooks/useSocStream.ts
 * Real-time WebSocket hook for streaming traffic events, KPI statistics,
 * and security alerts directly from the backend simulation engine.
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TrafficEvent, SimStatus, Incident } from "@/types/soc";
import { WS_BASE, api } from "@/lib/api";

const DEFAULT_METRICS: SimStatus = {
  is_running: false,
  is_paused: false,
  speed: 1.0,
  unknown_rate: 0.05,
  scenario: "Mixed Enterprise Traffic",
  total_flows: 0,
  known_count: 0,
  suspicious_count: 0,
  unknown_count: 0,
  blocked_count: 0,
  avg_latency_ms: 12.4,
  active_connections: 0,
  threat_distribution: {},
  uncertainty_histogram: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  volume_history: [],
};

export function useSocStream() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<"CONNECTED" | "RECONNECTING" | "DISCONNECTED">("DISCONNECTED");
  const [lastEventTimestamp, setLastEventTimestamp] = useState<number | null>(null);
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [metrics, setMetrics] = useState<SimStatus>(DEFAULT_METRICS);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TrafficEvent | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      const [liveData, incList] = await Promise.all([
        api.getLiveTraffic(50).catch(() => ({ events: [], metrics: DEFAULT_METRICS })),
        api.listIncidents().catch(() => []),
      ]);
      if (liveData.events && liveData.events.length > 0) {
        setEvents(liveData.events);
        setLastEventTimestamp(Date.now());
      }
      if (liveData.metrics) {
        setMetrics(liveData.metrics);
      }
      setIncidents(incList);
    } catch {
      // Offline fallback
    }
  }, []);

  const injectEvent = useCallback((newEv: TrafficEvent, newMetrics?: SimStatus, newIncident?: Incident) => {
    setLastEventTimestamp(Date.now());
    setEvents((prev) => {
      if (prev.some((e) => e.event_id === newEv.event_id)) return prev;
      return [newEv, ...prev.slice(0, 199)];
    });
    if (newMetrics) setMetrics(newMetrics);
    if (newIncident) {
      setIncidents((prev) => {
        const idx = prev.findIndex((i) => i.id === newIncident.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = newIncident;
          return copy;
        }
        return [newIncident, ...prev.slice(0, 99)];
      });
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    try {
      setConnectionStatus("RECONNECTING");
      const ws = new WebSocket(WS_BASE);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus("CONNECTED");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "INIT_STATE") {
            if (data.status) setMetrics(data.status);
            if (data.recent_events && data.recent_events.length > 0) {
              setEvents(data.recent_events.reverse());
              setLastEventTimestamp(Date.now());
            }
          } else if (data.type === "TRAFFIC_EVENT") {
            const newEv: TrafficEvent = data.event;
            setLastEventTimestamp(Date.now());
            setEvents((prev) => {
              if (prev.some((e) => e.event_id === newEv.event_id)) return prev;
              return [newEv, ...prev.slice(0, 199)];
            });
            if (data.metrics) {
              setMetrics(data.metrics);
            }
            if (data.incident) {
              const newInc: Incident = data.incident;
              setIncidents((prev) => {
                const idx = prev.findIndex((i) => i.id === newInc.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = newInc;
                  return copy;
                }
                return [newInc, ...prev.slice(0, 99)];
              });
            }
          }
        } catch {
          // ignore parsing errors
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus("DISCONNECTED");
        // Reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setIsConnected(false);
      setConnectionStatus("DISCONNECTED");
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connectWebSocket, fetchInitialData]);

  const startSimulation = async (speed = 1.0, unknown_rate = 0.05, scenario = "Mixed Enterprise Traffic") => {
    await api.startSimulation(speed, unknown_rate, scenario);
    setMetrics((prev) => ({ ...prev, is_running: true, is_paused: false, speed, unknown_rate, scenario }));
  };

  const pauseSimulation = async () => {
    await api.pauseSimulation();
    setMetrics((prev) => ({ ...prev, is_paused: true }));
  };

  const resumeSimulation = async () => {
    await api.resumeSimulation();
    setMetrics((prev) => ({ ...prev, is_paused: false }));
  };

  const stopSimulation = async () => {
    await api.stopSimulation();
    setMetrics((prev) => ({ ...prev, is_running: false, is_paused: false }));
  };

  const resetSimulation = async () => {
    await api.resetSimulation();
    setEvents([]);
    setIncidents([]);
    setSelectedEvent(null);
    setSelectedIncident(null);
    setMetrics(DEFAULT_METRICS);
  };

  const refreshIncidents = async () => {
    try {
      const list = await api.listIncidents();
      setIncidents(list);
    } catch {
      // ignore
    }
  };

  return {
    isConnected,
    connectionStatus,
    lastEventTimestamp,
    injectEvent,
    events,
    metrics,
    incidents,
    selectedEvent,
    setSelectedEvent,
    selectedIncident,
    setSelectedIncident,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    resetSimulation,
    refreshIncidents,
  };
}
