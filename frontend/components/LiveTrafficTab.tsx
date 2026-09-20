/**
 * frontend/components/LiveTrafficTab.tsx
 * High-throughput, real-time SOC traffic monitoring console.
 * Includes interactive simulation controls, scenario selector, speed multipliers,
 * and dense event table with instant multi-view drawer triggers.
 */
"use client";

import React, { useState, useMemo } from "react";
import {
  Play,
  Pause,
  Square,
  Search,
  Filter,
  Sliders,
  AlertOctagon,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { TrafficEvent, SimStatus } from "@/types/soc";

interface LiveTrafficTabProps {
  events: TrafficEvent[];
  metrics: SimStatus;
  onSelectEvent: (event: TrafficEvent) => void;
  onStart: (speed: number, unknownRate: number, scenario: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function LiveTrafficTab({
  events,
  metrics,
  onSelectEvent,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
}: LiveTrafficTabProps) {
  const [speed, setSpeed] = useState<number>(1.0);
  const [unknownRate, setUnknownRate] = useState<number>(0.05);
  const [scenario, setScenario] = useState<string>("Mixed Enterprise Traffic");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (statusFilter !== "ALL" && ev.decision.status !== statusFilter) {
        return false;
      }
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        ev.event_id.toLowerCase().includes(term) ||
        ev.source.ip.toLowerCase().includes(term) ||
        ev.destination.ip.toLowerCase().includes(term) ||
        ev.prediction.label.toLowerCase().includes(term) ||
        (ev.ground_truth && ev.ground_truth.toLowerCase().includes(term))
      );
    });
  }, [events, statusFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Simulation Control Toolbar */}
      <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Primary Action Buttons */}
          <div className="flex items-center space-x-2">
            {!metrics.is_running ? (
              <button
                onClick={() => onStart(speed, unknownRate, scenario)}
                className="flex items-center space-x-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2 font-mono text-xs font-bold text-slate-950 transition shadow-sm shadow-cyan-500/20"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>START LIVE STREAM</span>
              </button>
            ) : metrics.is_paused ? (
              <button
                onClick={onResume}
                className="flex items-center space-x-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 font-mono text-xs font-bold text-slate-950 transition"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>RESUME</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex items-center space-x-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 font-mono text-xs font-bold text-slate-950 transition"
              >
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>PAUSE</span>
              </button>
            )}

            {metrics.is_running && (
              <button
                onClick={onStop}
                className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 font-mono text-xs font-medium text-slate-300 transition"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>STOP</span>
              </button>
            )}

            <button
              onClick={onReset}
              className="rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-2 font-mono text-xs text-slate-400 hover:text-white transition"
            >
              Clear Feed
            </button>
          </div>

          {/* Speed Multiplier */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-slate-500">SPEED:</span>
            <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
              {[0.5, 1.0, 2.0, 5.0, 10.0].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeed(s);
                    if (metrics.is_running) onStart(s, unknownRate, scenario);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                    speed === s
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-slate-500">SCENARIO:</span>
            <select
              value={scenario}
              onChange={(e) => {
                setScenario(e.target.value);
                if (metrics.is_running) onStart(speed, unknownRate, e.target.value);
              }}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="Mixed Enterprise Traffic">Mixed Enterprise (95% Known / 5% Zero-Day)</option>
              <option value="Zero-Day Burst">Zero-Day Burst (75% Known / 25% Zero-Day)</option>
              <option value="Attack Storm">Attack Storm (50% Known / 50% Bursts)</option>
              <option value="Clean In-Distribution">Clean Traffic (100% In-Distribution)</option>
            </select>
          </div>
        </div>

        {/* Filter & Rate Controls Bar */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-3 gap-4">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by IP, Flow ID, or Attack Class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1 font-mono text-xs">
            {["ALL", "ALLOWED", "BLOCKED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  statusFilter === st
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-300"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Unknown Injection Slider */}
          <div className="flex items-center space-x-3 font-mono text-xs">
            <span className="text-slate-500">Zero-Day Injection:</span>
            <input
              type="range"
              min="0.0"
              max="0.30"
              step="0.05"
              value={unknownRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setUnknownRate(val);
                if (metrics.is_running) onStart(speed, val, scenario);
              }}
              className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-cyan-400 font-bold w-9 text-right">
              {(unknownRate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Stream Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 z-10 bg-[#080D1A] border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">TIMESTAMP</th>
                <th className="py-3 px-3">FLOW ID</th>
                <th className="py-3 px-3">SOURCE ENDPOINT</th>
                <th className="py-3 px-3">DESTINATION</th>
                <th className="py-3 px-3">PROTO</th>
                <th className="py-3 px-3">SERVICE</th>
                <th className="py-3 px-3">PACKETS</th>
                <th className="py-3 px-3">BYTES</th>
                <th className="py-3 px-3">PREDICTION</th>
                <th className="py-3 px-3">CONFIDENCE</th>
                <th className="py-3 px-3">UNCERTAINTY (u)</th>
                <th className="py-3 px-3">DECISION</th>
                <th className="py-3 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredEvents.map((ev, index) => {
                const isBlocked = ev.decision.status === "BLOCKED" || ev.open_set.is_unknown;
                return (
                  <tr
                    key={ev.event_id + index}
                    onClick={() => onSelectEvent(ev)}
                    className={`hover:bg-slate-800/60 cursor-pointer transition ${
                      isBlocked ? "bg-rose-950/15" : ""
                    }`}
                  >
                    <td className="py-2.5 px-4 text-slate-400">{ev.timestamp}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-bold">{ev.event_id}</td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {ev.source.ip}:{ev.source.port}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {ev.destination.ip}:{ev.destination.port}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-400">{ev.protocol}</td>
                    <td className="py-2.5 px-3 text-slate-400">{ev.service}</td>
                    <td className="py-2.5 px-3 text-slate-300">{ev.packets}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {(ev.bytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-2.5 px-3 font-semibold">
                      <span className={isBlocked ? "text-rose-400 font-bold" : "text-emerald-400"}>
                        {ev.prediction.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {(ev.prediction.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold ${
                          ev.open_set.uncertainty >= ev.open_set.threshold
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {ev.open_set.uncertainty.toFixed(4)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase ${
                          isBlocked
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        {ev.decision.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition"
                        title="Inspect multi-view evidence opinions"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500">
                    {metrics.is_running
                      ? "Listening to live network gateway... incoming events will stream continuously."
                      : "Gateway simulation is idle. Click 'START LIVE STREAM' above to begin."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
