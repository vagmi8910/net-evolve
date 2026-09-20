/**
 * frontend/components/views/IncidentsView.tsx
 * Apple / Linear style Security Incident Queue & Investigation Console.
 * Manages zero-day alerts, severity scoring, deduplication, and lifecycle transitions.
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
  Filter,
  ArrowRight,
  Shield,
  Activity,
  History,
  AlertCircle,
  Check,
} from "lucide-react";
import { Incident } from "@/types/soc";
import { api } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { SeverityBadge, IncidentStatusBadge } from "@/components/ui/StatusBadge";

interface IncidentsViewProps {
  incidents: Incident[];
  onRefresh: () => void;
  onNavigateToDiscovery: () => void;
}

export function IncidentsView({
  incidents,
  onRefresh,
  onNavigateToDiscovery,
}: IncidentsViewProps) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    incidents.length > 0 ? incidents[0] : null
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("" );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  React.useEffect(() => {
    if (!selectedIncident && incidents.length > 0) {
      setSelectedIncident(incidents[0]);
    } else if (selectedIncident) {
      const match = incidents.find((i) => i.id === selectedIncident.id);
      if (match) setSelectedIncident(match);
    }
  }, [incidents, selectedIncident]);

  const filtered = incidents.filter((inc) => {
    if (statusFilter !== "ALL" && inc.status !== statusFilter) return false;
    if (severityFilter !== "ALL" && inc.severity !== severityFilter) return false;
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (
      inc.id.toLowerCase().includes(t) ||
      inc.title.toLowerCase().includes(t) ||
      inc.source_ip.toLowerCase().includes(t) ||
      inc.attack_category.toLowerCase().includes(t)
    );
  });

  const criticalCount = incidents.filter((i) => i.severity === "CRITICAL").length;
  const highCount = incidents.filter((i) => i.severity === "HIGH").length;
  const activeCount = incidents.filter(
    (i) => i.status === "NEW" || i.status === "INVESTIGATING"
  ).length;

  const handleUpdateStatus = async (status: Incident["status"]) => {
    if (!selectedIncident) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await api.updateIncident(selectedIncident.id, { status });
      setSelectedIncident(updated);
      onRefresh();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
            Incidents
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1.5 font-normal">
            {activeCount > 0 ? `${activeCount} active investigations` : "No active investigations"} • Anomaly triage for flows exceeding threshold (τ = 0.1844)
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Active Investigations"
          value={activeCount}
          delta={activeCount > 0 ? `${activeCount} open` : "Clear"}
          trend={activeCount > 0 ? "warning" : "neutral"}
          subtitle="Requiring analyst review"
          icon={AlertTriangle}
          color="amber"
        />
        <MetricCard
          title="Critical Severity"
          value={criticalCount}
          subtitle="Direct containment needed"
          icon={ShieldAlert}
          color="rose"
        />
        <MetricCard
          title="High Severity"
          value={highCount}
          subtitle="Open-set uncertainty"
          icon={AlertCircle}
          color="amber"
        />
        <MetricCard
          title="Total Deduplicated"
          value={incidents.length}
          subtitle="Grouped anomaly flows"
          icon={Layers}
          color="blue"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search ID, title, IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-56 sm:w-64 rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#007AFF] focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-gray-400">Severity:</span>
              <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
                {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                      severityFilter === sev
                        ? "bg-white text-gray-900 shadow-sm font-semibold"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
            {["ALL", "NEW", "INVESTIGATING", "CONTAINED", "RESOLVED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  statusFilter === st
                    ? "bg-white text-gray-900 shadow-sm font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split View: Queue on Left, Inspection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incident List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {filtered.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;

            return (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`rounded-2xl border p-5 cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "border-[#007AFF] bg-blue-50/20 shadow-sm ring-1 ring-[#007AFF]/20"
                    : "border-[#E5E7EB] bg-white hover:border-gray-300 hover:bg-[#FDFDFD]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold text-gray-900">{inc.id}</span>
                    <SeverityBadge severity={inc.severity} />
                    <IncidentStatusBadge status={inc.status} />
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{inc.last_seen}</span>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-2">{inc.title}</h3>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">SOURCE</span>
                    <span className="font-mono text-gray-800 font-medium">{inc.source_ip}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">UNCERTAINTY</span>
                    <span className="font-mono text-red-600 font-semibold">{inc.uncertainty.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">OCCURRENCES</span>
                    <span className="text-gray-900 font-medium">{inc.occurrences} flows</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400 text-xs">
              No incidents matching the active filter criteria.
            </div>
          )}
        </div>

        {/* Right Column: Selected Incident Inspection (5 cols) */}
        <div className="lg:col-span-5">
          {selectedIncident ? (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-5 sticky top-24">
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold text-gray-500">
                    {selectedIncident.id}
                  </span>
                  <div className="flex items-center space-x-2">
                    <SeverityBadge severity={selectedIncident.severity} />
                    <IncidentStatusBadge status={selectedIncident.status} />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  {selectedIncident.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Target Destination: <span className="font-mono text-gray-800">{selectedIncident.destination_ip}</span>
                </p>
              </div>

              {/* Status Transition Buttons */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
                  Incident Status Action
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    disabled={isUpdatingStatus || selectedIncident.status === "INVESTIGATING"}
                    onClick={() => handleUpdateStatus("INVESTIGATING")}
                    className={`rounded-lg py-2 text-xs font-medium border transition ${
                      selectedIncident.status === "INVESTIGATING"
                        ? "bg-blue-50 text-[#007AFF] border-blue-200 font-semibold"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    Investigate
                  </button>
                  <button
                    disabled={isUpdatingStatus || selectedIncident.status === "CONTAINED"}
                    onClick={() => handleUpdateStatus("CONTAINED")}
                    className={`rounded-lg py-2 text-xs font-medium border transition ${
                      selectedIncident.status === "CONTAINED"
                        ? "bg-amber-50 text-amber-700 border-amber-200 font-semibold"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    Contain
                  </button>
                  <button
                    disabled={isUpdatingStatus || selectedIncident.status === "RESOLVED"}
                    onClick={() => handleUpdateStatus("RESOLVED")}
                    className={`rounded-lg py-2 text-xs font-medium border transition ${
                      selectedIncident.status === "RESOLVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    Resolve
                  </button>
                </div>
              </div>

              {/* Details Summary */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Attack Hypothesis:</span>
                  <span className="text-red-700 font-medium">{selectedIncident.attack_category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Source Host:</span>
                  <span className="font-mono text-gray-800">{selectedIncident.source_ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Target Host:</span>
                  <span className="font-mono text-gray-800">{selectedIncident.destination_ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dirichlet Vacuity:</span>
                  <span className="font-mono text-red-600 font-semibold">
                    u = {selectedIncident.uncertainty.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">First Detected:</span>
                  <span className="font-mono text-gray-700">{selectedIncident.first_seen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Affected Flows:</span>
                  <span className="font-semibold text-gray-900">{selectedIncident.occurrences} flows</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
                  Timeline
                </span>
                <div className="relative pl-5 space-y-3 text-xs border-l border-gray-200 ml-2">
                  <div className="relative">
                    <div className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-4 ring-white" />
                    <span className="text-gray-400 text-[11px]">{selectedIncident.first_seen}</span>
                    <p className="text-gray-700 mt-0.5">
                      Open-set anomaly detected: Dirichlet uncertainty crossed τ = 0.1844.
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-white" />
                    <span className="text-gray-400 text-[11px]">Automated Correlation</span>
                    <p className="text-gray-700 mt-0.5">
                      Aggregated {selectedIncident.occurrences} related flows from {selectedIncident.source_ip}.
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-[#007AFF] ring-4 ring-white" />
                    <span className="text-gray-400 text-[11px]">Current State: {selectedIncident.status}</span>
                    <p className="text-gray-700 mt-0.5">
                      Assigned to Zero-Day Latent Discovery pool for cluster verification.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommended Playbook */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
                  Recommended Response
                </span>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  {selectedIncident.recommendations?.map((rec, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-[#007AFF] mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Discovery Pool Link */}
              <button
                onClick={onNavigateToDiscovery}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#007AFF] py-2.5 text-xs font-semibold border border-blue-200 transition"
              >
                <Layers className="h-4 w-4" />
                <span>Examine in Zero-Day Discovery</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400 text-xs">
              Select an incident from the queue to view investigation details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
