/**
 * frontend/components/OverviewTab.tsx
 * Executive SOC Overview screen displaying primary KPI cards, live traffic volume,
 * Dirichlet uncertainty histogram, threat distribution, and recent security events.
 */
"use client";

import React from "react";
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { SimStatus, TrafficEvent } from "@/types/soc";

interface OverviewTabProps {
  metrics: SimStatus;
  recentEvents: TrafficEvent[];
  onSelectEvent: (event: TrafficEvent) => void;
  onNavigateToTraffic: () => void;
}

export function OverviewTab({
  metrics,
  recentEvents,
  onSelectEvent,
  onNavigateToTraffic,
}: OverviewTabProps) {
  const total = Math.max(1, metrics.total_flows);
  const knownPct = ((metrics.known_count / total) * 100).toFixed(1);
  const unknownPct = ((metrics.unknown_count / total) * 100).toFixed(1);

  // Maximum bin value for histogram scaling
  const maxBin = Math.max(1, ...metrics.uncertainty_histogram);

  // Format volume history for SVG path
  const volumeData = metrics.volume_history.length > 0 ? metrics.volume_history : [
    { time: "00:00", known: 5, unknown: 0, total: 5 },
    { time: "00:01", known: 8, unknown: 1, total: 9 },
    { time: "00:02", known: 12, unknown: 0, total: 12 },
    { time: "00:03", known: 15, unknown: 2, total: 17 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Flows */}
        <div className="rounded-xl border border-slate-800 bg-[#0A0F1D]/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL FLOWS</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {metrics.total_flows.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono flex items-center space-x-1">
            <TrendingUp className="h-3 w-3 text-cyan-400" />
            <span>Real-time Stream</span>
          </div>
        </div>

        {/* Known Traffic */}
        <div className="rounded-xl border border-slate-800 bg-[#0A0F1D]/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>KNOWN (SAFE)</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {metrics.known_count.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            {knownPct}% of total volume
          </div>
        </div>

        {/* Suspicious */}
        <div className="rounded-xl border border-slate-800 bg-[#0A0F1D]/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>SUSPICIOUS</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {metrics.suspicious_count.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            Anomalous patterns
          </div>
        </div>

        {/* Unknown / Zero-Day */}
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/10 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between text-rose-400 text-xs font-mono">
            <span>UNKNOWN ZERO-DAY</span>
            <AlertOctagon className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">
            {metrics.unknown_count.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-rose-400/80 font-mono">
            {unknownPct}% novel threats
          </div>
        </div>

        {/* Blocked */}
        <div className="rounded-xl border border-slate-800 bg-[#0A0F1D]/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>BLOCKED / QUARANTINED</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {metrics.blocked_count.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            Zero-day mitigations
          </div>
        </div>

        {/* Avg Latency */}
        <div className="rounded-xl border border-slate-800 bg-[#0A0F1D]/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AVG INFERENCE</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            {metrics.avg_latency_ms.toFixed(1)}ms
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            RoNeTC+ PyTorch
          </div>
        </div>
      </div>

      {/* Middle Grid: Traffic Volume & Uncertainty Density */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Volume Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0A0F1D]/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Real-Time Traffic Volume</h3>
              <p className="text-xs text-slate-400 font-mono">
                Incoming network requests per second (Known vs Zero-Day)
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>Known Traffic</span>
              </span>
              <span className="flex items-center space-x-1.5 text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                <span>Zero-Day Infiltration</span>
              </span>
            </div>
          </div>

          {/* Simple Clean Responsive SVG Chart */}
          <div className="h-48 w-full relative flex items-end justify-between pt-4 pb-2 border-b border-slate-800/80">
            {volumeData.map((d, i) => {
              const maxVol = Math.max(10, ...volumeData.map((v) => v.total));
              const knownH = (d.known / maxVol) * 100;
              const unkH = (d.unknown / maxVol) * 100;

              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full px-1 group">
                  <div className="w-full max-w-[20px] flex flex-col items-center justify-end h-full">
                    {unkH > 0 && (
                      <div
                        style={{ height: `${unkH}%` }}
                        className="w-full bg-rose-500 rounded-t-sm transition-all"
                        title={`Zero-Day: ${d.unknown}`}
                      />
                    )}
                    <div
                      style={{ height: `${knownH}%` }}
                      className="w-full bg-emerald-500/80 rounded-b-sm transition-all"
                      title={`Known: ${d.known}`}
                    />
                  </div>
                  <span className="mt-1 text-[9px] font-mono text-slate-500 truncate w-full text-center">
                    {d.time.slice(3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evidential Uncertainty Histogram */}
        <div className="rounded-xl border border-slate-800 bg-[#0A0F1D]/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Dirichlet Vacuity (u)</h3>
              <p className="text-xs text-slate-400 font-mono">
                Cutoff Threshold (τ = 0.1844)
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
            Flows left of the dashed boundary are confidently recognized; flows right of τ trigger open-set alarms.
          </p>

          {/* Histogram Bars */}
          <div className="h-36 flex items-end justify-between space-x-1.5 pt-4 pb-1 relative">
            {/* Threshold Line at ~18% mark */}
            <div className="absolute top-0 bottom-0 left-[24%] w-0.5 bg-rose-500 border-r border-dashed border-rose-300 z-10 flex flex-col justify-start">
              <span className="text-[9px] font-mono font-bold text-rose-400 -mt-3.5 -ml-3 bg-[#0B101D] px-1 rounded">
                τ=0.18
              </span>
            </div>

            {metrics.uncertainty_histogram.map((count, idx) => {
              const heightPct = (count / maxBin) * 100;
              const isPastThreshold = idx >= 2;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                    className={`w-full rounded-t transition-all ${
                      isPastThreshold ? "bg-rose-500/80 hover:bg-rose-400" : "bg-emerald-500/80 hover:bg-emerald-400"
                    }`}
                    title={`Bin ${idx * 0.1}-${(idx + 1) * 0.1}: ${count} flows`}
                  />
                  <span className="text-[8px] font-mono text-slate-500 mt-1">
                    .{(idx + 1)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
            <span className="text-emerald-400">Safe (u &lt; 0.18)</span>
            <span className="text-rose-400">Zero-Day (u &ge; 0.18)</span>
          </div>
        </div>
      </div>

      {/* Threat Distribution & Recent Events Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Distribution */}
        <div className="rounded-xl border border-slate-800 bg-[#0A0F1D]/80 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Detected Class Breakdown</h3>
          <p className="text-xs text-slate-400 font-mono mb-4">
            Distribution across known and discovered categories
          </p>

          <div className="space-y-3 font-mono text-xs">
            {Object.entries(metrics.threat_distribution).length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">Awaiting live traffic events...</p>
            ) : (
              Object.entries(metrics.threat_distribution).map(([cat, count]) => {
                const pct = ((count / total) * 100).toFixed(1);
                const isUnknown = cat === "UNKNOWN" || ["Analysis", "Backdoor", "Reconnaissance", "Shellcode", "Worms"].includes(cat);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className={isUnknown ? "text-rose-400 font-bold" : "text-slate-200"}>
                        {cat}
                      </span>
                      <span className="text-slate-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${isUnknown ? "bg-rose-500" : "bg-cyan-500"}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Events Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0A0F1D]/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Recent Security Events</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Real-time network flows evaluated by RoNeTC+
                </p>
              </div>
              <button
                onClick={onNavigateToTraffic}
                className="flex items-center space-x-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition"
              >
                <span>Live Feed</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase">
                    <th className="pb-2">TIME</th>
                    <th className="pb-2">FLOW ID</th>
                    <th className="pb-2">SOURCE / DEST</th>
                    <th className="pb-2">PREDICTION</th>
                    <th className="pb-2">UNCERTAINTY</th>
                    <th className="pb-2">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentEvents.slice(0, 6).map((ev) => {
                    const isBlocked = ev.decision.status === "BLOCKED";
                    return (
                      <tr
                        key={ev.event_id}
                        onClick={() => onSelectEvent(ev)}
                        className="hover:bg-slate-800/40 cursor-pointer transition"
                      >
                        <td className="py-2.5 text-slate-400">{ev.timestamp}</td>
                        <td className="py-2.5 text-slate-300 font-bold">{ev.event_id}</td>
                        <td className="py-2.5 text-slate-400">
                          {ev.source.ip} → {ev.destination.ip}
                        </td>
                        <td className="py-2.5">
                          <span className={isBlocked ? "text-rose-400 font-bold" : "text-cyan-300"}>
                            {ev.prediction.label}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={ev.open_set.uncertainty >= ev.open_set.threshold ? "text-rose-400 font-bold" : "text-emerald-400"}>
                            {ev.open_set.uncertainty.toFixed(3)}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                              isBlocked
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {ev.decision.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {recentEvents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No traffic events recorded yet. Click &quot;Live Traffic&quot; to start the simulation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
