/**
 * frontend/app/page.tsx
 * Master enterprise command center dashboard for NetEvolve Security (SOC Platform).
 * Unifies real-time streaming traffic, multi-view evidential reasoning,
 * zero-day discovery clustering, and continual learning under an enterprise AppShell.
 */
"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { OverviewView } from "@/components/views/OverviewView";
import { LiveTrafficView } from "@/components/views/LiveTrafficView";
import { IncidentsView } from "@/components/views/IncidentsView";
import { ZeroDayDiscoveryView } from "@/components/views/ZeroDayDiscoveryView";
import { ModelEvolutionView } from "@/components/views/ModelEvolutionView";
import { ModelObservabilityView } from "@/components/views/ModelObservabilityView";
import { DemoAttackLabView } from "@/components/views/DemoAttackLabView";
import { ReplayLabView } from "@/components/views/ReplayLabView";
import { ThreatIntelligenceView } from "@/components/views/ThreatIntelligenceView";
import { SystemHealthView } from "@/components/views/SystemHealthView";
import { SettingsView } from "@/components/views/SettingsView";
import { EventDetailDrawer } from "@/components/views/EventDetailDrawer";
import { useSocStream } from "@/hooks/useSocStream";
import { api } from "@/lib/api";

export default function SOCDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("overview");

  const {
    isConnected,
    connectionStatus,
    lastEventTimestamp,
    injectEvent,
    events,
    metrics,
    incidents,
    selectedEvent,
    setSelectedEvent,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    resetSimulation,
    refreshIncidents,
  } = useSocStream();

  const handleRunAttackStorm = async () => {
    setActiveTab("demo-lab");
    const zeroDaySeeds = [
      "reconnaissance-001",
      "backdoor-001",
      "analysis-001",
      "shellcode-001",
      "worms-001",
    ];
    for (const seed of zeroDaySeeds) {
      try {
        const ev = await api.runSeedAttack(seed);
        setSelectedEvent(ev);
        refreshIncidents();
        await new Promise((r) => setTimeout(r, 400));
      } catch (err) {
        console.error("Attack storm run seed failed:", err);
      }
    }
  };

  const isModelExpanded =
    metrics.threat_distribution["Analysis"] !== undefined ||
    metrics.threat_distribution["Backdoor"] !== undefined;

  const activeIncidentCount = incidents.filter(
    (i) => i.status === "NEW" || i.status === "INVESTIGATING"
  ).length;

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isConnected={isConnected}
      incidentCount={activeIncidentCount}
      totalFlows={metrics.total_flows}
      avgLatency={metrics.avg_latency_ms}
      isExpanded={isModelExpanded}
      onResetDemo={resetSimulation}
      onStartSimulation={() => startSimulation(1.0, 0.05, "Mixed Enterprise Profile")}
      onPauseSimulation={pauseSimulation}
      onRunAttackStorm={handleRunAttackStorm}
    >
      {/* Dynamic Active View Rendering */}
      {activeTab === "overview" && (
        <OverviewView
          metrics={metrics}
          recentEvents={events}
          incidents={incidents}
          onSelectEvent={setSelectedEvent}
          onNavigateToTraffic={() => setActiveTab("traffic")}
          onNavigateToIncidents={() => setActiveTab("incidents")}
          onNavigateToDiscovery={() => setActiveTab("discovery")}
          onNavigateToContinual={() => setActiveTab("continual")}
        />
      )}

      {activeTab === "traffic" && (
        <LiveTrafficView
          events={events}
          metrics={metrics}
          isConnected={isConnected}
          connectionStatus={connectionStatus}
          lastEventTimestamp={lastEventTimestamp}
          onInjectEvent={injectEvent}
          onSelectEvent={setSelectedEvent}
          onStart={startSimulation}
          onPause={pauseSimulation}
          onResume={resumeSimulation}
          onStop={stopSimulation}
          onReset={resetSimulation}
          onNavigateToDiscovery={() => setActiveTab("discovery")}
          onNavigateToIncidents={() => setActiveTab("incidents")}
        />
      )}

      {activeTab === "incidents" && (
        <IncidentsView
          incidents={incidents}
          onRefresh={refreshIncidents}
          onNavigateToDiscovery={() => setActiveTab("discovery")}
        />
      )}

      {activeTab === "discovery" && (
        <ZeroDayDiscoveryView
          onNavigateToContinualLearning={() => setActiveTab("continual")}
        />
      )}

      {activeTab === "threat-intelligence" && (
        <ThreatIntelligenceView />
      )}

      {activeTab === "model" && (
        <ModelObservabilityView />
      )}

      {activeTab === "continual" && (
        <ModelEvolutionView
          metrics={metrics}
          incidents={incidents}
          onStartSimulation={() => startSimulation(1.0, 0.05, "Mixed Enterprise Profile")}
          onRunAttackStorm={handleRunAttackStorm}
          onUpdateCompleted={() => {
            refreshIncidents();
          }}
        />
      )}

      {activeTab === "replay" && (
        <ReplayLabView
          metrics={metrics}
          onStart={startSimulation}
          onPause={pauseSimulation}
          onResume={resumeSimulation}
          onStop={stopSimulation}
          onReset={resetSimulation}
        />
      )}

      {activeTab === "demo-lab" && (
        <DemoAttackLabView
          onEventCreated={(ev) => {
            setSelectedEvent(ev);
            refreshIncidents();
          }}
          onNavigateToIncidents={() => setActiveTab("incidents")}
          onNavigateToDiscovery={() => setActiveTab("discovery")}
        />
      )}

      {activeTab === "system" && (
        <SystemHealthView
          isConnected={isConnected}
          avgLatency={metrics.avg_latency_ms}
          totalFlows={metrics.total_flows}
          onResetDemo={resetSimulation}
        />
      )}

      {activeTab === "settings" && (
        <SettingsView
          onResetDemo={resetSimulation}
        />
      )}

      {/* Global Event Slide-Over Drawer for Deep Multi-View Inspection */}
      <EventDetailDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onNavigateToDiscovery={() => {
          setSelectedEvent(null);
          setActiveTab("discovery");
        }}
        onNavigateToIncidents={() => {
          setSelectedEvent(null);
          setActiveTab("incidents");
        }}
      />
    </AppShell>
  );
}
