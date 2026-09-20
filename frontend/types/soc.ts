/**
 * frontend/types/soc.ts
 * Strict TypeScript schemas for NetEvolve SOC enterprise traffic platform.
 */

export interface EndpointInfo {
  ip: string;
  port: number;
}

export interface ViewOpinion {
  evidence: number;
  belief: number;
  uncertainty: number;
}

export interface PredictionInfo {
  label: string;
  class_id: number;
  confidence: number;
  beliefs?: Record<string, number>;
}

export interface OpenSetInfo {
  uncertainty: number;
  threshold: number;
  is_unknown: boolean;
}

export interface DecisionInfo {
  status: "ALLOWED" | "SUSPICIOUS" | "BLOCKED";
  reason: string;
}

export interface TrafficEvent {
  event_id: string;
  timestamp: string;
  source: EndpointInfo;
  destination: EndpointInfo;
  protocol: string;
  service: string;
  packets: number;
  bytes: number;
  duration: number;
  prediction: PredictionInfo;
  open_set: OpenSetInfo;
  decision: DecisionInfo;
  views: {
    ip: ViewOpinion;
    transport: ViewOpinion;
    payload: ViewOpinion;
  };
  fused: ViewOpinion;
  ground_truth?: string | null;
  source_type: string;
  features?: Record<string, unknown>;
}

export interface Incident {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "NEW" | "INVESTIGATING" | "CONTAINED" | "RESOLVED" | "FALSE_POSITIVE";
  detected_at: string;
  source_ip: string;
  destination_ip: string;
  attack_category: string;
  uncertainty: number;
  confidence: number;
  occurrences: number;
  first_seen: string;
  last_seen: string;
  event_ids: string[];
  cluster_id?: number | null;
  recommendations: string[];
}

export interface ClusterPoint {
  id: string;
  x: number;
  y: number;
  cluster_id: number;
  uncertainty: number;
  ground_truth?: string;
  source_ip?: string;
  destination_ip?: string;
}

export interface SemanticAttackProfile {
  cluster_id: number;
  candidate_name: string;
  risk_level: string;
  behavior_signature: string;
  protocol_distribution: string;
  payload_profile: string;
  sample_count: number;
  recommended_action: string;
}

export interface ClusterMetrics {
  silhouette_score?: number;
  cluster_purity?: number;
  normalized_mutual_info?: number;
  adjusted_rand_index?: number;
}

export interface DiscoveryResponse {
  total_unknown_flows: number;
  algorithm: string;
  n_clusters: number;
  points: ClusterPoint[];
  metrics: ClusterMetrics;
  profiles: SemanticAttackProfile[];
}

export interface ModelInfo {
  name: string;
  version: string;
  framework: string;
  architecture: string;
  total_parameters: number;
  open_set_threshold: number;
  views: string[];
  fusion_mechanism: string;
  base_classes: string[];
  active_classes: string[];
  discovered_classes: string[];
  checkpoint_path: string;
  status: string;
  benchmarks: {
    closed_set_accuracy: number;
    closed_set_macro_f1: number;
    open_set_auroc: number;
    known_retention_tpr: number;
    unknown_detection_tnr: number;
    discovery_purity: number;
    catastrophic_forgetting_clean: number;
  };
}

export interface ContinualUpdateStep {
  step_number: number;
  name: string;
  status: string;
  detail: string;
}

export interface ContinualUpdateResponse {
  success: boolean;
  status: string;
  total_classes: number;
  active_classes: string[];
  historical_accuracy: number;
  new_class_accuracy: number;
  forgetting_rate: number;
  steps: ContinualUpdateStep[];
}

export interface SimStatus {
  is_running: boolean;
  is_paused: boolean;
  speed: number;
  unknown_rate: number;
  scenario: string;
  total_flows: number;
  known_count: number;
  suspicious_count: number;
  unknown_count: number;
  blocked_count: number;
  avg_latency_ms: number;
  active_connections: number;
  threat_distribution: Record<string, number>;
  uncertainty_histogram: number[];
  volume_history: Array<{ time: string; known: number; unknown: number; total: number }>;
}

export interface DemoSeed {
  id: string;
  category: string;
  is_unknown: boolean;
  risk_level: string;
  source_ip: string;
  source_port: number;
  dest_ip: string;
  dest_port: number;
  protocol: string;
  service: string;
  packets: number;
  bytes: number;
  duration: number;
  summary: string;
}

export interface DemoSeedRegistryResponse {
  categories: string[];
  category_index: Record<string, string[]>;
  total_seeds: number;
}
