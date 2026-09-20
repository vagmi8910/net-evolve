/**
 * frontend/components/DemoAttackLab.tsx
 * Interactive Demo Attack Laboratory.
 * Allows operators and evaluators to select authentic UNSW-NB15 seeds across
 * all 10 known and withheld zero-day categories and execute real RoNeTC+ inference.
 */
"use client";

import React, { useState } from "react";
import {
  Crosshair,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { api } from "@/lib/api";
import { TrafficEvent } from "@/types/soc";

interface DemoAttackLabProps {
  onEventCreated: (event: TrafficEvent) => void;
  onNavigateToIncidents: () => void;
  onNavigateToDiscovery: () => void;
}

interface AttackCardConfig {
  category: string;
  isZeroDay: boolean;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  sampleSeedId: string;
  protocol: string;
  seedCount: number;
}

const ATTACK_CARDS: AttackCardConfig[] = [
  // Known Closed-Set
  {
    category: "Normal",
    isZeroDay: false,
    risk: "LOW",
    description: "Benign enterprise user traffic (HTTPS web browsing, DNS queries, SSH sessions).",
    sampleSeedId: "normal-001",
    protocol: "TCP / HTTPS / DNS",
    seedCount: 20,
  },
  {
    category: "DoS",
    isZeroDay: false,
    risk: "HIGH",
    description: "Denial of Service resource exhaustion attack flooding destination sockets.",
    sampleSeedId: "dos-001",
    protocol: "TCP / UDP Floods",
    seedCount: 20,
  },
  {
    category: "Exploits",
    isZeroDay: false,
    risk: "HIGH",
    description: "Targeted vulnerability exploit payload targeting unpatched application services.",
    sampleSeedId: "exploits-001",
    protocol: "TCP / HTTP",
    seedCount: 20,
  },
  {
    category: "Fuzzers",
    isZeroDay: false,
    risk: "MEDIUM",
    description: "Automated protocol fuzzing injecting random malformed inputs to trigger crashes.",
    sampleSeedId: "fuzzers-001",
    protocol: "TCP / UDP Fuzzing",
    seedCount: 20,
  },
  {
    category: "Generic",
    isZeroDay: false,
    risk: "HIGH",
    description: "Generic collision and cryptographic protocol exploitation sequences.",
    sampleSeedId: "generic-001",
    protocol: "TCP / Custom",
    seedCount: 20,
  },
  // Novel Withheld Zero-Days
  {
    category: "Analysis",
    isZeroDay: true,
    risk: "HIGH",
    description: "Web application vulnerability scanning, parameter fuzzing, and directory traversal.",
    sampleSeedId: "analysis-001",
    protocol: "HTTP / HTTPS (Port 8080)",
    seedCount: 10,
  },
  {
    category: "Backdoor",
    isZeroDay: true,
    risk: "CRITICAL",
    description: "Stealthy command-and-control (C2) heartbeat beacons and remote shell access.",
    sampleSeedId: "backdoor-001",
    protocol: "TCP Encrypted (Port 4444)",
    seedCount: 10,
  },
  {
    category: "Reconnaissance",
    isZeroDay: true,
    risk: "MEDIUM",
    description: "Horizontal port scanning, network host sweeps, and OS service probing.",
    sampleSeedId: "reconnaissance-001",
    protocol: "TCP / ICMP Sweeps",
    seedCount: 10,
  },
  {
    category: "Shellcode",
    isZeroDay: true,
    risk: "CRITICAL",
    description: "In-memory executable exploit payload injection designed to hijack system flow.",
    sampleSeedId: "shellcode-001",
    protocol: "TCP / SMB (Port 139/445)",
    seedCount: 10,
  },
  {
    category: "Worms",
    isZeroDay: true,
    risk: "CRITICAL",
    description: "Rapid self-replicating propagation bursts attempting automated network infection.",
    sampleSeedId: "worms-001",
    protocol: "TCP (Ports 445 / 139)",
    seedCount: 10,
  },
];

export function DemoAttackLab({
  onEventCreated,
  onNavigateToIncidents,
  onNavigateToDiscovery,
}: DemoAttackLabProps) {
  const [loadingSeedId, setLoadingSeedId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TrafficEvent | null>(null);

  const handleSendTestFlow = async (card: AttackCardConfig) => {
    setLoadingSeedId(card.sampleSeedId);
    setLastResult(null);

    // Radar progression animation
    try {
      setActiveStep("Sending flow to Security Gateway...");
      await new Promise((r) => setTimeout(r, 200));

      setActiveStep("Extracting multi-view spatial representations (IP, Transport, Payload)...");
      await new Promise((r) => setTimeout(r, 250));

      setActiveStep("Executing RoNeTC+ evidential deep forward pass & Dirichlet vacuity calculation...");
      await new Promise((r) => setTimeout(r, 300));

      setActiveStep("Performing Dempster-Shafer multi-view evidence fusion...");
      const event = await api.runSeedAttack(card.sampleSeedId);

      setActiveStep("Evaluating Youden open-set threshold (τ = 0.1844)...");
      await new Promise((r) => setTimeout(r, 150));

      setLastResult(event);
      onEventCreated(event);
    } catch (err) {
      console.error("Seed attack run failed:", err);
    } finally {
      setLoadingSeedId(null);
      setActiveStep(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-5 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Crosshair className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Demo Attack Laboratory
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Deterministic adversary testing suite using authentic UNSW-NB15 flow vectors.
              Sends raw traffic through the real RoNeTC+ PyTorch model.
            </p>
          </div>
        </div>
      </div>

      {/* Live Pipeline Execution Status Banner */}
      {loadingSeedId && (
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-4 font-mono text-xs text-cyan-300 flex items-center space-x-3 shadow-lg">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          <div className="flex-1">
            <span className="font-bold text-white block">INFERENCE PIPELINE ACTIVE:</span>
            <span className="text-cyan-400">{activeStep}</span>
          </div>
        </div>
      )}

      {/* Result Callout Card */}
      {lastResult && (
        <div
          className={`rounded-xl border p-5 shadow-lg transition-all ${
            lastResult.open_set.is_unknown
              ? "border-rose-500/60 bg-rose-950/25 text-rose-200"
              : "border-emerald-500/60 bg-emerald-950/25 text-emerald-200"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  lastResult.open_set.is_unknown
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                }`}
              >
                {lastResult.open_set.is_unknown ? (
                  <AlertOctagon className="h-6 w-6" />
                ) : (
                  <CheckCircle2 className="h-6 w-6" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-sm font-bold text-white">
                    {lastResult.open_set.is_unknown
                      ? "🚨 UNKNOWN / ZERO-DAY TRAFFIC DETECTED"
                      : "✅ KNOWN IN-DISTRIBUTION FLOW VERIFIED"}
                  </span>
                  <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-bold border border-white/10">
                    {lastResult.event_id}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  Ground Truth: <strong>{lastResult.ground_truth}</strong> | Decision:{" "}
                  <strong>{lastResult.decision.status}</strong> ({lastResult.decision.reason})
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center space-x-6 font-mono text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">UNCERTAINTY (u)</span>
                <span
                  className={`text-base font-bold ${
                    lastResult.open_set.uncertainty >= lastResult.open_set.threshold
                      ? "text-rose-400"
                      : "text-emerald-400"
                  }`}
                >
                  {lastResult.open_set.uncertainty.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">THRESHOLD (τ)</span>
                <span className="text-base font-bold text-slate-300">
                  {lastResult.open_set.threshold.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">CONFIDENCE</span>
                <span className="text-base font-bold text-cyan-300">
                  {(lastResult.prediction.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {lastResult.open_set.is_unknown ? (
                <>
                  <button
                    onClick={onNavigateToIncidents}
                    className="rounded-lg bg-rose-600/30 border border-rose-500/50 hover:bg-rose-600/40 px-3 py-1.5 text-xs font-mono font-bold text-rose-200 transition flex items-center space-x-1"
                  >
                    <span>Inspect Incident</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={onNavigateToDiscovery}
                    className="rounded-lg bg-cyan-600/30 border border-cyan-500/50 hover:bg-cyan-600/40 px-3 py-1.5 text-xs font-mono font-bold text-cyan-200 transition flex items-center space-x-1"
                  >
                    <span>Discovery Pool</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <span className="text-xs font-mono text-emerald-400 px-3 py-1.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                  Logged to Live Traffic
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid of Attack Seed Cards */}
      <div className="space-y-6">
        {/* Section 1: Known Closed-Set Traffic */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
              1. Closed-Set Known Classes (Base Trained Vocabulary)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {ATTACK_CARDS.filter((c) => !c.isZeroDay).map((card) => (
              <div
                key={card.category}
                className="rounded-xl border border-slate-800 bg-[#0A0F1D] p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-white">{card.category}</span>
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-emerald-400 border border-emerald-500/20">
                      KNOWN
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed min-h-[44px]">
                    {card.description}
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500">
                    Proto: <span className="text-slate-400">{card.protocol}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Seeds Available: <span className="text-cyan-400">{card.seedCount}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSendTestFlow(card)}
                  disabled={loadingSeedId !== null}
                  className="mt-4 w-full flex items-center justify-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 py-2 text-xs font-mono font-medium text-slate-200 transition disabled:opacity-50"
                >
                  <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
                  <span>SEND TEST FLOW</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Withheld Zero-Day Attacks */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <AlertOctagon className="h-4 w-4 text-rose-400" />
            <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
              2. Withheld Novel Zero-Day Threats (Open-Set Evaluation)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {ATTACK_CARDS.filter((c) => c.isZeroDay).map((card) => (
              <div
                key={card.category}
                className="rounded-xl border border-rose-900/30 bg-[#0F0B18] p-4 flex flex-col justify-between hover:border-rose-800/60 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-rose-300">{card.category}</span>
                    <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-rose-400 border border-rose-500/40">
                      ZERO-DAY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed min-h-[44px]">
                    {card.description}
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500">
                    Proto: <span className="text-slate-400">{card.protocol}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Seeds Available: <span className="text-rose-400">{card.seedCount}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSendTestFlow(card)}
                  disabled={loadingSeedId !== null}
                  className="mt-4 w-full flex items-center justify-center space-x-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/50 py-2 text-xs font-mono font-bold text-rose-300 transition shadow-sm shadow-rose-950 disabled:opacity-50"
                >
                  <Crosshair className="h-3.5 w-3.5 text-rose-400" />
                  <span>TEST ZERO-DAY</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
