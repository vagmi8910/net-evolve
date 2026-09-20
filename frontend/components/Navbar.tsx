/**
 * frontend/components/Navbar.tsx
 * Dark cybersecurity SOC command header with live connection status,
 * model indicators, and tab navigation.
 */
"use client";

import React from "react";
import {
  ShieldAlert,
  Activity,
  Radio,
  Crosshair,
  AlertTriangle,
  Layers,
  Cpu,
  RefreshCcw,
  PlaySquare,
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isConnected: boolean;
  incidentCount: number;
  avgLatency: number;
  onReset: () => void;
  isExpanded: boolean;
}

export function Navbar({
  activeTab,
  setActiveTab,
  isConnected,
  incidentCount,
  avgLatency,
  onReset,
  isExpanded,
}: NavbarProps) {
  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "traffic", label: "Live Traffic", icon: Radio },
    { id: "demo-lab", label: "Demo Attack Lab", icon: Crosshair },
    { id: "incidents", label: "Incidents", icon: AlertTriangle, badge: incidentCount },
    { id: "discovery", label: "Zero-Day Discovery", icon: Layers },
    { id: "continual", label: "Continual Learning", icon: RefreshCcw },
    { id: "model", label: "Model Observability", icon: Cpu },
    { id: "replay", label: "Replay Lab", icon: PlaySquare },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#070B14]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-base font-bold tracking-wider text-slate-100">
                NETEVOLVE
              </span>
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                SOC ENTERPRISE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              RoNeTC+ Evidential Traffic Defense
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-800/90 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {typeof tab.badge === "number" && tab.badge > 0 && (
                  <span className="ml-1 rounded-full bg-red-500/20 px-1.5 py-0.2 text-[10px] font-bold text-red-400 border border-red-500/40 animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status Bar */}
        <div className="flex items-center space-x-4">
          {/* Connection badge */}
          <div className="flex items-center space-x-1.5 font-mono text-xs">
            <span className="relative flex h-2 w-2">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              )}
            </span>
            <span className={isConnected ? "text-emerald-400" : "text-rose-400"}>
              {isConnected ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          {/* Active Model */}
          <div className="hidden lg:flex items-center space-x-1 rounded bg-slate-900 px-2.5 py-1 text-xs border border-slate-800 font-mono">
            <span className="text-slate-500">Model:</span>
            <span className="text-cyan-400 font-semibold">RoNeTC+</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">{isExpanded ? "7 Classes" : "5 Classes"}</span>
          </div>

          {/* Latency */}
          <div className="hidden sm:flex items-center space-x-1 font-mono text-xs text-slate-400">
            <span className="text-slate-500">Latency:</span>
            <span className="text-slate-300">{avgLatency.toFixed(1)}ms</span>
          </div>

          {/* Reset Demo */}
          <button
            onClick={onReset}
            title="Reset simulation and incident state to deterministic demo baseline"
            className="rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            Reset Demo
          </button>
        </div>
      </div>
    </header>
  );
}
