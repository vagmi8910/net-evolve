/**
 * frontend/components/layout/AppShell.tsx
 * Apple / Linear style enterprise application shell.
 */
"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { StatusBar } from "@/components/layout/StatusBar";
import { CommandPalette } from "@/components/layout/CommandPalette";

interface AppShellProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isConnected: boolean;
  incidentCount: number;
  totalFlows: number;
  avgLatency: number;
  isExpanded?: boolean;
  onResetDemo: () => void;
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onRunAttackStorm: () => void;
  children: React.ReactNode;
}

export function AppShell({
  activeTab,
  setActiveTab,
  isConnected,
  incidentCount,
  totalFlows,
  avgLatency,
  isExpanded = false,
  onResetDemo,
  onStartSimulation,
  onPauseSimulation,
  onRunAttackStorm,
  children,
}: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F8FA] text-[#111827] font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        incidentCount={incidentCount}
      />

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar
          activeTab={activeTab}
          isConnected={isConnected}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onResetDemo={onResetDemo}
          unreadCount={incidentCount}
        />

        {/* Scrollable Work Area with Generous Spacing */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#F7F8FA]">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Persistent Telemetry Bar */}
        <StatusBar
          totalFlows={totalFlows}
          avgLatency={avgLatency}
          threshold={0.1844}
          isExpanded={isExpanded}
        />
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setActiveTab}
        onStartSimulation={onStartSimulation}
        onPauseSimulation={onPauseSimulation}
        onResetDemo={onResetDemo}
        onRunAttackStorm={onRunAttackStorm}
      />
    </div>
  );
}
