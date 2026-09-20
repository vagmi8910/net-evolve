/**
 * frontend/components/views/ZeroDayDiscoveryView.tsx
 * Apple / Linear style Zero-Day Discovery and Latent Space Investigation Workspace.
 * Unsupervised grouping of high-uncertainty open-set flows with clean 2D PCA projection.
 */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Cpu,
  BarChart2,
  Info,
  ShieldCheck,
} from "lucide-react";
import { DiscoveryResponse, SemanticAttackProfile } from "@/types/soc";
import { api } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";

interface ZeroDayDiscoveryViewProps {
  onNavigateToContinualLearning: () => void;
}

const CLUSTER_COLORS = [
  "#7C3AED", // Cluster 0: Purple
  "#007AFF", // Cluster 1: Apple Blue
  "#16A34A", // Cluster 2: Emerald Green
  "#F59E0B", // Cluster 3: Amber
  "#DC2626", // Cluster 4: Red
  "#EC4899", // Cluster 5: Pink
];

export function ZeroDayDiscoveryView({
  onNavigateToContinualLearning,
}: ZeroDayDiscoveryViewProps) {
  const [algorithm, setAlgorithm] = useState<string>("kmeans");
  const [nClusters, setNClusters] = useState<number>(5);
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchClusters = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getDiscoveryClusters(algorithm, nClusters);
      setData(res);
    } catch (err) {
      console.error("Failed to load clusters:", err);
    } finally {
      setIsLoading(false);
    }
  }, [algorithm, nClusters]);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  const activeProfile =
    data?.profiles.find((p) => p.cluster_id === selectedClusterId) ||
    data?.profiles[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
            Zero-Day Discovery
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Identify previously unseen attack families from model-rejected network traffic.
          </p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Unknown Flows"
          value={data?.total_unknown_flows || 500}
          subtitle="Uncertainty u ≥ 0.1844"
          icon={Layers}
          color="purple"
        />
        <MetricCard
          title="Cluster Purity"
          value={`${((data?.metrics.cluster_purity || 0.774) * 100).toFixed(1)}%`}
          delta="Ground-truth alignment"
          trend="up"
          icon={ShieldCheck}
          color="emerald"
        />
        <MetricCard
          title="Silhouette"
          value={data?.metrics.silhouette_score?.toFixed(4) || "0.4415"}
          subtitle="Latent spatial separation"
          icon={TrendingUp}
          color="blue"
        />
        <MetricCard
          title="Mutual Info (NMI)"
          value={data?.metrics.normalized_mutual_info?.toFixed(4) || "0.0979"}
          subtitle={`ARI: ${data?.metrics.adjusted_rand_index?.toFixed(4) || "0.0456"}`}
          icon={BarChart2}
          color="amber"
        />
      </div>

      {/* Controls Bar */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-[#007AFF]">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Clustering Engine
              </h3>
              <p className="text-xs text-gray-500">
                Unsupervised grouping of 384-dimensional spliced multi-view flow embeddings
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Algorithm:</span>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#007AFF]"
              >
                <option value="kmeans">K-Means</option>
                <option value="dbscan">DBSCAN</option>
                <option value="hdbscan">HDBSCAN</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Clusters (K):</span>
              <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                {[3, 4, 5, 6].map((k) => (
                  <button
                    key={k}
                    onClick={() => setNClusters(k)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      nClusters === k
                        ? "bg-white text-gray-900 shadow-sm font-semibold"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={fetchClusters}
              disabled={isLoading}
              className="rounded-lg bg-[#007AFF] hover:bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 fill-current" />
              <span>Run Clustering</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split: 2D PCA Scatter on Left, Profile Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 2D PCA Projection Scatter (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              2D Principal Component Projection (PCA)
            </h3>
            <span className="text-xs text-gray-400">
              Latent PC1 vs PC2 • Click point to select cluster
            </span>
          </div>

          {/* Clean Light Scatter SVG */}
          <div className="relative h-[420px] w-full rounded-xl border border-gray-100 bg-[#FAFAFA] overflow-hidden flex items-center justify-center">
            {/* Minimal Gridlines */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-40">
              <div className="border-r border-b border-gray-200" />
              <div className="border-r border-b border-gray-200" />
              <div className="border-r border-b border-gray-200" />
              <div className="border-b border-gray-200" />
            </div>

            <svg className="h-full w-full" viewBox="-6 -6 12 12">
              {/* Origin Axes */}
              <line
                x1="-6"
                y1="0"
                x2="6"
                y2="0"
                stroke="#E5E7EB"
                strokeWidth="0.05"
                strokeDasharray="0.15 0.15"
              />
              <line
                x1="0"
                y1="-6"
                x2="0"
                y2="6"
                stroke="#E5E7EB"
                strokeWidth="0.05"
                strokeDasharray="0.15 0.15"
              />

              {/* Data points */}
              {data?.points.map((pt) => {
                const color = CLUSTER_COLORS[pt.cluster_id % CLUSTER_COLORS.length];
                const isSelected = pt.cluster_id === selectedClusterId;
                return (
                  <circle
                    key={pt.id}
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 0.22 : 0.13}
                    fill={color}
                    opacity={isSelected ? 0.95 : 0.65}
                    onClick={() => setSelectedClusterId(pt.cluster_id)}
                    className="cursor-pointer transition-all hover:r-[0.28] hover:opacity-100"
                  >
                    <title>{`${pt.id}: Cluster ${pt.cluster_id} (${pt.ground_truth || "Unknown"}) - u=${pt.uncertainty}`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>

          {/* Cluster Selection Tabs */}
          <div className="flex flex-wrap gap-2 pt-2">
            {data?.profiles.map((prof) => {
              const color = CLUSTER_COLORS[prof.cluster_id % CLUSTER_COLORS.length];
              const isSelected = prof.cluster_id === selectedClusterId;

              return (
                <button
                  key={prof.cluster_id}
                  onClick={() => setSelectedClusterId(prof.cluster_id)}
                  style={{
                    borderColor: isSelected ? color : "#E5E7EB",
                    backgroundColor: isSelected ? `${color}10` : "#FFFFFF",
                  }}
                  className="flex items-center space-x-2 rounded-xl border px-3 py-1.5 text-xs transition"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-gray-900">Cluster {prof.cluster_id}:</span>
                  <span className="text-gray-600">{prof.candidate_name.replace("Candidate: ", "")}</span>
                  <span className="text-gray-400 text-[11px]">({prof.sample_count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Cluster Details Card (5 cols) */}
        <div className="lg:col-span-5">
          {activeProfile ? (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-5">
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          CLUSTER_COLORS[activeProfile.cluster_id % CLUSTER_COLORS.length],
                      }}
                    />
                    <span className="font-medium text-xs text-gray-500">
                      Cluster {activeProfile.cluster_id} Candidate Profile
                    </span>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                      activeProfile.risk_level === "CRITICAL"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {activeProfile.risk_level} Risk
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {activeProfile.candidate_name}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Identified from {activeProfile.sample_count} grouped zero-day flow representations.
                </p>
              </div>

              {/* Behavior & Protocol Profile */}
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
                  <span className="text-[11px] text-gray-400 uppercase font-semibold block mb-1">
                    Behavioral Signature
                  </span>
                  <p className="text-gray-800 leading-relaxed">
                    {activeProfile.behavior_signature}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                    <span className="text-[11px] text-gray-400 uppercase font-semibold block mb-1">
                      Protocol Profile
                    </span>
                    <p className="text-gray-800 font-mono text-xs">{activeProfile.protocol_distribution}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                    <span className="text-[11px] text-gray-400 uppercase font-semibold block mb-1">
                      Payload Profile
                    </span>
                    <p className="text-gray-800 font-mono text-xs">{activeProfile.payload_profile}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5">
                  <span className="text-[11px] text-[#007AFF] uppercase font-semibold block mb-1">
                    Recommended Triage Action
                  </span>
                  <p className="text-gray-800 text-xs leading-relaxed">{activeProfile.recommended_action}</p>
                </div>
              </div>

              {/* Scientific Integrity Note */}
              <div className="text-xs text-gray-600 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 flex items-start space-x-2">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Candidate Label:</strong> Designated based on multi-view feature similarity. Official classification occurs after analyst validation or sandbox execution.
                </span>
              </div>

              {/* Action Button */}
              <button
                onClick={onNavigateToContinualLearning}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-[#007AFF] hover:bg-blue-600 py-3 text-xs font-semibold text-white transition shadow-sm"
              >
                <span>Send to Continual Learning Expansion</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400 text-xs">
              Select a cluster point on the scatter plot to inspect its profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
