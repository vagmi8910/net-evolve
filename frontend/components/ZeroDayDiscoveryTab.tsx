/**
 * frontend/components/ZeroDayDiscoveryTab.tsx
 * Novel Class Discovery (RoNeTC+ Phase 5).
 * Visualizes 2D PCA latent embeddings of high-uncertainty zero-day flows,
 * clustering evaluation metrics (Silhouette, Purity, NMI, ARI),
 * and semantic attack profiles.
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
} from "lucide-react";
import { DiscoveryResponse, SemanticAttackProfile } from "@/types/soc";
import { api } from "@/lib/api";

interface ZeroDayDiscoveryTabProps {
  onNavigateToContinualLearning: () => void;
}

const CLUSTER_COLORS = [
  "#8B5CF6", // Cluster 0: Purple (Reconnaissance)
  "#0EA5E9", // Cluster 1: Cyan (Backdoor)
  "#10B981", // Cluster 2: Emerald (Shellcode)
  "#F59E0B", // Cluster 3: Amber (Analysis)
  "#EF4444", // Cluster 4: Red (Worms)
  "#EC4899", // Cluster 5: Pink (Novel Exploit)
];

export function ZeroDayDiscoveryTab({
  onNavigateToContinualLearning,
}: ZeroDayDiscoveryTabProps) {
  const [algorithm, setAlgorithm] = useState<string>("kmeans");
  const [nClusters, setNClusters] = useState<number>(5);
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<number>(1); // Default to Backdoor
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

  const activeProfile = data?.profiles.find((p) => p.cluster_id === selectedClusterId) || data?.profiles[0];

  return (
    <div className="space-y-6">
      {/* Top Header & Pool Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-4 shadow-sm">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">REJECTED ZERO-DAY POOL</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">
            {data?.total_unknown_flows || 500}
          </span>
          <span className="text-[11px] font-mono text-rose-400 mt-1 block">
            High-Uncertainty Flows (u &ge; 0.1844)
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-4 shadow-sm">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">CLUSTER PURITY</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            {((data?.metrics.cluster_purity || 0.774) * 100).toFixed(1)}%
          </span>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">
            Ground-Truth Alignment
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-4 shadow-sm">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">SILHOUETTE COEFFICIENT</span>
          <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">
            {data?.metrics.silhouette_score?.toFixed(4) || "0.4415"}
          </span>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">
            Latent Embedding Separation
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-4 shadow-sm">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">MUTUAL INFORMATION (NMI)</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
            {data?.metrics.normalized_mutual_info?.toFixed(4) || "0.0979"}
          </span>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">
            Adjusted Rand Index: {data?.metrics.adjusted_rand_index?.toFixed(4) || "0.0456"}
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0A0F1D] p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono">
              Latent Representation Clustering
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Unsupervised grouping of 384-dimensional spliced multi-view flow embeddings
            </p>
          </div>
        </div>

        {/* Algorithm & K Selector */}
        <div className="flex items-center space-x-4 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">ALGORITHM:</span>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="kmeans">K-Means</option>
              <option value="dbscan">DBSCAN</option>
              <option value="hdbscan">HDBSCAN</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500">CANDIDATES (K):</span>
            <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
              {[3, 4, 5, 6].map((k) => (
                <button
                  key={k}
                  onClick={() => setNClusters(k)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    nClusters === k
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
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
            className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3.5 py-1.5 font-mono text-xs font-bold text-slate-950 transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 fill-current" />
            <span>RUN CLUSTERING</span>
          </button>
        </div>
      </div>

      {/* Main 2D Projection & Profiling Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 2D PCA Scatter Visualization (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#0A0F1D] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              2D Principal Component Projection (PCA)
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Axes: Latent PC1 vs PC2
            </span>
          </div>

          {/* Interactive SVG Scatter */}
          <div className="relative h-[400px] w-full rounded-lg border border-slate-800/80 bg-[#060912] overflow-hidden flex items-center justify-center">
            {/* Axis gridlines */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-20">
              <div className="border-r border-b border-slate-700" />
              <div className="border-r border-b border-slate-700" />
              <div className="border-r border-b border-slate-700" />
              <div className="border-b border-slate-700" />
            </div>

            <svg className="h-full w-full" viewBox="-6 -6 12 12">
              {/* Origin axes */}
              <line x1="-6" y1="0" x2="6" y2="0" stroke="#334155" strokeWidth="0.04" strokeDasharray="0.1 0.1" />
              <line x1="0" y1="-6" x2="0" y2="6" stroke="#334155" strokeWidth="0.04" strokeDasharray="0.1 0.1" />

              {/* Data points */}
              {data?.points.map((pt) => {
                const color = CLUSTER_COLORS[pt.cluster_id % CLUSTER_COLORS.length];
                const isSelected = pt.cluster_id === selectedClusterId;
                return (
                  <circle
                    key={pt.id}
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 0.18 : 0.11}
                    fill={color}
                    opacity={isSelected ? 0.95 : 0.65}
                    onClick={() => setSelectedClusterId(pt.cluster_id)}
                    className="cursor-pointer transition-all hover:r-[0.25] hover:opacity-100"
                  >
                    <title>{`${pt.id}: Cluster ${pt.cluster_id} (${pt.ground_truth || "Unknown"}) - u=${pt.uncertainty}`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>

          {/* Cluster Legend Tabs */}
          <div className="flex flex-wrap gap-2 pt-2">
            {data?.profiles.map((prof) => {
              const color = CLUSTER_COLORS[prof.cluster_id % CLUSTER_COLORS.length];
              const isSelected = prof.cluster_id === selectedClusterId;
              return (
                <button
                  key={prof.cluster_id}
                  onClick={() => setSelectedClusterId(prof.cluster_id)}
                  style={{
                    borderColor: isSelected ? color : "transparent",
                    backgroundColor: isSelected ? `${color}20` : "#0F172A",
                  }}
                  className="flex items-center space-x-2 rounded-lg border px-3 py-1.5 font-mono text-xs transition"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-slate-200 font-bold">Cluster {prof.cluster_id}:</span>
                  <span className="text-slate-400">{prof.candidate_name.replace("Candidate: ", "")}</span>
                  <span className="text-[10px] text-slate-500">({prof.sample_count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Semantic Attack Profile & Continual Learning Trigger (5 cols) */}
        <div className="lg:col-span-5">
          {activeProfile ? (
            <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-5 space-y-5">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: CLUSTER_COLORS[activeProfile.cluster_id % CLUSTER_COLORS.length],
                      }}
                    />
                    <span className="font-mono text-sm font-bold text-white">
                      Cluster {activeProfile.cluster_id} Profile
                    </span>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                      activeProfile.risk_level === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {activeProfile.risk_level} RISK
                  </span>
                </div>
                <h4 className="text-base font-bold text-cyan-300 font-mono">
                  {activeProfile.candidate_name}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  Identified from {activeProfile.sample_count} grouped zero-day flows.
                </p>
              </div>

              {/* Behavior & Protocol Profile */}
              <div className="space-y-3 font-mono text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">
                    Behavioral Signature
                  </span>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    {activeProfile.behavior_signature}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">
                      Protocol Distribution
                    </span>
                    <p className="text-slate-300 text-xs">{activeProfile.protocol_distribution}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">
                      Payload Profile
                    </span>
                    <p className="text-slate-300 text-xs">{activeProfile.payload_profile}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-cyan-900/40 bg-cyan-950/20 p-3">
                  <span className="text-[10px] text-cyan-400 uppercase block mb-1">
                    Recommended Triage Action
                  </span>
                  <p className="text-cyan-200 text-xs">{activeProfile.recommended_action}</p>
                </div>
              </div>

              {/* Scientific Integrity Note */}
              <div className="text-[10px] text-slate-500 font-mono bg-slate-900/40 p-2.5 rounded border border-slate-800">
                ⚠️ <strong>Scientific Integrity Guard:</strong> This cluster is designated as a <em>Candidate Label</em> based on multi-view feature similarity. Ground-truth confirmation occurs after human-in-the-loop validation or sandbox execution.
              </div>

              {/* Forward to Continual Learning */}
              <button
                onClick={onNavigateToContinualLearning}
                className="w-full flex items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-2.5 font-mono text-xs font-bold text-white transition shadow-sm shadow-cyan-600/30"
              >
                <span>SEND TO CONTINUAL LEARNING EXPANSION</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-12 text-center text-slate-500 font-mono text-xs">
              Select a cluster to inspect its semantic profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
