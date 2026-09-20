/**
 * frontend/components/layout/Topbar.tsx
 * Apple / Linear style top navigation bar with breadcrumb trail,
 * global search, system health indicator, notifications, and user avatar.
 */
"use client";

import React, { useState } from "react";
import {
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Shield,
  ChevronRight,
  Server,
  Activity,
} from "lucide-react";

interface TopbarProps {
  activeTab: string;
  isConnected: boolean;
  onOpenCommandPalette: () => void;
  onResetDemo: () => void;
  unreadCount?: number;
}

export function Topbar({
  activeTab,
  isConnected,
  onOpenCommandPalette,
  onResetDemo,
  unreadCount = 3,
}: TopbarProps) {
  const [showHealthPopover, setShowHealthPopover] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  const tabTitles: Record<string, { section: string; title: string }> = {
    overview: { section: "Monitor", title: "Overview" },
    traffic: { section: "Monitor", title: "Live Traffic" },
    incidents: { section: "Monitor", title: "Incidents" },
    discovery: { section: "Intelligence", title: "Zero-Day Discovery" },
    "threat-intelligence": { section: "Intelligence", title: "Threat Intelligence" },
    model: { section: "Intelligence", title: "Model Observability" },
    continual: { section: "Intelligence", title: "Model Evolution" },
    replay: { section: "Testing", title: "Replay Lab" },
    "demo-lab": { section: "Testing", title: "Demo Attack Lab" },
    system: { section: "System", title: "System Health" },
    settings: { section: "System", title: "Settings" },
  };

  const current = tabTitles[activeTab] || { section: "Monitor", title: "Overview" };

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-[#E5E7EB] bg-white px-6">
      {/* Breadcrumb Trail */}
      <div className="flex items-center space-x-2 text-[13px]">
        <span className="text-gray-400 font-normal">Security</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-500 font-normal">{current.section}</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-950 font-bold">{current.title}</span>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center space-x-4">
        {/* Global Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2.5 rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100/70 hover:border-gray-300 transition w-60 justify-between"
        >
          <div className="flex items-center space-x-2">
            <Search className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-400">Search flows, incidents, IPs...</span>
          </div>
          <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ⌘K
          </kbd>
        </button>

        {/* System Health Status Indicator */}
        <div className="relative">
          <button
            onClick={() => setShowHealthPopover(!showHealthPopover)}
            className="flex items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 transition"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isConnected ? "bg-[#16A34A]" : "bg-amber-500"
                }`}
              />
            </span>
            <span className="text-[13px] font-medium text-gray-700">
              {isConnected ? "All systems operational" : "Reconnecting..."}
            </span>
          </button>

          {/* Health Popover */}
          {showHealthPopover && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                <span className="text-xs font-semibold text-gray-900">
                  System Diagnostics
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200/60">
                  Healthy
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-600">
                  <span>FastAPI Gateway:</span>
                  <span className="text-emerald-600 font-medium flex items-center space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>200 OK</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>RoNeTC+ PyTorch Engine:</span>
                  <span className="text-emerald-600 font-medium">Ready (12.4ms)</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>WebSocket Stream:</span>
                  <span className="text-[#007AFF] font-medium">Connected</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Open-Set Threshold:</span>
                  <span className="font-mono text-gray-900">τ = 0.1844</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowHealthPopover(false);
                    onResetDemo();
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 py-1.5 text-xs text-gray-700 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-gray-500" />
                  <span>Reset Demo Simulation</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                <span className="text-xs font-semibold text-gray-900">Notifications</span>
                <span className="text-[11px] text-[#007AFF] font-medium cursor-pointer">
                  Mark all read
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-red-50/60 border border-red-100">
                  <span className="font-medium text-red-900 block">
                    Zero-day anomaly detected
                  </span>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Flow from 175.45.176.2 reached Dirichlet uncertainty u = 0.4920
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="font-medium text-gray-900 block">
                    Model checkpoint ready
                  </span>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Continual head expansion ready to register 2 new classes
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center space-x-2.5 border-l border-gray-200 pl-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 text-[11px] font-semibold text-white">
            SA
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-medium text-gray-900 leading-tight">SecOps Analyst</span>
            <span className="text-[11px] text-gray-400 leading-tight">Enterprise Tier</span>
          </div>
        </div>
      </div>
    </header>
  );
}
