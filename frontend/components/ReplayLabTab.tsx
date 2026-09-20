/**
 * frontend/components/ReplayLabTab.tsx
 * Security testing environment for replaying historical datasets, custom scenarios,
 * and benchmarking RoNeTC+ detection rates across variable throughput.
 */
"use client";

import React, { useState } from "react";
import { PlaySquare, Play, Pause, Square, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { SimStatus } from "@/types/soc";

interface ReplayLabTabProps {
  metrics: SimStatus;
  onStart: (speed: number, unknownRate: number, scenario: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function ReplayLabTab({
  metrics,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
}: ReplayLabTabProps) {
  const [selectedDataset, setSelectedDataset] = useState<string>("UNSW-NB15 Standard Test Split");
  const [targetFlows, setTargetFlows] = useState<number>(1000);
  const [replaySpeed, setReplaySpeed] = useState<number>(2.0);
  const [zeroDayRatio, setZeroDayRatio] = useState<number>(0.05);

  const processed = metrics.total_flows;
  const progressPct = Math.min(100, Math.round((processed / targetFlows) * 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-5 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <PlaySquare className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide font-mono">
              Dataset Replay Laboratory
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Deterministic security testing environment for offline evaluation and firewall throughput benchmarking.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        {/* Replay Parameters */}
        <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Replay Session Configuration</h3>

          <div className="space-y-3">
            <div>
              <label className="text-slate-500 text-[10px] block mb-1">TARGET DATASET / SCENARIO</label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="UNSW-NB15 Standard Test Split">UNSW-NB15 Standard Test Split (82,332 flows)</option>
                <option value="Mixed Enterprise Traffic">Mixed Enterprise Profile (95% Known / 5% Zero-Day)</option>
                <option value="Zero-Day Burst">Zero-Day Burst Scenario (75% Known / 25% Zero-Day)</option>
                <option value="Attack Storm">Attack Storm (Rapid Inundation: Recon, Backdoor, Shellcode)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 text-[10px] block mb-1">BATCH FLOW LIMIT</label>
                <select
                  value={targetFlows}
                  onChange={(e) => setTargetFlows(parseInt(e.target.value))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value={200}>200 Flows (Quick smoke test)</option>
                  <option value={500}>500 Flows (Discovery batch)</option>
                  <option value={1000}>1,000 Flows (Benchmark)</option>
                  <option value={5000}>5,000 Flows (Stress test)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 text-[10px] block mb-1">REPLAY SPEED</label>
                <select
                  value={replaySpeed}
                  onChange={(e) => setReplaySpeed(parseFloat(e.target.value))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
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
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-500 text-[10px]">ZERO-DAY INJECTION RATIO</label>
                <span className="text-cyan-400 font-bold">{(zeroDayRatio * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.30"
                step="0.05"
                value={zeroDayRatio}
                onChange={(e) => setZeroDayRatio(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center space-x-3">
            {!metrics.is_running ? (
              <button
                onClick={() => onStart(replaySpeed, zeroDayRatio, selectedDataset)}
                className="flex-1 flex items-center justify-center space-x-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 py-2.5 font-bold text-slate-950 transition shadow-sm shadow-cyan-500/20"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>START REPLAY SESSION</span>
              </button>
            ) : (
              <button
                onClick={onStop}
                className="flex-1 flex items-center justify-center space-x-2 rounded-lg bg-rose-600 hover:bg-rose-500 py-2.5 font-bold text-white transition shadow-sm shadow-rose-600/20"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>STOP REPLAY</span>
              </button>
            )}

            <button
              onClick={onReset}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-300 hover:bg-slate-700 transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Progress & Real-time Replay Metrics */}
        <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Replay Session Execution Telemetry</h3>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-400">Replay Progress:</span>
              <span className="text-cyan-300 font-bold">
                {processed} / {targetFlows} flows ({progressPct}%)
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-[10px] text-slate-500 block">KNOWN FLOWS VERIFIED</span>
              <span className="text-lg font-bold text-emerald-400 mt-1 block">
                {metrics.known_count.toLocaleString()}
              </span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-[10px] text-slate-500 block">ZERO-DAYS REJECTED</span>
              <span className="text-lg font-bold text-rose-400 mt-1 block">
                {metrics.unknown_count.toLocaleString()}
              </span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-[10px] text-slate-500 block">SUSPICIOUS FLAGGED</span>
              <span className="text-lg font-bold text-amber-400 mt-1 block">
                {metrics.suspicious_count.toLocaleString()}
              </span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-[10px] text-slate-500 block">AVERAGE LATENCY</span>
              <span className="text-lg font-bold text-cyan-400 mt-1 block">
                {metrics.avg_latency_ms.toFixed(1)}ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
