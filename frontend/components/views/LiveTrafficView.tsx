/**
 * frontend/components/views/LiveTrafficView.tsx
 * Apple / Linear style enterprise live traffic monitoring console.
 * Real-time network flow inspection with refined controls, breathable typography,
 * column sorting, search filtering, and drawer trigger.
 */
"use client";

import React, { useState, useMemo } from "react";
import {
  Play,
  Pause,
  Square,
  Search,
  Download,
  Eye,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { DecisionBadge } from "@/components/ui/StatusBadge";
import { TrafficEvent, SimStatus } from "@/types/soc";

interface LiveTrafficViewProps {
  events: TrafficEvent[];
  metrics: SimStatus;
  initialCategoryFilter?: string;
  onSelectEvent: (event: TrafficEvent) => void;
  onStart: (speed: number, unknownRate: number, scenario: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function LiveTrafficView({
  events,
  metrics,
  initialCategoryFilter = "",
  onSelectEvent,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
}: LiveTrafficViewProps) {
  const [speed, setSpeed] = useState<number>(1.0);
  const [unknownRate, setUnknownRate] = useState<number>(0.05);
  const [scenario, setScenario] = useState<string>("Mixed Enterprise Traffic");
  const [searchTerm, setSearchTerm] = useState<string>(initialCategoryFilter);
  const [decisionFilter, setDecisionFilter] = useState<string>("ALL");
  const [unknownOnly, setUnknownOnly] = useState<boolean>(false);
  const [sortField, setSortField] = useState<"timestamp" | "uncertainty" | "confidence" | "bytes">("timestamp");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filtered and sorted events
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        if (decisionFilter !== "ALL" && ev.decision.status !== decisionFilter) return false;
        if (unknownOnly && !ev.open_set.is_unknown) return false;
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          ev.event_id.toLowerCase().includes(term) ||
          ev.source.ip.toLowerCase().includes(term) ||
          ev.destination.ip.toLowerCase().includes(term) ||
          ev.prediction.label.toLowerCase().includes(term) ||
          (ev.ground_truth && ev.ground_truth.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        let valA: number | string = 0;
        let valB: number | string = 0;
        if (sortField === "timestamp") {
          valA = a.timestamp;
          valB = b.timestamp;
        } else if (sortField === "uncertainty") {
          valA = a.open_set.uncertainty;
          valB = b.open_set.uncertainty;
        } else if (sortField === "confidence") {
          valA = a.prediction.confidence;
          valB = b.prediction.confidence;
        } else if (sortField === "bytes") {
          valA = a.bytes;
          valB = b.bytes;
        }
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [events, decisionFilter, unknownOnly, searchTerm, sortField, sortAsc]);

  const handleExportCSV = () => {
    if (filteredEvents.length === 0) return;
    const headers = "Time,Flow_ID,Source_IP,Dest_IP,Protocol,Class,Confidence,Uncertainty,Decision\n";
    const rows = filteredEvents.map((ev) =>
      `"${ev.timestamp}","${ev.event_id}","${ev.source.ip}","${ev.destination.ip}","${ev.protocol}","${ev.prediction.label}",${ev.prediction.confidence.toFixed(3)},${ev.open_set.uncertainty.toFixed(4)},"${ev.decision.status}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `netevolve_traffic_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: "timestamp" | "uncertainty" | "confidence" | "bytes") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
            Live Traffic
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1.5 font-normal">
            Real-time inspection of network flows through RoNeTC+ evidential evaluation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredEvents.length === 0}
            className="flex items-center space-x-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-medium text-gray-700 shadow-sm transition disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-gray-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Clean Control Bar */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Stream Status & Playback Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 rounded-lg bg-gray-50 border border-gray-200/80 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    metrics.is_running ? "bg-[#16A34A]" : "bg-gray-400"
                  }`}
                />
              </span>
              <span className="text-xs font-semibold text-gray-800">
                {metrics.is_running ? "LIVE" : "IDLE"}
              </span>
            </div>

            {!metrics.is_running ? (
              <button
                onClick={() => onStart(speed, unknownRate, scenario)}
                className="flex items-center space-x-1.5 rounded-lg bg-[#007AFF] hover:bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start Stream</span>
              </button>
            ) : metrics.is_paused ? (
              <button
                onClick={onResume}
                className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex items-center space-x-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition"
              >
                <Pause className="h-3.5 w-3.5 text-gray-600" />
                <span>Pause</span>
              </button>
            )}

            {metrics.is_running && (
              <button
                onClick={onStop}
                className="rounded-lg border border-gray-200 bg-white hover:bg-gray-50 p-1.5 text-gray-600 shadow-sm transition"
                title="Stop Stream"
              >
                <Square className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Speed Multiplier */}
            <div className="flex items-center space-x-1 border-l border-gray-200 pl-3">
              <span className="text-xs text-gray-400 mr-1">Speed:</span>
              {[1.0, 2.0, 5.0, 10.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    speed === s
                      ? "bg-blue-50 text-[#007AFF] font-semibold"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Scenario Selector */}
            <div className="flex items-center space-x-2 border-l border-gray-200 pl-3">
              <span className="text-xs text-gray-400">Scenario:</span>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-[#007AFF]"
              >
                <option value="Mixed Enterprise Traffic">Mixed Enterprise</option>
                <option value="Zero-Day Burst">Zero-Day Burst</option>
                <option value="Attack Storm">Attack Storm</option>
                <option value="Benign Verification">Clean Benign</option>
              </select>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center space-x-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search IP, flow, class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 sm:w-60 rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#007AFF] focus:bg-white"
              />
            </div>

            {/* Decision Filter */}
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#007AFF]"
            >
              <option value="ALL">All Decisions</option>
              <option value="ALLOWED">Allowed Only</option>
              <option value="SUSPICIOUS">Suspicious Only</option>
              <option value="BLOCKED">Blocked Only</option>
            </select>

            {/* Unknown Zero-Day Filter */}
            <button
              onClick={() => setUnknownOnly(!unknownOnly)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border transition ${
                unknownOnly
                  ? "bg-purple-50 text-purple-700 border-purple-200 font-semibold"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:text-gray-900"
              }`}
            >
              Unknown Only
            </button>
          </div>
        </div>
      </div>

      {/* Enterprise Data Table Card */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-[#FAFAFA] text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                <th
                  onClick={() => handleSort("timestamp")}
                  className="py-3 px-4 cursor-pointer select-none hover:text-gray-900 font-normal"
                >
                  <div className="flex items-center space-x-1">
                    <span>TIME</span>
                    {sortField === "timestamp" && (
                      sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 font-normal">FLOW ID</th>
                <th className="py-3 px-4 font-normal">SOURCE</th>
                <th className="py-3 px-4 font-normal">DESTINATION</th>
                <th className="py-3 px-4 font-normal">PROTOCOL</th>
                <th className="py-3 px-4 font-normal">CLASSIFICATION</th>
                <th
                  onClick={() => handleSort("uncertainty")}
                  className="py-3 px-4 cursor-pointer select-none hover:text-gray-900 font-normal"
                >
                  <div className="flex items-center space-x-1">
                    <span>UNCERTAINTY</span>
                    {sortField === "uncertainty" && (
                      sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 font-normal">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {filteredEvents.map((ev) => {
                const isBlocked = ev.open_set.is_unknown || ev.decision.status === "BLOCKED";

                return (
                  <tr
                    key={ev.event_id}
                    onClick={() => onSelectEvent(ev)}
                    className="hover:bg-[#F9FAFB] cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono text-gray-500">{ev.timestamp}</td>
                    <td className="py-3 px-4 font-mono font-medium text-gray-900">{ev.event_id}</td>
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {ev.source.ip}:{ev.source.port}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {ev.destination.ip}:{ev.destination.port}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-gray-500">{ev.protocol}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-medium text-gray-900">{ev.prediction.label}</span>
                        {ev.open_set.is_unknown && (
                          <span className="rounded-full bg-purple-50 px-1.5 py-0.2 text-[10px] font-medium text-purple-700 border border-purple-200">
                            Zero-Day
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono font-medium ${
                          ev.open_set.uncertainty >= ev.open_set.threshold
                            ? "text-red-600 font-semibold"
                            : "text-gray-600"
                        }`}
                      >
                        {ev.open_set.uncertainty.toFixed(4)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <DecisionBadge decision={ev.decision.status} />
                    </td>
                  </tr>
                );
              })}

              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                    {events.length === 0
                      ? "Traffic stream idle. Click 'Start Stream' to inspect live flows."
                      : "No flows matching the active search or filters."}
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
