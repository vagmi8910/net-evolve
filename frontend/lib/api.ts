/**
 * frontend/lib/api.ts
 * Type-safe API client for NetEvolve Security Gateway backend.
 */
import {
  TrafficEvent,
  Incident,
  DiscoveryResponse,
  ModelInfo,
  ContinualUpdateResponse,
  SimStatus,
  DemoSeedRegistryResponse,
  DemoSeed,
} from "@/types/soc";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/traffic";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error [${res.status}] ${endpoint}: ${errText || res.statusText}`);
  }

  return res.json();
}

export const api = {
  getHealth: () => fetchJson<{ status: string; service: string; version: string; model_loaded: boolean }>("/api/health"),
  getModelInfo: () => fetchJson<ModelInfo>("/api/model/info"),
  getLiveTraffic: (limit = 100) => fetchJson<{ events: TrafficEvent[]; metrics: SimStatus }>(`/api/traffic/live?limit=${limit}`),
  getSocMetrics: () => fetchJson<{ kpis: Record<string, number>; threat_distribution: Record<string, number>; uncertainty_histogram: number[]; volume_history: unknown[] }>("/api/metrics"),
  
  // Simulation Controls
  startSimulation: (speed = 1.0, unknown_rate = 0.05, scenario = "Mixed Enterprise Traffic") =>
    fetchJson<{ status: string; details: SimStatus }>("/api/simulation/start", {
      method: "POST",
      body: JSON.stringify({ speed, unknown_rate, scenario }),
    }),
  pauseSimulation: () => fetchJson<{ status: string }>("/api/simulation/pause", { method: "POST" }),
  resumeSimulation: () => fetchJson<{ status: string }>("/api/simulation/resume", { method: "POST" }),
  stopSimulation: () => fetchJson<{ status: string }>("/api/simulation/stop", { method: "POST" }),
  resetSimulation: () => fetchJson<{ status: string }>("/api/simulation/reset", { method: "POST" }),
  getSimulationStatus: () => fetchJson<SimStatus>("/api/simulation/status"),

  // Demo Seed Attacks
  getDemoSeeds: () => fetchJson<DemoSeedRegistryResponse>("/api/demo/seeds"),
  getCategorySeeds: (category: string) => fetchJson<{ category: string; count: number; seeds: DemoSeed[] }>(`/api/demo/seeds/${category}`),
  runSeedAttack: (seedId: string) => fetchJson<TrafficEvent>(`/api/demo/seeds/${seedId}/run`, { method: "POST" }),

  // Incidents
  listIncidents: (status?: string, severity?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (severity) params.set("severity", severity);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return fetchJson<Incident[]>(`/api/incidents${qs}`);
  },
  getIncident: (id: string) => fetchJson<Incident>(`/api/incidents/${id}`),
  updateIncident: (id: string, patch: { status?: string; severity?: string }) =>
    fetchJson<Incident>(`/api/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  // Novel Class Discovery
  getDiscoveryClusters: (algorithm = "kmeans", n_clusters = 5) =>
    fetchJson<DiscoveryResponse>(`/api/discovery/clusters?algorithm=${algorithm}&n_clusters=${n_clusters}`),
  runDiscovery: (algorithm = "kmeans", n_clusters = 5) =>
    fetchJson<DiscoveryResponse>(`/api/discovery/run?algorithm=${algorithm}&n_clusters=${n_clusters}`, { method: "POST" }),

  // Continual Learning
  startContinualLearning: () => fetchJson<ContinualUpdateResponse>("/api/continual-learning/start", { method: "POST" }),
  resetContinualLearning: () => fetchJson<{ status: string }>("/api/continual-learning/reset", { method: "POST" }),
};
