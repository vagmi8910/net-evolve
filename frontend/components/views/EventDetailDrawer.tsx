/**
 * frontend/components/views/EventDetailDrawer.tsx
 * Apple-style Flow Investigation Drawer.
 * Clean right-side slide-over drawer displaying multi-view evidential reasoning,
 * Dirichlet parameters, and Dempster-Shafer opinion fusion.
 */
"use client";

import React from "react";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Network,
  Cpu,
  ArrowRight,
  GitMerge,
  Layers,
} from "lucide-react";
import { TrafficEvent } from "@/types/soc";
import { EvidenceMeter } from "@/components/ui/EvidenceMeter";
import { DecisionBadge } from "@/components/ui/StatusBadge";

interface EventDetailDrawerProps {
  event: TrafficEvent | null;
  onClose: () => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToIncidents?: () => void;
}

export function EventDetailDrawer({
  event,
  onClose,
  onNavigateToDiscovery,
  onNavigateToIncidents,
}: EventDetailDrawerProps) {
  if (!event) return null;

  const isBlocked = event.decision.status === "BLOCKED" || event.open_set.is_unknown;
  const isSuspicious = event.decision.status === "SUSPICIOUS";

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/20 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className="w-screen max-w-md border-l border-[#E5E7EB] bg-white text-gray-900 shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-[#FAFAFA]">
            <div className="flex items-center space-x-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                  isBlocked
                    ? "bg-red-50 border-red-200 text-red-600"
                    : isSuspicious
                    ? "bg-amber-50 border-amber-200 text-amber-600"
                    : "bg-emerald-50 border-emerald-200 text-emerald-600"
                }`}
              >
                {isBlocked ? (
                  <AlertOctagon className="h-5 w-5" />
                ) : isSuspicious ? (
                  <ShieldAlert className="h-5 w-5" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-gray-900">
                    Flow Investigation
                  </span>
                  <DecisionBadge decision={event.decision.status} />
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  {event.event_id} • {event.timestamp}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm">
            {/* Zero-Day Banner if Unknown */}
            {isBlocked && (
              <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-red-900 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-semibold text-red-700">
                  <AlertOctagon className="h-4 w-4" />
                  <span>Zero-Day Anomaly Candidate</span>
                </div>
                <p className="text-xs text-red-800 leading-relaxed">
                  Dirichlet uncertainty (<strong>u = {event.open_set.uncertainty.toFixed(4)}</strong>) exceeded
                  the open-set threshold (<strong>τ = {event.open_set.threshold}</strong>). The flow does not match known closed-set classes.
                </p>
                {event.ground_truth && (
                  <div className="mt-1 pt-1 text-[11px] text-red-700 font-medium">
                    Withheld Benchmark Category: <strong>{event.ground_truth}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Flow Metadata Section */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <Network className="h-3.5 w-3.5 text-[#007AFF]" />
                <span>Flow Metadata</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">SOURCE</span>
                  <span className="font-mono text-gray-900 font-medium">
                    {event.source.ip}:{event.source.port}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">DESTINATION</span>
                  <span className="font-mono text-gray-900 font-medium">
                    {event.destination.ip}:{event.destination.port}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">PROTOCOL / SERVICE</span>
                  <span className="font-mono text-gray-900">
                    {event.protocol} / {event.service}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">VOLUME</span>
                  <span className="text-gray-900">
                    {event.packets} pkts • {(event.bytes / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            </div>

            {/* Model Decision Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <Cpu className="h-3.5 w-3.5 text-[#007AFF]" />
                  <span>Model Decision</span>
                </div>
                <span className="text-xs text-gray-500">
                  Confidence: <strong className="text-gray-900">{(event.prediction.confidence * 100).toFixed(1)}%</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-gray-50 p-2.5 border border-gray-100">
                  <span className="text-gray-400 block text-[11px]">PREDICTION</span>
                  <span className="text-sm font-semibold text-gray-900">{event.prediction.label}</span>
                </div>
                <div className="rounded-lg bg-gray-50 p-2.5 border border-gray-100">
                  <span className="text-gray-400 block text-[11px]">UNCERTAINTY (u)</span>
                  <span
                    className={`text-sm font-semibold font-mono ${
                      event.open_set.uncertainty >= event.open_set.threshold
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {event.open_set.uncertainty.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                <span>Reason: </span>
                <span className="text-gray-700">{event.decision.reason}</span>
              </div>
            </div>

            {/* Multi-View Evidence Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Multi-View Evidence Opinions
                </span>
                <span className="text-[11px] text-gray-400">Dempster-Shafer</span>
              </div>

              <EvidenceMeter
                belief={event.views.ip.belief}
                uncertainty={event.views.ip.uncertainty}
                label="IP View (9 Features)"
              />

              <EvidenceMeter
                belief={event.views.transport.belief}
                uncertainty={event.views.transport.uncertainty}
                label="Transport View (7 Features)"
              />

              <EvidenceMeter
                belief={event.views.payload.belief}
                uncertainty={event.views.payload.uncertainty}
                label="Payload View (6 Features)"
              />

              {/* Dempster-Shafer Central Fused Opinion */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-blue-900 flex items-center space-x-1.5">
                    <GitMerge className="h-3.5 w-3.5 text-[#007AFF]" />
                    <span>Dempster-Shafer Fused Opinion</span>
                  </span>
                  <span className="text-[11px] text-blue-700 font-medium">Unified Consensus</span>
                </div>
                <EvidenceMeter
                  belief={event.fused.belief}
                  uncertainty={event.fused.uncertainty}
                  label="Central Consensus"
                  highlight
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              {event.open_set.is_unknown && onNavigateToDiscovery && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToDiscovery();
                  }}
                  className="w-full flex items-center justify-center space-x-2 rounded-xl bg-[#007AFF] hover:bg-blue-600 py-2.5 text-xs font-semibold text-white transition shadow-sm"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Inspect in Zero-Day Discovery</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              {onNavigateToIncidents && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToIncidents();
                  }}
                  className="w-full flex items-center justify-center space-x-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2.5 text-xs font-medium text-gray-700 transition"
                >
                  <span>View Related Incidents Queue</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
