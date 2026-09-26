/**
 * frontend/components/observability/PipelineDiagram.tsx
 * Interactive horizontal workflow diagram representing the RoNeTC+ inference pipeline.
 * Features connected nodes, glowing data flow particles, branching multi-views, and interactive step jumping.
 */
"use client";

import React from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  GitMerge,
  Scale,
  ShieldAlert,
  Radio,
} from "lucide-react";
import { SimulationSample } from "./SimulationExplanation";

interface PipelineDiagramProps {
  currentStep: number;
  totalSteps: number;
  sample: SimulationSample;
  isUnknownMode: boolean;
  onSelectStep: (step: number) => void;
}

export function PipelineDiagram({
  currentStep,
  totalSteps,
  sample,
  isUnknownMode,
  onSelectStep,
}: PipelineDiagramProps) {
  const threshold = sample.decision.threshold;
  const fusedU = sample.fusion.fusedUncertainty;
  const isRejected = fusedU >= threshold;

  const steps = [
    {
      step: 1,
      name: "Network Flow",
      badge: "Ingestion",
      shortDesc: `${sample.protocol} ${sample.sourceIp} -> ${sample.destPort}`,
    },
    {
      step: 2,
      name: "Normalization",
      badge: "42 Features",
      shortDesc: "Scaled continuous vector",
    },
    {
      step: 3,
      name: "Multi-View Splicing",
      badge: "3 Domains",
      shortDesc: "IP, Transport, Payload",
    },
    {
      step: 4,
      name: "Evidence Gen",
      badge: "Softplus",
      shortDesc: "Non-negative evidence",
    },
    {
      step: 5,
      name: "Dirichlet Opinion",
      badge: "Subj. Logic",
      shortDesc: `u = ${sample.dirichlet.uncertainty.toFixed(3)}`,
    },
    {
      step: 6,
      name: "D-S Fusion",
      badge: "Multi-View",
      shortDesc: `Fused u = ${fusedU.toFixed(3)}`,
    },
    {
      step: 7,
      name: "Decision Gate",
      badge: "tau = 0.1844",
      shortDesc: `${fusedU.toFixed(3)} ${isRejected ? ">=" : "<"} 0.1844`,
    },
    {
      step: 8,
      name: isRejected || isUnknownMode ? "Zero-Day Quarantine" : "Known Allowed",
      badge: isRejected || isUnknownMode ? "BLOCK" : "ALLOW",
      shortDesc: isRejected || isUnknownMode ? "Novel Class Discovery" : `Class: ${sample.category}`,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.04)] space-y-4">
      {/* Header with Live Flow Particle Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="flex h-2.5 w-2.5 rounded-full bg-[#007AFF] animate-ping" />
          <h3 className="text-sm font-bold text-gray-950 font-heading">
            RoNeTC+ Evidential Pipeline Architecture
          </h3>
          <span className="text-xs text-gray-400 font-normal">
            (Click any stage to inspect)
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1.5 text-gray-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Completed</span>
          </span>
          <span className="flex items-center space-x-1.5 text-[#007AFF] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
            <span>Active Flow</span>
          </span>
          <span className="flex items-center space-x-1.5 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-200" />
            <span>Pending</span>
          </span>
        </div>
      </div>

      {/* Horizontal Flow Pipeline (Desktop / Laptop) */}
      <div className="hidden lg:grid lg:grid-cols-8 gap-2.5 relative pt-1">
        {steps.map((s, idx) => {
          const isCompleted = currentStep > s.step;
          const isActive = currentStep === s.step;
          const isPending = currentStep < s.step;

          let statusBg = "bg-white border-slate-200 text-gray-600 hover:border-slate-300";
          let badgeBg = "bg-slate-100 text-gray-600";
          let ringColor = "";

          if (isCompleted) {
            statusBg = "bg-emerald-50/40 border-emerald-200 text-emerald-900";
            badgeBg = "bg-emerald-100/70 text-emerald-800 font-semibold";
          } else if (isActive) {
            statusBg = "bg-blue-50/60 border-[#007AFF] text-gray-950 shadow-sm";
            badgeBg = "bg-blue-100 text-[#007AFF] font-bold";
            ringColor = "ring-2 ring-blue-500/20";
          }

          if (s.step === 8) {
            if (isRejected || isUnknownMode) {
              if (isActive || isCompleted) {
                statusBg = "bg-rose-50/60 border-rose-300 text-rose-950 shadow-sm";
                badgeBg = "bg-rose-100 text-rose-700 font-bold";
              }
            }
          }

          return (
            <div key={s.step} className="relative flex flex-col items-center">
              {/* Connector Arrow to next step */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 -right-2.5 w-4 z-10 text-slate-300 pointer-events-none">
                  <ArrowRight
                    className={`h-3 w-3 ${
                      currentStep > s.step ? "text-emerald-500" : "text-slate-300"
                    }`}
                  />
                </div>
              )}

              {/* Node Card */}
              <div
                onClick={() => onSelectStep(s.step)}
                className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-200 select-none ${statusBg} ${ringColor}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeBg}`}>
                    {s.badge}
                  </span>

                  <span className="flex items-center justify-center w-4 h-4 rounded-full text-[10px]">
                    {isCompleted ? (
                      <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                    ) : isActive ? (
                      <span className="h-2 w-2 rounded-full bg-[#007AFF] animate-ping" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                    )}
                  </span>
                </div>

                <div className="text-xs font-bold leading-tight line-clamp-1 font-heading">
                  {s.name}
                </div>

                <div className="text-[10px] text-gray-500 mt-1 truncate">
                  {s.shortDesc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Responsive Stacked Timeline for Tablet / Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:hidden gap-2.5 pt-1">
        {steps.map((s) => {
          const isCompleted = currentStep > s.step;
          const isActive = currentStep === s.step;

          let statusBg = "bg-white border-slate-200 text-gray-700";
          if (isCompleted) statusBg = "bg-emerald-50/40 border-emerald-200 text-emerald-900";
          if (isActive) statusBg = "bg-blue-50/60 border-[#007AFF] text-gray-950 ring-1 ring-blue-500/20";

          return (
            <div
              key={s.step}
              onClick={() => onSelectStep(s.step)}
              className={`p-3 rounded-xl border cursor-pointer text-xs space-y-1 ${statusBg}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-400">Step {s.step}</span>
                {isCompleted && <Check className="h-3 w-3 text-emerald-600" />}
                {isActive && <span className="h-2 w-2 rounded-full bg-[#007AFF]" />}
              </div>
              <div className="font-bold text-gray-900 truncate font-heading">{s.name}</div>
              <div className="text-[10px] text-gray-500 truncate">{s.shortDesc}</div>
            </div>
          );
        })}
      </div>

      {/* Multi-View Visual Expansion when Step 3 or 4 is Active */}
      {(currentStep === 3 || currentStep === 4) && (
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
          <div className="p-2.5 rounded-lg bg-white border border-blue-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-gray-900">
              <span>🌐 IP View Backbone</span>
              <span className="text-[10px] font-mono text-[#007AFF]">128-D Embedding</span>
            </div>
            <p className="text-[10px] text-gray-500">
              CNN extractors learn flow volume & packet duration distributions.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-indigo-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-gray-900">
              <span>⚡ Transport View Backbone</span>
              <span className="text-[10px] font-mono text-indigo-600">128-D Embedding</span>
            </div>
            <p className="text-[10px] text-gray-500">
              MLP layers track TCP state machine transitions & port targeting.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-purple-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-gray-900">
              <span>📦 Payload View Backbone</span>
              <span className="text-[10px] font-mono text-purple-600">128-D Embedding</span>
            </div>
            <p className="text-[10px] text-gray-500">
              Convolutional filters examine mean packet payload size histograms.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
