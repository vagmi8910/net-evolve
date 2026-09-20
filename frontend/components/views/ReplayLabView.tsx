/**
 * frontend/components/views/ReplayLabView.tsx
 * Apple / Linear style Dataset Replay Laboratory.
 * Professional observability interface for historical dataset replay and throughput evaluation.
 */
"use client";

import React, { useState } from "react";
import {
  PlaySquare,
  Play,
  Square,
  Download,
  FileSpreadsheet,
  Activity,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { SimStatus } from "@/types/soc";
import { MetricCard } from "@/components/ui/MetricCard";

interface ReplayLabViewProps {
  metrics: SimStatus;
  onStart: (speed: number, unknownRate: number, scenario: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function ReplayLabView({
  metrics,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
}: ReplayLabViewProps) {
  const [selectedDataset, setSelectedDataset] = useState<string>("UNSW-NB15 Standard Test Split");
  const [targetFlows, setTargetFlows] = useState<number>(1000);
  const [replaySpeed, setReplaySpeed] = useState<number>(2.0);
  const [zeroDayRatio, setZeroDayRatio] = useState<number>(0.05);

  const processed = metrics.total_flows;
  const progressPct = Math.min(100, Math.round((processed / targetFlows) * 100));

  const handleExportCsv = () => {
    const csvContent = [
      "metric,value",
      `total_flows,${metrics.total_flows}`,
      `known_flows,${metrics.known_count}`,
      `unknown_flows,${metrics.unknown_count}`,
      `suspicious_flows,${metrics.suspicious_count}`,
      `avg_latency_ms,${metrics.avg_latency_ms}`,
      `dataset,${selectedDataset}`,
      `zero_day_ratio,${zeroDayRatio}`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `netevolve_replay_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
            Replay Lab
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1.5 font-normal">
            Deterministic security evaluation environment for offline dataset playback and firewall throughput.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center space-x-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700 shadow-sm transition"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <span>Export Replay CSV</span>
        </button>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Replay Parameters */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">
            Replay Session Configuration
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-gray-500 text-[11px] font-medium block mb-1.5 uppercase tracking-wider">
                TARGET DATASET / SCENARIO
              </label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
              >
                <option value="UNSW-NB15 Standard Test Split">UNSW-NB15 Standard Test Split (82,332 flows)</option>
                <option value="Mixed Enterprise Traffic">Mixed Enterprise Profile (95% Known / 5% Zero-Day)</option>
                <option value="Zero-Day Burst">Zero-Day Burst Scenario (75% Known / 25% Zero-Day)</option>
                <option value="Attack Storm">Attack Storm (Rapid Inundation: Recon, Backdoor, Shellcode)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-500 text-[11px] font-medium block mb-1.5 uppercase tracking-wider">
                  FLOW BATCH LIMIT
                </label>
                <select
                  value={targetFlows}
                  onChange={(e) => setTargetFlows(parseInt(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                >
                  <option value={200}>200 Flows (Quick smoke test)</option>
                  <option value={500}>500 Flows (Discovery batch)</option>
                  <option value={1000}>1,000 Flows (Standard benchmark)</option>
                  <option value={5000}>5,000 Flows (Extended stress test)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-500 text-[11px] font-medium block mb-1.5 uppercase tracking-wider">
                  PLAYBACK SPEED
                </label>
                <select
                  value={replaySpeed}
                  onChange={(e) => setReplaySpeed(parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                >
                  <option value={0.5}>0.5x (Slow motion)</option>
                  <option value={1.0}>1.0x (Real-time 1 flow/s)</option>
                  <option value={2.0}>2.0x (Accelerated 2 flows/s)</option>
                  <option value={5.0}>5.0x (Fast 5 flows/s)</option>
                  <option value={10.0}>10.0x (Turbo 10 flows/s)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">
                  ZERO-DAY INJECTION RATIO
                </label>
                <span className="text-[#007AFF] font-semibold">{(zeroDayRatio * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.30"
                step="0.05"
                value={zeroDayRatio}
                onChange={(e) => setZeroDayRatio(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#007AFF]"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="pt-2 flex items-center space-x-3">
            {!metrics.is_running ? (
              <button
                onClick={() => onStart(replaySpeed, zeroDayRatio, selectedDataset)}
                className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-[#007AFF] hover:bg-blue-600 py-2.5 text-xs font-semibold text-white transition shadow-sm"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start Replay Session</span>
              </button>
            ) : (
              <button
                onClick={onStop}
                className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-semibold text-white transition shadow-sm"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>Stop Replay</span>
              </button>
            )}

            <button
              onClick={onReset}
              className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700 shadow-sm transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Real-time Replay Progress & Metrics */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-5">
          <h3 className="text-[15px] font-semibold text-gray-900">
            Replay Session Telemetry
          </h3>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-gray-500">Replay Progress:</span>
              <span className="text-[#007AFF] font-semibold">
                {processed} / {targetFlows} flows ({progressPct}%)
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full bg-[#007AFF] rounded-full transition-all duration-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
              <span className="text-gray-500 text-[11px] block">KNOWN FLOWS VERIFIED</span>
              <span className="text-xl font-semibold text-emerald-600 mt-1 block font-mono">
                {metrics.known_count.toLocaleString()}
              </span>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
              <span className="text-gray-500 text-[11px] block">ZERO-DAYS REJECTED</span>
              <span className="text-xl font-semibold text-purple-600 mt-1 block font-mono">
                {metrics.unknown_count.toLocaleString()}
              </span>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
              <span className="text-gray-500 text-[11px] block">SUSPICIOUS FLAGGED</span>
              <span className="text-xl font-semibold text-amber-600 mt-1 block font-mono">
                {metrics.suspicious_count.toLocaleString()}
              </span>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
              <span className="text-gray-500 text-[11px] block">AVERAGE LATENCY</span>
              <span className="text-xl font-semibold text-gray-900 mt-1 block font-mono">
                {metrics.avg_latency_ms.toFixed(1)} ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
