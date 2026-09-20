/**
 * frontend/components/IncidentsTab.tsx
 * Enterprise SOC incident triage console.
 * Manages zero-day alerts, severity scoring, occurrence deduplication,
 * and lifecycle status transitions.
 */
"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle,
  FileText,
  Layers,
  Search,
} from "lucide-react";
import { Incident } from "@/types/soc";
import { api } from "@/lib/api";

interface IncidentsTabProps {
  incidents: Incident[];
  onRefresh: () => void;
  onNavigateToDiscovery: () => void;
}

export function IncidentsTab({
  incidents,
  onRefresh,
  onNavigateToDiscovery,
}: IncidentsTabProps) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    incidents.length > 0 ? incidents[0] : null
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filtered = incidents.filter((inc) => {
    if (statusFilter !== "ALL" && inc.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (
      inc.id.toLowerCase().includes(t) ||
      inc.title.toLowerCase().includes(t) ||
      inc.source_ip.toLowerCase().includes(t) ||
      inc.attack_category.toLowerCase().includes(t)
    );
  });

  const handleUpdateStatus = async (status: string) => {
    if (!selectedIncident) return;
    try {
      const updated = await api.updateIncident(selectedIncident.id, { status });
      setSelectedIncident(updated);
      onRefresh();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0A0F1D] p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono">
              Security Incident Queue ({filtered.length})
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Automated anomaly triage for flows exceeding Dirichlet uncertainty threshold (τ = 0.1844)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 font-mono text-xs">
            {["ALL", "NEW", "INVESTIGATING", "CONTAINED", "RESOLVED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  statusFilter === st
                    ? "bg-slate-800 text-cyan-300 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split View: Queue List on Left, Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incident List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {filtered.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;
            const isCritical = inc.severity === "CRITICAL";
            return (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`rounded-xl border p-4 cursor-pointer transition ${
                  isSelected
                    ? "border-cyan-500/60 bg-slate-900 shadow-md"
                    : "border-slate-800 bg-[#0A0F1D] hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-white">{inc.id}</span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase ${
                        isCritical
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-mono text-slate-400 border border-slate-700">
                      {inc.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">{inc.last_seen}</span>
                </div>

                <h3 className="text-xs font-semibold text-slate-200 mb-1">{inc.title}</h3>

                <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] font-mono text-slate-400">
                  <div>
                    <span className="text-slate-600 block text-[9px]">SOURCE HOST</span>
                    <span className="text-slate-300">{inc.source_ip}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block text-[9px]">UNCERTAINTY</span>
                    <span className="text-rose-400 font-bold">{inc.uncertainty.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block text-[9px]">OCCURRENCES</span>
                    <span className="text-cyan-400 font-bold">{inc.occurrences} flows</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-12 text-center text-slate-500 font-mono text-xs">
              No incidents matching active filters.
            </div>
          )}
        </div>

        {/* Right Column: Incident Inspection & Action Panel (5 cols) */}
        <div className="lg:col-span-5">
          {selectedIncident ? (
            <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-5 space-y-5 sticky top-24">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold text-white">
                    {selectedIncident.id}
                  </span>
                  <span className="rounded px-2 py-0.5 text-xs font-mono font-bold bg-slate-800 text-cyan-300 border border-cyan-500/30">
                    {selectedIncident.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-200">
                  {selectedIncident.title}
                </h3>
              </div>

              {/* Triage Action Buttons */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                  Incident Lifecycle Status Transition
                </span>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                  <button
                    onClick={() => handleUpdateStatus("INVESTIGATING")}
                    className="rounded bg-slate-800 hover:bg-slate-700 py-1.5 text-[11px] text-cyan-300 border border-slate-700 transition"
                  >
                    Investigate
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("CONTAINED")}
                    className="rounded bg-slate-800 hover:bg-slate-700 py-1.5 text-[11px] text-amber-300 border border-slate-700 transition"
                  >
                    Contain
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("RESOLVED")}
                    className="rounded bg-slate-800 hover:bg-slate-700 py-1.5 text-[11px] text-emerald-300 border border-slate-700 transition"
                  >
                    Resolve
                  </button>
                </div>
              </div>

              {/* Incident Details Card */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="text-rose-300 font-bold">{selectedIncident.attack_category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Source IP:</span>
                  <span className="text-slate-200">{selectedIncident.source_ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination IP:</span>
                  <span className="text-slate-200">{selectedIncident.destination_ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dirichlet Uncertainty:</span>
                  <span className="text-rose-400 font-bold">{selectedIncident.uncertainty.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">First Detected:</span>
                  <span className="text-slate-300">{selectedIncident.first_seen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Associated Flows:</span>
                  <span className="text-cyan-400 font-bold">{selectedIncident.event_ids.length}</span>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                  Recommended SOC Playbook
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                  {selectedIncident.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Discovery Pool Link */}
              <button
                onClick={onNavigateToDiscovery}
                className="w-full flex items-center justify-center space-x-2 rounded-lg bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 py-2.5 text-xs font-mono font-bold text-cyan-300 transition"
              >
                <Layers className="h-4 w-4" />
                <span>View in Zero-Day Discovery Clustering</span>
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-12 text-center text-slate-500 font-mono text-xs">
              Select an incident from the queue to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
