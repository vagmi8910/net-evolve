/**
 * frontend/components/views/DemoAttackLabView.tsx
 * Apple-style Demo Attack Laboratory.
 * Allows operators to select authentic UNSW-NB15 flow vectors across
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
  Zap,
  Flame,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { TrafficEvent } from "@/types/soc";

interface DemoAttackLabViewProps {
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
}

const ATTACK_CARDS: AttackCardConfig[] = [
  // Known Closed-Set Classes
  {
    category: "Normal",
    isZeroDay: false,
    risk: "LOW",
    description: "Benign user web browsing, DNS lookup queries, and SSH management traffic.",
    sampleSeedId: "normal-001",
    protocol: "TCP / HTTPS / DNS",
  },
  {
    category: "DoS",
    isZeroDay: false,
    risk: "HIGH",
    description: "Denial of Service resource exhaustion flooding destination host sockets.",
    sampleSeedId: "dos-001",
    protocol: "TCP / UDP Floods",
  },
  {
    category: "Exploits",
    isZeroDay: false,
    risk: "HIGH",
    description: "Targeted application vulnerability exploit payload against unpatched services.",
    sampleSeedId: "exploits-001",
    protocol: "TCP / HTTP",
  },
  {
    category: "Fuzzers",
    isZeroDay: false,
    risk: "MEDIUM",
    description: "Random malformed protocol inputs to trigger service memory crashes.",
    sampleSeedId: "fuzzers-001",
    protocol: "TCP / UDP Fuzzing",
  },
  {
    category: "Generic",
    isZeroDay: false,
    risk: "HIGH",
    description: "Collision and block cipher exploitation sequences.",
    sampleSeedId: "generic-001",
    protocol: "TCP / Custom",
  },
  // Novel Withheld Zero-Days
  {
    category: "Analysis",
    isZeroDay: true,
    risk: "HIGH",
    description: "Web application vulnerability scanning, parameter fuzzing, and directory traversal.",
    sampleSeedId: "analysis-001",
    protocol: "HTTP / HTTPS (Port 8080)",
  },
  {
    category: "Backdoor",
    isZeroDay: true,
    risk: "CRITICAL",
    description: "Stealthy command-and-control (C2) heartbeat beacons and remote shell access.",
    sampleSeedId: "backdoor-001",
    protocol: "TCP Encrypted (Port 4444)",
  },
  {
    category: "Reconnaissance",
    isZeroDay: true,
    risk: "MEDIUM",
    description: "Horizontal port scanning, host discovery sweeps, and OS service probing.",
    sampleSeedId: "reconnaissance-001",
    protocol: "TCP / ICMP Sweeps",
  },
  {
    category: "Shellcode",
    isZeroDay: true,
    risk: "CRITICAL",
    description: "In-memory executable exploit payload injection designed to hijack system flow.",
    sampleSeedId: "shellcode-001",
    protocol: "TCP / SMB (Port 445)",
  },
  {
    category: "Worms",
    isZeroDay: true,
    risk: "CRITICAL",
    description: "Automated self-replicating propagation bursts seeking network-wide infection.",
    sampleSeedId: "worms-001",
    protocol: "TCP (Ports 445 / 139)",
  },
];

export function DemoAttackLabView({
  onEventCreated,
  onNavigateToIncidents,
  onNavigateToDiscovery,
}: DemoAttackLabViewProps) {
  const [loadingSeedId, setLoadingSeedId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TrafficEvent | null>(null);
  const [isStormActive, setIsStormActive] = useState<boolean>(false);
  const [stormProgress, setStormProgress] = useState<number>(0);

  const handleSendTestFlow = async (card: AttackCardConfig) => {
    setLoadingSeedId(card.sampleSeedId);
    setLastResult(null);

    // Fast, subtle Apple sequence
    try {
      setActiveStep("Flow Ingress");
      await new Promise((r) => setTimeout(r, 120));

      setActiveStep("Feature Extraction (IP, Transport, Payload)");
      await new Promise((r) => setTimeout(r, 160));

      setActiveStep("RoNeTC+ Evidential Pass");
      await new Promise((r) => setTimeout(r, 180));

      const event = await api.runSeedAttack(card.sampleSeedId);

      setActiveStep("Dempster-Shafer Opinion Fusion");
      await new Promise((r) => setTimeout(r, 120));

      setActiveStep("Open-Set Cutoff Evaluation");
      setLastResult(event);
      onEventCreated(event);
    } catch (err) {
      console.error("Seed attack run failed:", err);
    } finally {
      setLoadingSeedId(null);
      setActiveStep(null);
    }
  };

  const handleTriggerAttackStorm = async () => {
    if (isStormActive) return;
    setIsStormActive(true);
    setStormProgress(0);

    const zeroDaySeeds = [
      "reconnaissance-001",
      "backdoor-001",
      "analysis-001",
      "shellcode-001",
      "worms-001",
    ];

    try {
      for (let i = 0; i < zeroDaySeeds.length; i++) {
        setStormProgress(i + 1);
        const event = await api.runSeedAttack(zeroDaySeeds[i]);
        setLastResult(event);
        onEventCreated(event);
        await new Promise((r) => setTimeout(r, 350));
      }
    } catch (err) {
      console.error("Attack storm failed:", err);
    } finally {
      setIsStormActive(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
            Demo Attack Laboratory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Deterministic adversary testing suite executing real UNSW-NB15 flows through RoNeTC+ inference.
          </p>
        </div>

        <button
          onClick={handleTriggerAttackStorm}
          disabled={isStormActive || loadingSeedId !== null}
          className="flex items-center space-x-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50"
        >
          {isStormActive ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Simulating Attack Storm ({stormProgress}/5)...</span>
            </>
          ) : (
            <>
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>Launch Attack Storm</span>
            </>
          )}
        </button>
      </div>

      {/* Elegant Processing Sequence Banner */}
      {loadingSeedId && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-900 flex items-center space-x-3 transition-all duration-200">
          <Loader2 className="h-4 w-4 animate-spin text-[#007AFF] shrink-0" />
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900">Evaluating flow:</span>
            <span className="text-[#007AFF] font-medium">{activeStep}</span>
          </div>
        </div>
      )}

      {/* Result Callout Card */}
      {lastResult && (
        <div
          className={`rounded-2xl border p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all ${
            lastResult.open_set.is_unknown
              ? "border-red-200 bg-red-50/40 text-red-900"
              : "border-emerald-200 bg-emerald-50/40 text-emerald-900"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                  lastResult.open_set.is_unknown
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "bg-emerald-50 border-emerald-200 text-emerald-600"
                }`}
              >
                {lastResult.open_set.is_unknown ? (
                  <AlertOctagon className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-gray-900">
                    {lastResult.open_set.is_unknown
                      ? "Zero-Day Threat Detected"
                      : "Known In-Distribution Traffic Verified"}
                  </span>
                  <span className="rounded-md bg-white border border-gray-200 px-2 py-0.5 text-xs font-mono font-medium text-gray-700">
                    {lastResult.event_id}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Ground Truth: <strong>{lastResult.ground_truth}</strong> • Decision:{" "}
                  <strong>{lastResult.decision.status}</strong> ({lastResult.decision.reason})
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center space-x-6 text-xs">
              <div>
                <span className="text-gray-500 block text-[11px]">UNCERTAINTY (u)</span>
                <span
                  className={`font-mono font-semibold text-sm ${
                    lastResult.open_set.uncertainty >= lastResult.open_set.threshold
                      ? "text-red-600"
                      : "text-emerald-600"
                  }`}
                >
                  {lastResult.open_set.uncertainty.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">THRESHOLD (τ)</span>
                <span className="font-mono text-gray-700 text-sm font-medium">
                  {lastResult.open_set.threshold.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">CONFIDENCE</span>
                <span className="font-mono text-gray-900 text-sm font-medium">
                  {(lastResult.prediction.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 text-xs">
              {lastResult.open_set.is_unknown ? (
                <>
                  <button
                    onClick={onNavigateToIncidents}
                    className="rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium px-3.5 py-1.5 transition shadow-sm"
                  >
                    Inspect Incident
                  </button>
                  <button
                    onClick={onNavigateToDiscovery}
                    className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium px-3.5 py-1.5 transition shadow-sm"
                  >
                    Discovery Pool
                  </button>
                </>
              ) : (
                <span className="text-xs text-emerald-700 font-medium px-3 py-1.5 rounded-lg bg-emerald-100/60 border border-emerald-200">
                  Allowed to Network
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
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Known Closed-Set Classes (Base Trained Vocabulary)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ATTACK_CARDS.filter((c) => !c.isZeroDay).map((card) => (
              <div
                key={card.category}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-5 flex flex-col justify-between hover:border-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">{card.category}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                      Known
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed min-h-[44px]">
                    {card.description}
                  </p>
                  <div className="mt-2 text-[11px] text-gray-400 font-mono">
                    {card.protocol}
                  </div>
                </div>

                <button
                  onClick={() => handleSendTestFlow(card)}
                  disabled={loadingSeedId !== null || isStormActive}
                  className="mt-4 w-full flex items-center justify-center space-x-1 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 py-2 text-xs font-medium text-gray-700 transition disabled:opacity-50"
                >
                  <span>Run Detection</span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Withheld Zero-Day Attacks */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-700 mb-3">
            Withheld Zero-Day Threats (Open-Set Evaluation)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ATTACK_CARDS.filter((c) => c.isZeroDay).map((card) => (
              <div
                key={card.category}
                className="rounded-2xl border border-purple-200/80 bg-purple-50/20 p-5 flex flex-col justify-between hover:border-purple-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">{card.category}</span>
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200">
                      Zero-Day
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed min-h-[44px]">
                    {card.description}
                  </p>
                  <div className="mt-2 text-[11px] text-gray-400 font-mono">
                    {card.protocol}
                  </div>
                </div>

                <button
                  onClick={() => handleSendTestFlow(card)}
                  disabled={loadingSeedId !== null || isStormActive}
                  className="mt-4 w-full flex items-center justify-center space-x-1 rounded-xl bg-purple-600 hover:bg-purple-500 py-2 text-xs font-semibold text-white transition shadow-sm disabled:opacity-50"
                >
                  <span>Test Zero-Day</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
