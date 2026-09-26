/**
 * frontend/components/observability/PipelineDiagram.tsx
 * Ultra-Smooth Production-Grade Interactive Workflow Diagram.
 * Accurately models the reference RoNeTC architecture with glowing packet streams,
 * smooth multi-view branching and convergence, dynamic decision gate routing,
 * and Apple/Linear-inspired micro-animations.
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
  Check,
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

// Reusable vertical flow connector with animated traveling packet particle
function FlowConnector({
  fromStep,
  toStep,
  currentStep,
  color = "#007AFF",
}: {
  fromStep: number;
  toStep: number;
  currentStep: number;
  color?: string;
}) {
  const isCompleted = currentStep >= toStep;
  const isCurrentlyFlowing = currentStep === fromStep || currentStep === toStep;

  return (
    <div className="relative flex flex-col items-center my-1.5 h-8 w-6 select-none pointer-events-none">
      {/* Background track line */}
      <div className={`w-[2px] h-full rounded-full transition-colors duration-500 ${
        isCompleted || isCurrentlyFlowing ? "bg-slate-300" : "bg-slate-200/80"
      }`} />

      {/* Active colored fill line */}
      <div
        className="absolute top-0 w-[2px] rounded-full transition-all duration-700 ease-out"
        style={{
          height: isCompleted ? "100%" : isCurrentlyFlowing ? "65%" : "0%",
          backgroundColor: color,
        }}
      />

      {/* Smooth glowing data packet particle moving down the track */}
      {isCurrentlyFlowing && (
        <div
          className="anim-packet-down"
          style={{ backgroundColor: color, boxShadow: `0 0 10px 3px ${color}B3` }}
        />
      )}

      {/* Arrowhead */}
      <ArrowDown
        className="h-3.5 w-3.5 -mt-1.5 transition-colors duration-500 z-10"
        style={{ color: isCompleted || isCurrentlyFlowing ? color : "#94A3B8" }}
      />
    </div>
  );
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

  // Helper for card appearance & glow
  const getCardClasses = (stepNum: number, baseBorder: string, glowClass: string) => {
    const isCompleted = currentStep > stepNum;
    const isActive = currentStep === stepNum;

    if (isActive) {
      return `border-2 ${baseBorder} bg-white shadow-lg ${glowClass} -translate-y-0.5 scale-[1.01] transition-all duration-500 ease-out cursor-pointer`;
    }
    if (isCompleted) {
      return `border ${baseBorder} bg-white/95 shadow-xs opacity-95 hover:opacity-100 hover:shadow-sm transition-all duration-300 cursor-pointer`;
    }
    return `border border-slate-200/90 bg-white/70 opacity-60 hover:opacity-90 hover:border-slate-300 transition-all duration-300 cursor-pointer`;
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
          <span className="text-xs text-gray-400 hidden sm:inline">(Click any stage to inspect)</span>
        </div>
      </div>

      {/* Main Flowchart Container */}
      <div className="max-w-2xl mx-auto flex flex-col items-center select-none pt-2">
        {/* ============================================================= */}
        {/* NODE 1: NETWORK TRAFFIC                                       */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(1)}
          className={`w-full max-w-lg p-4 rounded-2xl ${getCardClasses(
            1,
            "border-blue-400",
            "anim-active-glow-blue"
          )}`}
        >
          <div className="flex items-center space-x-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-500 ${
              currentStep === 1
                ? "bg-blue-100/80 border border-blue-300 text-[#007AFF] scale-105 shadow-xs"
                : "bg-blue-50 border border-blue-200 text-[#007AFF]"
            }`}>
              <Cloud className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-950 font-heading">
                  1. Network Traffic
                </h4>
                {currentStep === 1 ? (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-[#007AFF] bg-blue-100/70 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
                    <span>Ingesting</span>
                  </span>
                ) : currentStep > 1 ? (
                  <span className="flex items-center space-x-1 text-[11px] font-medium text-emerald-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                    <span>Ingested</span>
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 font-normal">
                Input network traffic (flows)
              </p>

              {/* Dynamic Simulation Detail Badge */}
              <div className="mt-2 text-[11px] font-mono text-gray-700 bg-slate-50/90 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center justify-between transition-all">
                <span>{sample.protocol} {sample.sourceIp}:{sample.sourcePort} &rarr; {sample.destPort}</span>
                <span className="text-gray-400 font-sans">{sample.packets} pkts • {sample.bytes.toLocaleString()} B</span>
              </div>
            </div>
          </div>
        </div>

        {/* Connector 1 -> 2 with animated packet */}
        <FlowConnector fromStep={1} toStep={2} currentStep={currentStep} color="#007AFF" />

        {/* ============================================================= */}
        {/* NODE 2: FLOW PREPROCESSING                                    */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(2)}
          className={`w-full max-w-lg p-4 rounded-2xl ${getCardClasses(
            2,
            "border-amber-400",
            "anim-active-glow-blue"
          )}`}
        >
          <div className="flex items-center space-x-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-500 ${
              currentStep === 2
                ? "bg-amber-100/80 border border-amber-300 text-amber-700 scale-105 shadow-xs"
                : "bg-amber-50 border border-amber-200 text-amber-600"
            }`}>
              <Filter className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-950 font-heading">
                  2. Flow Preprocessing
                </h4>
                {currentStep === 2 ? (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    <span>Normalizing</span>
                  </span>
                ) : currentStep > 2 ? (
                  <span className="flex items-center space-x-1 text-[11px] font-medium text-emerald-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                    <span>Normalized</span>
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 font-normal">
                Extract packets and basic flow features
              </p>

              <div className="mt-2 text-[11px] text-gray-700 bg-slate-50/90 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center justify-between transition-all">
                <span>StandardScaler &amp; Categorical One-Hot</span>
                <span className="font-mono text-amber-700 font-semibold">&phi;(x) &isin; &reals;<sup>42</sup></span>
              </div>
            </div>
          </div>
        </div>

        {/* Connector 2 -> 3 with animated packet */}
        <FlowConnector fromStep={2} toStep={3} currentStep={currentStep} color="#8B5CF6" />

        {/* ============================================================= */}
        {/* NODE 3: MULTI-VIEW REPRESENTATION (THREE VIEWS)               */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(3)}
          className={`w-full max-w-xl p-4 sm:p-5 rounded-2xl ${getCardClasses(
            3,
            "border-purple-400",
            "anim-active-glow-blue"
          )}`}
        >
          <div className="text-center mb-3">
            <div className="flex items-center justify-center space-x-2">
              <h4 className="text-base font-bold text-gray-950 font-heading">
                3. Multi-view Representation (Three Views)
              </h4>
              {currentStep === 3 && (
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full animate-pulse">
                  Branching into 3 Domains
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Partitioning 42 features into 3 complementary domain spatial grids
            </p>
          </div>

          {/* Three Inner Boxes with Active Pulse when Step 3 is Active */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* IP View */}
            <div
              className={`p-3 rounded-xl border bg-white text-center transition-all duration-300 ${
                currentStep === 3
                  ? "border-blue-400 shadow-sm ring-2 ring-blue-500/20 scale-[1.02] bg-blue-50/20"
                  : currentStep > 3
                  ? "border-blue-200 shadow-2xs"
                  : "border-slate-200 opacity-70"
              }`}
            >
              <div className="flex justify-center mb-1.5 text-[#007AFF]">
                <Network className={`h-6 w-6 transition-transform ${currentStep === 3 ? "scale-110" : ""}`} />
              </div>
              <div className="text-xs font-bold text-gray-900 font-heading">
                IP View
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                (IP Header)
              </div>
              <div className="mt-2 text-[10px] font-mono text-[#007AFF] bg-blue-50 py-0.5 px-1.5 rounded font-semibold">
                9 Features (11&times;11)
              </div>
            </div>

            {/* Transport View */}
            <div
              className={`p-3 rounded-xl border bg-white text-center transition-all duration-300 ${
                currentStep === 3
                  ? "border-emerald-400 shadow-sm ring-2 ring-emerald-500/20 scale-[1.02] bg-emerald-50/20"
                  : currentStep > 3
                  ? "border-emerald-200 shadow-2xs"
                  : "border-slate-200 opacity-70"
              }`}
            >
              <div className="flex justify-center mb-1.5 text-emerald-600">
                <AlignJustify className={`h-6 w-6 transition-transform ${currentStep === 3 ? "scale-110" : ""}`} />
              </div>
              <div className="text-xs font-bold text-gray-900 font-heading">
                Transport View
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                (Transport Header)
              </div>
              <div className="mt-2 text-[10px] font-mono text-emerald-700 bg-emerald-50 py-0.5 px-1.5 rounded font-semibold">
                7 Features (11&times;11)
              </div>
            </div>

            {/* Payload View */}
            <div
              className={`p-3 rounded-xl border bg-white text-center transition-all duration-300 ${
                currentStep === 3
                  ? "border-rose-400 shadow-sm ring-2 ring-rose-500/20 scale-[1.02] bg-rose-50/20"
                  : currentStep > 3
                  ? "border-rose-200 shadow-2xs"
                  : "border-slate-200 opacity-70"
              }`}
            >
              <div className="flex justify-center mb-1.5 text-rose-500">
                <Binary className={`h-6 w-6 transition-transform ${currentStep === 3 ? "scale-110" : ""}`} />
              </div>
              <div className="text-xs font-bold text-gray-900 font-heading">
                Payload View
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                (Packet Payload)
              </div>
              <div className="mt-2 text-[10px] font-mono text-rose-700 bg-rose-50 py-0.5 px-1.5 rounded font-semibold">
                6 Features (11&times;11)
              </div>
            </div>
          </div>
        </div>

        {/* Connector 3 -> 4 with animated packet */}
        <FlowConnector fromStep={3} toStep={4} currentStep={currentStep} color="#10B981" />

        {/* ============================================================= */}
        {/* NODE 4: FEATURE EXTRACTION                                    */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(4)}
          className={`w-full max-w-lg p-4 rounded-2xl ${getCardClasses(
            4,
            "border-emerald-400",
            "anim-active-glow-blue"
          )}`}
        >
          <div className="flex items-center space-x-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-500 ${
              currentStep === 4
                ? "bg-emerald-100/80 border border-emerald-300 text-emerald-700 scale-105 shadow-xs"
                : "bg-emerald-50 border border-emerald-200 text-emerald-600"
            }`}>
              <Cpu className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-950 font-heading">
                  4. Feature Extraction
                </h4>
                {currentStep === 4 ? (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Extracting</span>
                  </span>
                ) : currentStep > 4 ? (
                  <span className="flex items-center space-x-1 text-[11px] font-medium text-emerald-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                    <span>Extracted</span>
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 font-normal">
                CNN + Transformer for each view (Global–Local Feature Extraction)
              </p>

              <div className="mt-2 text-[11px] text-gray-700 bg-slate-50/90 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center justify-between font-mono">
                <span>Conv2d + BatchNorm + MaxPool &rarr; Linear(128)</span>
                <span className="text-emerald-700 font-bold">128-D per view</span>
              </div>
            </div>
          </div>
        </div>

        {/* Connector 4 -> 5 with animated packet */}
        <FlowConnector fromStep={4} toStep={5} currentStep={currentStep} color="#007AFF" />

        {/* ============================================================= */}
        {/* NODE 5: UNCERTAINTY ESTIMATION                                */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(5)}
          className={`w-full max-w-lg p-4 rounded-2xl ${getCardClasses(
            5,
            "border-blue-400",
            "anim-active-glow-blue"
          )}`}
        >
          <div className="flex items-center space-x-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-500 ${
              currentStep === 5
                ? "bg-blue-100/80 border border-blue-300 text-[#007AFF] scale-105 shadow-xs"
                : "bg-blue-50 border border-blue-200 text-[#007AFF]"
            }`}>
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-950 font-heading">
                  5. Uncertainty Estimation
                </h4>
                {currentStep === 5 ? (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-[#007AFF] bg-blue-100/70 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
                    <span>Dirichlet</span>
                  </span>
                ) : currentStep > 5 ? (
                  <span className="flex items-center space-x-1 text-[11px] font-medium text-emerald-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                    <span>Estimated</span>
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 font-normal">
                Dirichlet Distribution (Estimate uncertainty for each view)
              </p>

              <div className="mt-2 text-[11px] text-gray-700 bg-slate-50/90 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center justify-between font-mono">
                <span>&alpha;_k = e_k + 1 &bull; u = K / S</span>
                <span className="text-[#007AFF] font-bold">
                  u = {sample.dirichlet.uncertainty.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Connector 5 -> 6 with animated packet */}
        <FlowConnector fromStep={5} toStep={6} currentStep={currentStep} color="#D97706" />

        {/* ============================================================= */}
        {/* NODE 6: EVIDENCE FUSION                                       */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(6)}
          className={`w-full max-w-lg p-4 rounded-2xl ${getCardClasses(
            6,
            "border-amber-400",
            "anim-active-glow-blue"
          )}`}
        >
          <div className="flex items-center space-x-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-500 ${
              currentStep === 6
                ? "bg-amber-100/80 border border-amber-300 text-amber-700 scale-105 shadow-xs"
                : "bg-amber-50 border border-amber-200 text-amber-600"
            }`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-950 font-heading">
                  6. Evidence Fusion
                </h4>
                {currentStep === 6 ? (
                  <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    <span>D-S Theory</span>
                  </span>
                ) : currentStep > 6 ? (
                  <span className="flex items-center space-x-1 text-[11px] font-medium text-emerald-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                    <span>Fused</span>
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 font-normal">
                Dempster–Shafer Theory (Fuse evidence from three views)
              </p>

              <div className="mt-2 text-[11px] text-gray-700 bg-slate-50/90 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center justify-between font-mono">
                <span>Conflict C: {sample.fusion.conflict.toFixed(4)}</span>
                <span className={`font-bold ${fusedU >= threshold ? "text-rose-600" : "text-emerald-600"}`}>
                  Fused u = {fusedU.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Connector 6 -> 7 with animated packet */}
        <FlowConnector fromStep={6} toStep={7} currentStep={currentStep} color="#F43F5E" />

        {/* ============================================================= */}
        {/* NODE 7: KNOWN / UNKNOWN DECISION (DIAMOND SHAPE CARD)         */}
        {/* ============================================================= */}
        <div
          onClick={() => onSelectStep(7)}
          className={`w-full max-w-lg p-5 rounded-3xl text-center relative transition-all duration-500 ${
            currentStep === 7
              ? "border-2 border-rose-400 bg-rose-50/70 shadow-lg anim-active-glow-rose -translate-y-0.5 scale-[1.01] cursor-pointer"
              : currentStep > 7
              ? "border border-rose-300 bg-rose-50/30 shadow-2xs opacity-95 cursor-pointer"
              : "border border-slate-200 bg-white/70 opacity-60 hover:opacity-90 cursor-pointer"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <h4 className="text-base font-bold text-gray-950 font-heading">
              7. Known / Unknown Decision
            </h4>
            {currentStep === 7 && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full animate-pulse">
                Auditing Decision Cutoff
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            (Based on Uncertainty Threshold &tau; = {threshold})
          </p>

          <div className="mt-3 inline-flex items-center space-x-2 font-mono text-xs px-3.5 py-1.5 rounded-full bg-white border border-rose-200 text-gray-900 shadow-2xs">
            <span>Fused u ({fusedU.toFixed(4)})</span>
            <span className="font-extrabold text-rose-600">{isRejected ? "&ge;" : "<"}</span>
            <span className="font-extrabold text-[#007AFF]">&tau; ({threshold})</span>
          </div>
        </div>

        {/* ============================================================= */}
        {/* BRANCHING CONNECTORS (KNOWN LEFT, UNKNOWN RIGHT)              */}
        {/* ============================================================= */}
        <div className="w-full max-w-lg grid grid-cols-2 mt-2 mb-2 relative select-none">
          {/* Left Branch: Known */}
          <div className="relative flex flex-col items-center">
            <span className={`text-xs font-bold font-heading mb-1 transition-colors ${
              !isRejected && currentStep >= 7 ? "text-emerald-700" : "text-slate-400"
            }`}>
              Known (u &lt; &tau;)
            </span>

            <div className="relative h-8 w-6 flex flex-col items-center">
              <div className={`w-[2px] h-full rounded-full transition-colors duration-500 ${
                !isRejected && currentStep >= 8 ? "bg-emerald-500" : "bg-slate-200"
              }`} />

              {/* Glowing Green Packet Particle Flowing Left into 8A */}
              {!isRejected && currentStep >= 7 && (
                <div className="anim-packet-down" style={{ backgroundColor: "#10B981", boxShadow: "0 0 10px 3px rgba(16,185,129,0.7)" }} />
              )}

              <ArrowDown className={`h-3.5 w-3.5 -mt-1.5 transition-colors ${
                !isRejected && currentStep >= 8 ? "text-emerald-600" : "text-slate-300"
              }`} />
            </div>
          </div>

          {/* Right Branch: Unknown */}
          <div className="relative flex flex-col items-center">
            <span className={`text-xs font-bold font-heading mb-1 transition-colors ${
              isRejected && currentStep >= 7 ? "text-rose-700" : "text-slate-400"
            }`}>
              Unknown (u &ge; &tau;)
            </span>

            <div className="relative h-8 w-6 flex flex-col items-center">
              <div className={`w-[2px] h-full rounded-full transition-colors duration-500 ${
                isRejected && currentStep >= 8 ? "bg-rose-500" : "bg-slate-200"
              }`} />

              {/* Glowing Red Packet Particle Flowing Right into 8B */}
              {isRejected && currentStep >= 7 && (
                <div className="anim-packet-down" style={{ backgroundColor: "#F43F5E", boxShadow: "0 0 10px 3px rgba(244,63,94,0.7)" }} />
              )}

              <ArrowDown className={`h-3.5 w-3.5 -mt-1.5 transition-colors ${
                isRejected && currentStep >= 8 ? "text-rose-600" : "text-slate-300"
              }`} />
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* NODE 8: OUTCOME CARDS (8A vs 8B)                              */}
        {/* ============================================================= */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* 8A. Traffic Classification */}
          <div
            onClick={() => onSelectStep(8)}
            className={`p-4 rounded-2xl border text-left transition-all duration-500 ${
              !isRejected && currentStep === 8
                ? "border-2 border-emerald-500 bg-emerald-50/80 shadow-lg anim-active-glow-green -translate-y-0.5 scale-[1.01] cursor-pointer"
                : !isRejected && currentStep > 8
                ? "border-emerald-300 bg-emerald-50/30 cursor-pointer"
                : "border-slate-200 bg-white/60 opacity-40 hover:opacity-70 cursor-pointer"
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                !isRejected && currentStep === 8
                  ? "bg-emerald-200/90 text-emerald-800 scale-110 shadow-xs"
                  : "bg-emerald-100 text-emerald-700"
              }`}>
                <CheckCircle2 className="h-7 w-7 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-950 font-heading">
                    8A. Traffic Classification
                  </h4>
                  {!isRejected && currentStep === 8 && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
                      ALLOWED
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Classify into one of the known classes
                </p>

                {!isRejected && currentStep === 8 && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-white/95 border border-emerald-200 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span>Label: {sample.category}</span>
                      <span className="text-emerald-700 font-mono">
                        {(Math.max(...Object.values(sample.fusion.fusedBelief)) * 100).toFixed(1)}% Conf
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-800 font-semibold flex items-center justify-between">
                      <span>Status: ALLOW / CLASSIFIED</span>
                      <span className="font-mono text-[10px]">u = {fusedU.toFixed(4)} &lt; {threshold}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 8B. Reject as Unknown */}
          <div
            onClick={() => onSelectStep(8)}
            className={`p-4 rounded-2xl border text-left transition-all duration-500 ${
              isRejected && currentStep === 8
                ? "border-2 border-rose-500 bg-rose-50/80 shadow-lg anim-active-glow-rose -translate-y-0.5 scale-[1.01] cursor-pointer"
                : isRejected && currentStep > 8
                ? "border-rose-300 bg-rose-50/30 cursor-pointer"
                : "border-slate-200 bg-white/60 opacity-40 hover:opacity-70 cursor-pointer"
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                isRejected && currentStep === 8
                  ? "bg-rose-200/90 text-rose-800 scale-110 shadow-xs"
                  : "bg-rose-100 text-rose-700"
              }`}>
                <XCircle className="h-7 w-7 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-950 font-heading">
                    8B. Reject as Unknown
                  </h4>
                  {isRejected && currentStep === 8 && (
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                      REJECTED
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Quarantine &amp; Novel Class Discovery (Unknown traffic)
                </p>

                {isRejected && currentStep === 8 && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-white/95 border border-rose-200 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between font-bold text-rose-700">
                      <span>Verdict: ZERO-DAY</span>
                      <span className="font-mono text-[10px]">u = {fusedU.toFixed(4)} &ge; {threshold}</span>
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
