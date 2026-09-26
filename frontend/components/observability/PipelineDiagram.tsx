/**
 * frontend/components/observability/PipelineDiagram.tsx
 * Interactive Workflow Diagram inspired by the reference RoNeTC architecture diagram.
 * Renders the full vertical workflow with multi-view branching, decision diamond,
 * animated data flow simulation, live technical parameters, and interactive step navigation.
 */
"use client";

import React from "react";
import {
  Cloud,
  Filter,
  Network,
  AlignJustify,
  Binary,
  Cpu,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowDown,
  Sparkles,
  Layers,
  Zap,
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
  sample,
  isUnknownMode,
  onSelectStep,
}: PipelineDiagramProps) {
  const threshold = sample.decision.threshold;
  const fusedU = sample.fusion.fusedUncertainty;
  const isRejected = fusedU >= threshold;

  // Helper for node state styling
  const getNodeStyle = (stepNum: number, baseBorder: string, activeBg: string) => {
    const isCompleted = currentStep > stepNum;
    const isActive = currentStep === stepNum;

    if (isActive) {
      return `border-2 ${baseBorder} ${activeBg} shadow-md ring-4 ring-blue-500/10 scale-[1.01] transition-all duration-300`;
    }
    if (isCompleted) {
      return `border ${baseBorder} bg-white shadow-2xs opacity-95 transition-all`;
    }
    return `border border-slate-200 bg-white/70 opacity-60 hover:opacity-90 hover:border-slate-300 transition-all`;
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.04)] space-y-6">
      {/* Title & Live Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-heading block">
            END-TO-END WORKFLOW SIMULATION
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-950 font-heading mt-0.5">
            RoNeTC+ Evidential Workflow Architecture
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-gray-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
            <span>Active Stage: Step {currentStep}</span>
          </span>
          <span className="text-xs text-gray-400 hidden sm:inline">(Click any stage to jump)</span>
        </div>
      </div>

      {/* Main Flowchart Container */}
      <div className="max-w-2xl mx-auto flex flex-col items-center select-none pt-2">
        {/* ============================================================= */}
        {/* NODE 1: NETWORK TRAFFIC                                       */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(1)}
          className={`w-full max-w-lg p-4 rounded-2xl cursor-pointer ${getNodeStyle(
            1,
            "border-blue-400",
            "bg-blue-50/40"
          )}`}
        >
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[#007AFF]">
              <Cloud className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-950 font-heading">
                  1. Network Traffic
                </h4>
                {currentStep === 1 && (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-[#007AFF] bg-blue-100/70 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
                    <span>Ingesting</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-normal">
                Input network traffic (flows)
              </p>

              {/* Dynamic Simulation Detail Badge */}
              <div className="mt-2 text-[11px] font-mono text-gray-700 bg-white/90 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center justify-between">
                <span>{sample.protocol} {sample.sourceIp}:{sample.sourcePort} &rarr; {sample.destPort}</span>
                <span className="text-gray-400 font-sans">{sample.packets} pkts • {sample.bytes} B</span>
              </div>
            </div>
          </div>
        </div>

        {/* Connector 1 -> 2 */}
        <div className="flex flex-col items-center my-1.5">
          <div className={`w-0.5 h-5 ${currentStep > 1 ? "bg-[#007AFF]" : "bg-slate-300"}`} />
          <ArrowDown className={`h-4 w-4 -mt-1 ${currentStep >= 2 ? "text-[#007AFF]" : "text-slate-300"}`} />
        </div>

        {/* ============================================================= */}
        {/* NODE 2: FLOW PREPROCESSING                                    */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(2)}
          className={`w-full max-w-lg p-4 rounded-2xl cursor-pointer ${getNodeStyle(
            2,
            "border-amber-400",
            "bg-amber-50/40"
          )}`}
        >
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
              <Filter className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-950 font-heading">
                  2. Flow Preprocessing
                </h4>
                {currentStep === 2 && (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    <span>Normalizing</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-normal">
                Extract packets and basic flow features
              </p>

              <div className="mt-2 text-[11px] text-gray-700 bg-white/90 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center justify-between">
                <span>StandardScaler &amp; Categorical One-Hot</span>
                <span className="font-mono text-amber-700 font-semibold">&phi;(x) &isin; &reals;<sup>42</sup></span>
              </div>
            </div>
          </div>
        </div>

        {/* Connector 2 -> 3 */}
        <div className="flex flex-col items-center my-1.5">
          <div className={`w-0.5 h-5 ${currentStep > 2 ? "bg-purple-500" : "bg-slate-300"}`} />
          <ArrowDown className={`h-4 w-4 -mt-1 ${currentStep >= 3 ? "text-purple-500" : "text-slate-300"}`} />
        </div>

        {/* ============================================================= */}
        {/* NODE 3: MULTI-VIEW REPRESENTATION (THREE VIEWS)               */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(3)}
          className={`w-full max-w-xl p-4 sm:p-5 rounded-2xl cursor-pointer ${getNodeStyle(
            3,
            "border-purple-400",
            "bg-purple-50/30"
          )}`}
        >
          <div className="text-center mb-3">
            <div className="flex items-center justify-center space-x-2">
              <h4 className="text-base font-bold text-gray-950 font-heading">
                3. Multi-view Representation (Three Views)
              </h4>
              {currentStep === 3 && (
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full animate-pulse">
                  Branching
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Partitioning 42 features into 3 complementary domain spatial grids
            </p>
          </div>

          {/* Three Inner Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* IP View */}
            <div
              className={`p-3 rounded-xl border bg-white text-center transition-all ${
                currentStep >= 3
                  ? "border-blue-300 shadow-xs ring-1 ring-blue-500/10"
                  : "border-slate-200"
              }`}
            >
              <div className="flex justify-center mb-1.5 text-[#007AFF]">
                <Network className="h-6 w-6" />
              </div>
              <div className="text-xs font-bold text-gray-900 font-heading">
                IP View
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                (IP Header)
              </div>
              <div className="mt-2 text-[10px] font-mono text-[#007AFF] bg-blue-50 py-0.5 px-1.5 rounded">
                9 Features (11&times;11)
              </div>
            </div>

            {/* Transport View */}
            <div
              className={`p-3 rounded-xl border bg-white text-center transition-all ${
                currentStep >= 3
                  ? "border-emerald-300 shadow-xs ring-1 ring-emerald-500/10"
                  : "border-slate-200"
              }`}
            >
              <div className="flex justify-center mb-1.5 text-emerald-600">
                <AlignJustify className="h-6 w-6" />
              </div>
              <div className="text-xs font-bold text-gray-900 font-heading">
                Transport View
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                (Transport Header)
              </div>
              <div className="mt-2 text-[10px] font-mono text-emerald-700 bg-emerald-50 py-0.5 px-1.5 rounded">
                7 Features (11&times;11)
              </div>
            </div>

            {/* Payload View */}
            <div
              className={`p-3 rounded-xl border bg-white text-center transition-all ${
                currentStep >= 3
                  ? "border-rose-300 shadow-xs ring-1 ring-rose-500/10"
                  : "border-slate-200"
              }`}
            >
              <div className="flex justify-center mb-1.5 text-rose-500">
                <Binary className="h-6 w-6" />
              </div>
              <div className="text-xs font-bold text-gray-900 font-heading">
                Payload View
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                (Packet Payload)
              </div>
              <div className="mt-2 text-[10px] font-mono text-rose-700 bg-rose-50 py-0.5 px-1.5 rounded">
                6 Features (11&times;11)
              </div>
            </div>
          </div>
        </div>

        {/* Connector 3 -> 4 */}
        <div className="flex flex-col items-center my-1.5">
          <div className={`w-0.5 h-5 ${currentStep > 3 ? "bg-emerald-500" : "bg-slate-300"}`} />
          <ArrowDown className={`h-4 w-4 -mt-1 ${currentStep >= 4 ? "text-emerald-500" : "text-slate-300"}`} />
        </div>

        {/* ============================================================= */}
        {/* NODE 4: FEATURE EXTRACTION                                    */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(4)}
          className={`w-full max-w-lg p-4 rounded-2xl cursor-pointer ${getNodeStyle(
            4,
            "border-emerald-400",
            "bg-emerald-50/40"
          )}`}
        >
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <Cpu className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-950 font-heading">
                  4. Feature Extraction
                </h4>
                {currentStep === 4 && (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Extracting</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-normal">
                CNN + Transformer for each view (Global–Local Feature Extraction)
              </p>

              <div className="mt-2 text-[11px] text-gray-700 bg-white/90 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center justify-between font-mono">
                <span>Conv2d + BatchNorm + MaxPool &rarr; Linear(128)</span>
                <span className="text-emerald-700 font-bold">128-D per view</span>
              </div>
            </div>
          </div>
        </div>

        {/* Connector 4 -> 5 */}
        <div className="flex flex-col items-center my-1.5">
          <div className={`w-0.5 h-5 ${currentStep > 4 ? "bg-blue-500" : "bg-slate-300"}`} />
          <ArrowDown className={`h-4 w-4 -mt-1 ${currentStep >= 5 ? "text-blue-500" : "text-slate-300"}`} />
        </div>

        {/* ============================================================= */}
        {/* NODE 5: UNCERTAINTY ESTIMATION                                */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(5)}
          className={`w-full max-w-lg p-4 rounded-2xl cursor-pointer ${getNodeStyle(
            5,
            "border-blue-400",
            "bg-blue-50/40"
          )}`}
        >
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[#007AFF]">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-950 font-heading">
                  5. Uncertainty Estimation
                </h4>
                {currentStep === 5 && (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-[#007AFF] bg-blue-100/70 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
                    <span>Dirichlet</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-normal">
                Dirichlet Distribution (Estimate uncertainty for each view)
              </p>

              <div className="mt-2 text-[11px] text-gray-700 bg-white/90 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center justify-between font-mono">
                <span>&alpha;_k = e_k + 1 &bull; u = K / S</span>
                <span className="text-[#007AFF] font-bold">
                  u = {sample.dirichlet.uncertainty.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Connector 5 -> 6 */}
        <div className="flex flex-col items-center my-1.5">
          <div className={`w-0.5 h-5 ${currentStep > 5 ? "bg-amber-500" : "bg-slate-300"}`} />
          <ArrowDown className={`h-4 w-4 -mt-1 ${currentStep >= 6 ? "text-amber-500" : "text-slate-300"}`} />
        </div>

        {/* ============================================================= */}
        {/* NODE 6: EVIDENCE FUSION                                       */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(6)}
          className={`w-full max-w-lg p-4 rounded-2xl cursor-pointer ${getNodeStyle(
            6,
            "border-amber-400",
            "bg-amber-50/40"
          )}`}
        >
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-950 font-heading">
                  6. Evidence Fusion
                </h4>
                {currentStep === 6 && (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    <span>D-S Theory</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-normal">
                Dempster–Shafer Theory (Fuse evidence from three views)
              </p>

              <div className="mt-2 text-[11px] text-gray-700 bg-white/90 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center justify-between font-mono">
                <span>Conflict C: {sample.fusion.conflict.toFixed(4)}</span>
                <span className={`font-bold ${fusedU >= threshold ? "text-rose-600" : "text-emerald-600"}`}>
                  Fused u = {fusedU.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Connector 6 -> 7 */}
        <div className="flex flex-col items-center my-1.5">
          <div className={`w-0.5 h-5 ${currentStep > 6 ? "bg-rose-400" : "bg-slate-300"}`} />
          <ArrowDown className={`h-4 w-4 -mt-1 ${currentStep >= 7 ? "text-rose-500" : "text-slate-300"}`} />
        </div>

        {/* ============================================================= */}
        {/* NODE 7: KNOWN / UNKNOWN DECISION (DIAMOND SHAPE CARD)         */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(7)}
          className={`w-full max-w-lg p-5 rounded-3xl cursor-pointer text-center relative ${
            currentStep === 7
              ? "border-2 border-rose-400 bg-rose-50/60 shadow-md ring-4 ring-rose-500/10 scale-[1.01]"
              : currentStep > 7
              ? "border border-rose-300 bg-rose-50/30 shadow-2xs"
              : "border border-slate-200 bg-white/70 opacity-60 hover:opacity-90"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <h4 className="text-base font-bold text-gray-950 font-heading">
              7. Known / Unknown Decision
            </h4>
            {currentStep === 7 && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                Evaluating Cutoff
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            (Based on Uncertainty Threshold &tau; = {threshold})
          </p>

          <div className="mt-2.5 inline-flex items-center space-x-2 font-mono text-xs px-3 py-1 rounded-full bg-white border border-rose-200 text-gray-900 shadow-2xs">
            <span>Fused u ({fusedU.toFixed(4)})</span>
            <span className="font-bold text-rose-600">{isRejected ? "&ge;" : "<"}</span>
            <span className="font-bold text-[#007AFF]">&tau; ({threshold})</span>
          </div>
        </div>

        {/* ============================================================= */}
        {/* BRANCHING CONNECTORS (KNOWN LEFT, UNKNOWN RIGHT)              */}
        {/* ============================================================= */}
        <div className="w-full max-w-lg grid grid-cols-2 mt-2 mb-2 relative">
          {/* Left Branch: Known */}
          <div className="flex flex-col items-center">
            <span className={`text-xs font-bold font-heading mb-1 ${!isRejected && currentStep >= 7 ? "text-emerald-600" : "text-slate-400"}`}>
              Known (u &lt; &tau;)
            </span>
            <div className={`w-0.5 h-6 ${!isRejected && currentStep >= 8 ? "bg-emerald-500" : "bg-slate-300"}`} />
            <ArrowDown className={`h-4 w-4 -mt-1 ${!isRejected && currentStep >= 8 ? "text-emerald-500" : "text-slate-300"}`} />
          </div>

          {/* Right Branch: Unknown */}
          <div className="flex flex-col items-center">
            <span className={`text-xs font-bold font-heading mb-1 ${isRejected && currentStep >= 7 ? "text-rose-600" : "text-slate-400"}`}>
              Unknown (u &ge; &tau;)
            </span>
            <div className={`w-0.5 h-6 ${isRejected && currentStep >= 8 ? "bg-rose-500" : "bg-slate-300"}`} />
            <ArrowDown className={`h-4 w-4 -mt-1 ${isRejected && currentStep >= 8 ? "text-rose-500" : "text-slate-300"}`} />
          </div>
        </div>

        {/* ============================================================= */}
        {/* NODE 8: OUTCOME CARDS (8A vs 8B)                              */}
        {/* ============================================================= */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* 8A. Traffic Classification */}
          <div
            onClick={() => onSelectStep(8)}
            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
              !isRejected && currentStep === 8
                ? "border-2 border-emerald-500 bg-emerald-50/70 shadow-md ring-4 ring-emerald-500/10 scale-[1.01]"
                : !isRejected && currentStep > 8
                ? "border-emerald-300 bg-emerald-50/30"
                : "border-slate-200 bg-white/60 opacity-40 hover:opacity-75"
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-gray-950 font-heading">
                  8A. Traffic Classification
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Classify into one of the known classes
                </p>

                {!isRejected && currentStep === 8 && (
                  <div className="mt-2.5 p-2 rounded-lg bg-white border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span>Label: {sample.category}</span>
                      <span className="text-emerald-700">
                        {(Math.max(...Object.values(sample.fusion.fusedBelief)) * 100).toFixed(1)}% Conf
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-800 font-semibold">
                      Status: ALLOW / CLASSIFIED
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 8B. Reject as Unknown */}
          <div
            onClick={() => onSelectStep(8)}
            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
              isRejected && currentStep === 8
                ? "border-2 border-rose-500 bg-rose-50/70 shadow-md ring-4 ring-rose-500/10 scale-[1.01]"
                : isRejected && currentStep > 8
                ? "border-rose-300 bg-rose-50/30"
                : "border-slate-200 bg-white/60 opacity-40 hover:opacity-75"
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <XCircle className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-gray-950 font-heading">
                  8B. Reject as Unknown
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Quarantine &amp; Novel Class Discovery (Unknown traffic)
                </p>

                {isRejected && currentStep === 8 && (
                  <div className="mt-2.5 p-2 rounded-lg bg-white border border-rose-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-rose-700">
                      <span>Verdict: ZERO-DAY</span>
                      <span className="font-mono">u = {fusedU.toFixed(4)}</span>
                    </div>
                    <div className="text-[11px] text-rose-800 font-semibold">
                      Action: BLOCK &rarr; Incident &rarr; Cluster
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
