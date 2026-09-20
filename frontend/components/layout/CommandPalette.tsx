/**
 * frontend/components/layout/CommandPalette.tsx
 * Apple / Raycast style Command Palette (Cmd/Ctrl + K).
 */
"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Activity,
  Radio,
  AlertTriangle,
  Layers,
  Cpu,
  RefreshCcw,
  PlaySquare,
  Crosshair,
  Server,
  RotateCcw,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onResetDemo: () => void;
  onRunAttackStorm: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectTab,
  onStartSimulation,
  onPauseSimulation,
  onResetDemo,
  onRunAttackStorm,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { label: "Overview", category: "Navigation", icon: Activity, action: () => onSelectTab("overview") },
    { label: "Live Traffic Stream", category: "Navigation", icon: Radio, action: () => onSelectTab("traffic") },
    { label: "Security Incidents Queue", category: "Navigation", icon: AlertTriangle, action: () => onSelectTab("incidents") },
    { label: "Zero-Day Discovery & Latent Space", category: "Navigation", icon: Layers, action: () => onSelectTab("discovery") },
    { label: "Model Evolution (Continual Learning)", category: "Navigation", icon: RefreshCcw, action: () => onSelectTab("continual") },
    { label: "Model Observability & Architecture", category: "Navigation", icon: Cpu, action: () => onSelectTab("model") },
    { label: "Demo Attack Laboratory", category: "Navigation", icon: Crosshair, action: () => onSelectTab("demo-lab") },
    { label: "Replay Lab (Dataset Evaluation)", category: "Navigation", icon: PlaySquare, action: () => onSelectTab("replay") },
    { label: "System Health Diagnostics", category: "Navigation", icon: Server, action: () => onSelectTab("system") },
    { label: "Start Live Traffic Stream", category: "Actions", icon: Radio, action: () => { onStartSimulation(); onSelectTab("traffic"); } },
    { label: "Pause Live Stream", category: "Actions", icon: Radio, action: onPauseSimulation },
    { label: "Launch Attack Storm Simulation", category: "Actions", icon: Crosshair, action: () => { onRunAttackStorm(); onSelectTab("demo-lab"); } },
    { label: "Reset Demo Environment State", category: "Maintenance", icon: RotateCcw, action: onResetDemo },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/20 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl overflow-hidden text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-gray-100">
          <Search className="h-4 w-4 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-sm"
          />
          <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
          {filtered.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.label}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-[13px]">{cmd.label}</span>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">
                  {cmd.category}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-gray-400 text-xs">
              No matching commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
