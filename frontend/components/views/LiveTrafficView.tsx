/**
 * frontend/components/views/LiveTrafficView.tsx
 * 
 * Enterprise Network Security Monitoring Console — Live Traffic Workspace
 * 
 * Implements real-time stream inspection through the RoNeTC+ Evidential Gateway:
 * 1. Breadcrumbs, connection telemetry, API status, and CSV export.
 * 2. Real-time control bar (Live/Pause/Reset, speed multipliers 0.5x-10x, scenario selector, simulation actions).
 * 3. Live Traffic Flow Recharts area visualization (rolling seconds window with Known/Suspicious/Unknown series).
 * 4. Real-time horizontal flow pipeline (Incoming -> RoNeTC+ -> Evidence -> Open-Set Decision -> Allow/Block).
 * 5. Side panels: Gateway Activity telemetry & Traffic Simulator with real seed execution & DEMO GROUND TRUTH.
 * 6. Interactive Demo Traffic Replay modal (Known vs Withheld classes, record limits, interval speeds, progress bar).
 * 7. Live Flow Stream data table with auto-scroll, search, filters, compact badges, and drawer inspection.
 */
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Square,
  Search,
  Download,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Activity,
  Cpu,
  Layers,
  GitBranch,
  Radio,
  Zap,
  ChevronUp,
  ChevronDown,
  Clock,
  Sparkles,
  SlidersHorizontal,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DecisionBadge } from "@/components/ui/StatusBadge";
import { TrafficEvent, SimStatus, DemoSeed } from "@/types/soc";
import { api } from "@/lib/api";

interface LiveTrafficViewProps {
  events: TrafficEvent[];
  metrics: SimStatus;
  initialCategoryFilter?: string;
  isConnected?: boolean;
  connectionStatus?: "CONNECTED" | "RECONNECTING" | "DISCONNECTED";
  lastEventTimestamp?: number | null;
  onInjectEvent?: (event: TrafficEvent, metrics?: SimStatus) => void;
  onSelectEvent: (event: TrafficEvent) => void;
  onStart: (speed: number, unknownRate: number, scenario: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToIncidents?: () => void;
}

interface ChartBucket {
  time: string;
  known: number;
  suspicious: number;
  unknown: number;
  total: number;
}

export function LiveTrafficView({
  events,
  metrics,
  initialCategoryFilter = "",
  isConnected = true,
  connectionStatus = "CONNECTED",
  lastEventTimestamp,
  onInjectEvent,
  onSelectEvent,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onNavigateToDiscovery,
  onNavigateToIncidents,
}: LiveTrafficViewProps) {
  // Stream & Scenario Controls
  const [speed, setSpeed] = useState<number>(1.0);
  const [unknownRate, setUnknownRate] = useState<number>(0.05);
  const [scenario, setScenario] = useState<string>("Mixed Enterprise Traffic");

  // Table filtering & search
  const [searchTerm, setSearchTerm] = useState<string>(initialCategoryFilter);
  const [decisionFilter, setDecisionFilter] = useState<string>("ALL");
  const [unknownOnly, setUnknownOnly] = useState<boolean>(false);
  const [sortField, setSortField] = useState<"timestamp" | "uncertainty" | "confidence" | "bytes">("timestamp");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);

  // Time window for chart: 30s or 60s
  const [chartWindowSeconds, setChartWindowSeconds] = useState<30 | 60>(30);

  // Simulator State
  const [injectState, setInjectState] = useState<"idle" | "capturing" | "inferring" | "fusing" | "evaluating" | "done">("idle");
  const [lastInjectedFlow, setLastInjectedFlow] = useState<TrafficEvent | null>(null);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  // Replay Modal State
  const [showReplayModal, setShowReplayModal] = useState<boolean>(false);
  const [replayCategories, setReplayCategories] = useState<string[]>([
    "Normal", "DoS", "Exploits", "Fuzzers", "Generic", "Analysis", "Backdoor", "Reconnaissance", "Shellcode", "Worms"
  ]);
  const [replayRecordLimit, setReplayRecordLimit] = useState<number>(20);
  const [replayIntervalMs, setReplayIntervalMs] = useState<number>(500);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replayProgress, setReplayProgress] = useState<{ current: number; total: number; category: string } | null>(null);
  const replayAbortRef = useRef<boolean>(false);

  // Rolling Chart Buckets
  const [chartBuckets, setChartBuckets] = useState<ChartBucket[]>(() => {
    const now = Date.now();
    const initial: ChartBucket[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 1000);
      const timeStr = d.toTimeString().slice(0, 8);
      initial.push({ time: timeStr, known: 0, suspicious: 0, unknown: 0, total: 0 });
    }
    return initial;
  });

  // Track event counts per second to populate the chart in real time
  const recentEventsRef = useRef<TrafficEvent[]>(events);
  recentEventsRef.current = events;

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentSecond = now.toTimeString().slice(0, 8);

      // Find events that occurred in the last 1 second window
      const oneSecAgo = new Date(now.getTime() - 1000).toTimeString().slice(0, 8);
      const eventsInWindow = recentEventsRef.current.filter((e) => {
        const evSec = e.timestamp.slice(0, 8);
        return evSec === currentSecond || evSec === oneSecAgo;
      });

      let known = 0;
      let suspicious = 0;
      let unknown = 0;

      for (const ev of eventsInWindow) {
        if (ev.open_set.is_unknown || ev.decision.status === "BLOCKED") {
          unknown++;
        } else if (ev.decision.status === "SUSPICIOUS") {
          suspicious++;
        } else {
          known++;
        }
      }

      setChartBuckets((prev) => {
        const updated = [...prev];
        // If last bucket matches current second, update it; otherwise append
        const last = updated[updated.length - 1];
        if (last && last.time === currentSecond) {
          const newKnown = Math.max(last.known, known);
          const newSuspicious = Math.max(last.suspicious, suspicious);
          const newUnknown = Math.max(last.unknown, unknown);
          updated[updated.length - 1] = {
            ...last,
            known: newKnown,
            suspicious: newSuspicious,
            unknown: newUnknown,
            total: newKnown + newSuspicious + newUnknown,
          };
        } else {
          updated.push({
            time: currentSecond,
            known,
            suspicious,
            unknown,
            total: known + suspicious + unknown,
          });
        }

        const maxPoints = chartWindowSeconds === 30 ? 30 : 60;
        return updated.slice(-maxPoints);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [chartWindowSeconds]);

  // When a new event arrives, increment the active bucket immediately so spikes render instantly
  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[0];

    setChartBuckets((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last) {
        let addKnown = 0;
        let addSuspicious = 0;
        let addUnknown = 0;
        if (latest.open_set.is_unknown || latest.decision.status === "BLOCKED") {
          addUnknown = 1;
        } else if (latest.decision.status === "SUSPICIOUS") {
          addSuspicious = 1;
        } else {
          addKnown = 1;
        }
        copy[copy.length - 1] = {
          ...last,
          known: last.known + addKnown,
          suspicious: last.suspicious + addSuspicious,
          unknown: last.unknown + addUnknown,
          total: last.total + 1,
        };
      }
      return copy;
    });
  }, [events]);

  // Filtered & Sorted events for the live stream table
  const visibleEvents = useMemo(() => {
    if (isStreamPaused) return recentEventsRef.current;
    return events;
  }, [events, isStreamPaused]);

  const filteredEvents = useMemo(() => {
    return visibleEvents
      .filter((ev) => {
        if (decisionFilter !== "ALL" && ev.decision.status !== decisionFilter) return false;
        if (unknownOnly && !ev.open_set.is_unknown) return false;
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          ev.event_id.toLowerCase().includes(term) ||
          ev.source.ip.toLowerCase().includes(term) ||
          ev.destination.ip.toLowerCase().includes(term) ||
          ev.prediction.label.toLowerCase().includes(term) ||
          (ev.ground_truth && ev.ground_truth.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        let valA: number | string = 0;
        let valB: number | string = 0;
        if (sortField === "timestamp") {
          valA = a.timestamp;
          valB = b.timestamp;
        } else if (sortField === "uncertainty") {
          valA = a.open_set.uncertainty;
          valB = b.open_set.uncertainty;
        } else if (sortField === "confidence") {
          valA = a.prediction.confidence;
          valB = b.prediction.confidence;
        } else if (sortField === "bytes") {
          valA = a.bytes;
          valB = b.bytes;
        }
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [visibleEvents, decisionFilter, unknownOnly, searchTerm, sortField, sortAsc]);

  // Compute live flows per second estimate
  const currentFlowRate = useMemo(() => {
    if (chartBuckets.length === 0) return 0;
    const last3 = chartBuckets.slice(-3);
    const sum = last3.reduce((acc, b) => acc + b.total, 0);
    return Math.round(sum / Math.max(1, last3.length));
  }, [chartBuckets]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredEvents.length === 0) return;
    const headers = "Time,Flow_ID,Source_IP,Dest_IP,Protocol,Class,Confidence,Uncertainty,Decision,Ground_Truth\n";
    const rows = filteredEvents.map((ev) =>
      `"${ev.timestamp}","${ev.event_id}","${ev.source.ip}:${ev.source.port}","${ev.destination.ip}:${ev.destination.port}","${ev.protocol}","${ev.prediction.label}",${ev.prediction.confidence.toFixed(3)},${ev.open_set.uncertainty.toFixed(4)},"${ev.decision.status}","${ev.ground_truth || "N/A"}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `netevolve_live_traffic_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: "timestamp" | "uncertainty" | "confidence" | "bytes") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Helper: Simulate Known Traffic
  const handleSimulateKnown = async () => {
    if (isInjecting) return;
    setIsInjecting(true);
    setInjectState("capturing");

    try {
      // Pick a random known category from UNSW-NB15 seeds
      const knownCategories = ["Normal", "DoS", "Exploits", "Fuzzers", "Generic"];
      const cat = knownCategories[Math.floor(Math.random() * knownCategories.length)];
      const seedData = await api.getCategorySeeds(cat);
      if (!seedData.seeds || seedData.seeds.length === 0) throw new Error("No seeds available.");
      const randomSeed = seedData.seeds[Math.floor(Math.random() * seedData.seeds.length)];

      setInjectState("inferring");
      await new Promise((r) => setTimeout(r, 180));
      setInjectState("fusing");
      await new Promise((r) => setTimeout(r, 180));
      setInjectState("evaluating");

      // Execute actual inference through RoNeTC+
      const resultEvent = await api.runSeedAttack(randomSeed.id);
      if (onInjectEvent) onInjectEvent(resultEvent);
      setLastInjectedFlow(resultEvent);
      setInjectState("done");
    } catch (err) {
      console.error("Failed to simulate known traffic:", err);
      setInjectState("idle");
    } finally {
      setIsInjecting(false);
      setTimeout(() => setInjectState("idle"), 2500);
    }
  };

  // Helper: Inject Zero-Day Traffic (Withheld classes)
  const handleInjectZeroDay = async () => {
    if (isInjecting) return;
    setIsInjecting(true);
    setInjectState("capturing");

    try {
      // Pick a withheld novel class from UNSW-NB15 seeds
      const withheldCategories = ["Analysis", "Backdoor", "Reconnaissance", "Shellcode", "Worms"];
      const cat = withheldCategories[Math.floor(Math.random() * withheldCategories.length)];
      const seedData = await api.getCategorySeeds(cat);
      if (!seedData.seeds || seedData.seeds.length === 0) throw new Error("No seeds available.");
      const randomSeed = seedData.seeds[Math.floor(Math.random() * seedData.seeds.length)];

      setInjectState("inferring");
      await new Promise((r) => setTimeout(r, 220));
      setInjectState("fusing");
      await new Promise((r) => setTimeout(r, 220));
      setInjectState("evaluating");

      // Execute real RoNeTC+ open-set evaluation on the novel class
      const resultEvent = await api.runSeedAttack(randomSeed.id);
      if (onInjectEvent) onInjectEvent(resultEvent);
      setLastInjectedFlow(resultEvent);
      setInjectState("done");
    } catch (err) {
      console.error("Failed to inject zero-day traffic:", err);
      setInjectState("idle");
    } finally {
      setIsInjecting(false);
      setTimeout(() => setInjectState("idle"), 3000);
    }
  };

  // Helper: Start Replaying Seeds sequentially
  const handleStartReplay = async () => {
    if (isReplaying) return;
    setIsReplaying(true);
    replayAbortRef.current = false;

    try {
      // Gather seeds from selected categories
      const allCategorySeeds: DemoSeed[] = [];
      for (const cat of replayCategories) {
        try {
          const res = await api.getCategorySeeds(cat);
          if (res.seeds) allCategorySeeds.push(...res.seeds);
        } catch {
          // ignore
        }
      }

      // Shuffle and limit
      const shuffled = [...allCategorySeeds].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, replayRecordLimit);

      setReplayProgress({ current: 0, total: selected.length, category: selected[0]?.category || "" });

      for (let i = 0; i < selected.length; i++) {
        if (replayAbortRef.current) break;
        const seed = selected[i];
        setReplayProgress({ current: i + 1, total: selected.length, category: seed.category });

        try {
          const ev = await api.runSeedAttack(seed.id);
          if (onInjectEvent) onInjectEvent(ev);
          setLastInjectedFlow(ev);
        } catch {
          // continue
        }

        if (i < selected.length - 1) {
          await new Promise((r) => setTimeout(r, replayIntervalMs));
        }
      }
    } finally {
      setIsReplaying(false);
      setTimeout(() => setReplayProgress(null), 2000);
    }
  };

  const handleStopReplay = () => {
    replayAbortRef.current = true;
    setIsReplaying(false);
  };

  const toggleReplayCategory = (cat: string) => {
    setReplayCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="space-y-6 select-none">
      {/* ========================================================== */}
      {/* HEADER                                                     */}
      {/* ========================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium mb-1">
            <span>Security</span>
            <span>/</span>
            <span>Monitor</span>
            <span>/</span>
            <span className="text-gray-900 font-semibold">Live Traffic</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
            Live Traffic
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1 font-normal">
            Real-time inspection of network flows through the RoNeTC+ security gateway.
          </p>
        </div>

        {/* Right Header Status Telemetry */}
        <div className="flex items-center space-x-3">
          {/* Connection Status Pill */}
          <div className="flex items-center space-x-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  connectionStatus === "CONNECTED"
                    ? "animate-ping bg-emerald-400"
                    : connectionStatus === "RECONNECTING"
                    ? "animate-ping bg-amber-400"
                    : "bg-red-400"
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  connectionStatus === "CONNECTED"
                    ? "bg-[#16A34A]"
                    : connectionStatus === "RECONNECTING"
                    ? "bg-[#F59E0B]"
                    : "bg-[#DC2626]"
                }`}
              />
            </span>
            <span className="text-xs font-semibold text-gray-800">
              {connectionStatus === "CONNECTED"
                ? "LIVE"
                : connectionStatus === "RECONNECTING"
                ? "Reconnecting"
                : "Disconnected"}
            </span>
            {lastEventTimestamp && (
              <span className="text-[11px] text-gray-400 border-l border-gray-200 pl-2">
                Flow active
              </span>
            )}
          </div>

          {/* API Status Badge */}
          <div className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-1.5 text-xs text-gray-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>API Online</span>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={filteredEvents.length === 0}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition disabled:opacity-50"
            title="Export filtered flows as CSV"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* SECTION 1 — LIVE TRAFFIC CONTROL BAR                      */}
      {/* ========================================================== */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left Controls: Status, Play/Pause, Reset, Speed, Scenario */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Indicator Pill */}
            <div className="flex items-center space-x-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    metrics.is_running && !metrics.is_paused ? "bg-[#16A34A] animate-pulse" : "bg-gray-400"
                  }`}
                />
              </span>
              <span className="text-xs font-bold text-gray-800 tracking-wide">
                {metrics.is_running && !metrics.is_paused ? "STREAMING" : metrics.is_paused ? "PAUSED" : "IDLE"}
              </span>
            </div>

            {/* Play/Pause/Stop Buttons */}
            {!metrics.is_running ? (
              <button
                onClick={() => onStart(speed, unknownRate, scenario)}
                className="flex items-center space-x-1.5 rounded-xl bg-[#007AFF] hover:bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start Stream</span>
              </button>
            ) : metrics.is_paused ? (
              <button
                onClick={onResume}
                className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition"
              >
                <Pause className="h-3.5 w-3.5 text-gray-600" />
                <span>Pause</span>
              </button>
            )}

            {metrics.is_running && (
              <button
                onClick={onStop}
                className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 p-1.5 text-gray-600 shadow-sm transition"
                title="Stop simulation loop"
              >
                <Square className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Reset Button */}
            <button
              onClick={onReset}
              className="flex items-center space-x-1 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition"
              title="Reset simulation telemetry & clear buffer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-gray-400" />
              <span>Reset</span>
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center space-x-1 border-l border-gray-200 pl-3">
              <span className="text-xs font-medium text-gray-400 mr-1">Speed:</span>
              {[0.5, 1.0, 2.0, 5.0, 10.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                    speed === s
                      ? "bg-blue-50 text-[#007AFF] font-bold border border-blue-200/60"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Scenario Dropdown */}
            <div className="flex items-center space-x-2 border-l border-gray-200 pl-3">
              <span className="text-xs font-medium text-gray-400">Scenario:</span>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-800 font-medium focus:outline-none focus:border-[#007AFF] focus:bg-white"
              >
                <option value="Mixed Enterprise Traffic">Mixed Enterprise</option>
                <option value="Zero-Day Burst">Zero-Day Burst</option>
                <option value="Attack Storm">Attack Storm</option>
                <option value="Benign Verification">Clean Benign</option>
              </select>
            </div>
          </div>

          {/* Right Action Area: Simulation Triggers */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleSimulateKnown}
              disabled={isInjecting}
              className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition disabled:opacity-50"
              title="Inject a known flow from UNSW-NB15 base vocabulary through RoNeTC+"
            >
              <Play className="h-3 w-3 text-emerald-600 fill-current" />
              <span>Simulate Known Traffic</span>
            </button>

            <button
              onClick={handleInjectZeroDay}
              disabled={isInjecting}
              className="flex items-center space-x-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 px-3.5 py-1.5 text-xs font-bold shadow-sm transition disabled:opacity-50"
              title="Inject a withheld novel zero-day attack flow through RoNeTC+ open-set evaluation"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              <span>Inject Zero-Day</span>
            </button>

            <button
              onClick={() => setShowReplayModal(true)}
              className="flex items-center space-x-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition"
              title="Open the authentic UNSW-NB15 seed collection replay laboratory"
            >
              <Radio className="h-3.5 w-3.5 text-blue-400" />
              <span>Replay Demo Seeds</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MAIN TWO-COLUMN WORKSPACE: VISUALIZATIONS & STREAM        */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN (8 cols): TRAFFIC FLOW & LIVE STREAM         */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 2 — LIVE TRAFFIC VISUALIZATION (CHART) */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-[17px] sm:text-lg font-bold text-gray-950 tracking-tight">
                    Traffic Flow
                  </h3>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/70">
                    Live Telemetry
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Real-time network flows processed by the security gateway ({chartWindowSeconds}s rolling window).
                </p>
              </div>

              {/* Chart Controls & Series Legend */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 text-xs font-medium text-gray-600">
                  <span className="flex items-center space-x-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#16A34A]" />
                    <span>Known / Allowed</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#F59E0B]" />
                    <span>Suspicious</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#DC2626]" />
                    <span>Unknown / Blocked</span>
                  </span>
                </div>

                {/* Window Selector */}
                <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
                  <button
                    onClick={() => setChartWindowSeconds(30)}
                    className={`px-2 py-0.5 rounded-md font-medium transition ${
                      chartWindowSeconds === 30
                        ? "bg-white text-gray-900 font-bold shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    30s
                  </button>
                  <button
                    onClick={() => setChartWindowSeconds(60)}
                    className={`px-2 py-0.5 rounded-md font-medium transition ${
                      chartWindowSeconds === 60
                        ? "bg-white text-gray-900 font-bold shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    60s
                  </button>
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartBuckets}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorKnown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="colorSuspicious" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="colorUnknown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={chartWindowSeconds === 30 ? 4 : 8}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0].payload as ChartBucket;
                      return (
                        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg text-xs space-y-1.5 min-w-[170px]">
                          <div className="font-semibold text-gray-900 border-b border-gray-100 pb-1 flex justify-between">
                            <span>{label}</span>
                            <span className="font-mono text-gray-500">{data.total} flows/s</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-700 font-medium">
                            <span>Known / Allowed:</span>
                            <span className="font-mono font-bold">{data.known}</span>
                          </div>
                          <div className="flex justify-between items-center text-amber-700 font-medium">
                            <span>Suspicious:</span>
                            <span className="font-mono font-bold">{data.suspicious}</span>
                          </div>
                          <div className="flex justify-between items-center text-red-700 font-medium">
                            <span>Unknown / Blocked:</span>
                            <span className="font-mono font-bold">{data.unknown}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="known"
                    name="Known / Allowed"
                    stroke="#16A34A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorKnown)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="suspicious"
                    name="Suspicious"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSuspicious)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="unknown"
                    name="Unknown / Blocked"
                    stroke="#DC2626"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorUnknown)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SECTION 3 — REAL-TIME FLOW PIPELINE */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Live Gateway Execution Pipeline
              </span>
              <span className="text-[11px] font-medium text-gray-400">
                End-to-End Real-Time Ingress
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {/* Stage 1 */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 flex flex-col items-center justify-between space-y-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#007AFF]">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wide">
                  Ingress
                </span>
                <span className="text-gray-900 font-mono font-semibold text-xs">
                  {metrics.total_flows.toLocaleString()} flows
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">● Streaming</span>
              </div>

              {/* Stage 2 */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 flex flex-col items-center justify-between space-y-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Cpu className="h-3.5 w-3.5" />
                </div>
                <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wide">
                  RoNeTC+
                </span>
                <span className="text-gray-900 font-mono font-semibold text-xs">
                  {metrics.avg_latency_ms.toFixed(1)} ms
                </span>
                <span className="text-[10px] text-gray-500">Tensor CNN</span>
              </div>

              {/* Stage 3 */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 flex flex-col items-center justify-between space-y-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#007AFF]">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wide">
                  Evidence
                </span>
                <span className="text-gray-900 font-medium text-xs">
                  3 Spliced Views
                </span>
                <span className="text-[10px] text-gray-500">Dempster-Shafer</span>
              </div>

              {/* Stage 4 */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 flex flex-col items-center justify-between space-y-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <GitBranch className="h-3.5 w-3.5" />
                </div>
                <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wide">
                  Open-Set
                </span>
                <span className="text-gray-900 font-mono font-semibold text-xs">
                  τ = 0.1844
                </span>
                <span className="text-[10px] text-gray-500">Dirichlet vacuity</span>
              </div>

              {/* Stage 5 */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 flex flex-col items-center justify-between space-y-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wide">
                  Decision
                </span>
                <span className="text-gray-900 font-medium text-xs">
                  Auto-Enforce
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {Math.round(((metrics.known_count) / Math.max(1, metrics.total_flows)) * 100)}% allowed
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4 — LIVE REQUEST STREAM TABLE */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Table Header & Controls */}
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-[#FAFAFA]">
              <div>
                <h3 className="text-[15px] font-bold text-gray-950 tracking-tight">
                  Live Flow Stream
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Inspected flows buffered in gateway memory ({filteredEvents.length} visible).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Box */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search IP, flow, class..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-44 sm:w-52 rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-1 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#007AFF]"
                  />
                </div>

                {/* Decision Filter */}
                <select
                  value={decisionFilter}
                  onChange={(e) => setDecisionFilter(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-800 font-medium focus:outline-none focus:border-[#007AFF]"
                >
                  <option value="ALL">All Decisions</option>
                  <option value="ALLOWED">Allowed Only</option>
                  <option value="SUSPICIOUS">Suspicious Only</option>
                  <option value="BLOCKED">Blocked Only</option>
                </select>

                {/* Unknown Zero-Day Filter */}
                <button
                  onClick={() => setUnknownOnly(!unknownOnly)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-semibold border transition ${
                    unknownOnly
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-white text-gray-600 border-gray-200 hover:text-gray-900"
                  }`}
                >
                  Unknown Only
                </button>

                {/* Auto-scroll Toggle */}
                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-medium border transition ${
                    autoScroll
                      ? "bg-blue-50 text-[#007AFF] border-blue-200/80 font-semibold"
                      : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  Auto-scroll {autoScroll ? "ON" : "OFF"}
                </button>

                {/* Pause Stream Toggle */}
                <button
                  onClick={() => setIsStreamPaused(!isStreamPaused)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-medium border transition ${
                    isStreamPaused
                      ? "bg-amber-50 text-amber-700 border-amber-200 font-semibold"
                      : "bg-white text-gray-600 border-gray-200 hover:text-gray-900"
                  }`}
                >
                  {isStreamPaused ? "Stream Paused" : "Pause Stream"}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[540px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-[#FAFAFA] border-b border-gray-100">
                  <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <th
                      onClick={() => handleSort("timestamp")}
                      className="py-2.5 px-4 cursor-pointer hover:text-gray-900"
                    >
                      <div className="flex items-center space-x-1">
                        <span>TIME</span>
                        {sortField === "timestamp" && (
                          sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th className="py-2.5 px-4 font-semibold">FLOW ID</th>
                    <th className="py-2.5 px-4 font-semibold">SOURCE</th>
                    <th className="py-2.5 px-4 font-semibold">DESTINATION</th>
                    <th className="py-2.5 px-4 font-semibold">PROTO</th>
                    <th className="py-2.5 px-4 font-semibold">CLASSIFICATION</th>
                    <th
                      onClick={() => handleSort("uncertainty")}
                      className="py-2.5 px-4 cursor-pointer hover:text-gray-900"
                    >
                      <div className="flex items-center space-x-1">
                        <span>UNCERTAINTY</span>
                        {sortField === "uncertainty" && (
                          sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th className="py-2.5 px-4 font-semibold">DECISION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {filteredEvents.map((ev, idx) => {
                    const isBlocked = ev.open_set.is_unknown || ev.decision.status === "BLOCKED";

                    return (
                      <tr
                        key={ev.event_id + idx}
                        onClick={() => onSelectEvent(ev)}
                        className={`hover:bg-[#F9FAFB] cursor-pointer transition ${
                          idx === 0 && !isStreamPaused ? "bg-blue-50/20" : ""
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono text-gray-500 text-[11px]">
                          {ev.timestamp}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-medium text-gray-900">
                          {ev.event_id}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-gray-600 text-[11px]">
                          {ev.source.ip}:{ev.source.port}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-gray-600 text-[11px]">
                          {ev.destination.ip}:{ev.destination.port}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-mono text-gray-500 uppercase text-[11px]">
                            {ev.protocol}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-gray-900">
                              {ev.prediction.label}
                            </span>
                            {ev.open_set.is_unknown && (
                              <span className="rounded-full bg-purple-50 px-1.5 py-0.2 text-[10px] font-bold text-purple-700 border border-purple-200">
                                Zero-Day
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`font-mono text-xs ${
                              ev.open_set.uncertainty >= ev.open_set.threshold
                                ? "text-red-600 font-bold"
                                : "text-gray-600 font-medium"
                            }`}
                          >
                            {ev.open_set.uncertainty.toFixed(4)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <DecisionBadge decision={ev.decision.status} />
                        </td>
                      </tr>
                    );
                  })}

                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                        {events.length === 0
                          ? "Traffic stream idle. Click 'Start Stream' or 'Simulate Known Traffic' to inspect flows."
                          : "No flows match the active search or filter criteria."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN (4 cols): GATEWAY ACTIVITY & SIMULATOR      */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* SECTION 5 — GATEWAY ACTIVITY SIDE PANEL */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-[16px] font-bold text-gray-950 tracking-tight">
                  Gateway Activity
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Real-time telemetry & model enforcement state
                </p>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-[#16A34A]" />
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Traffic throughput</span>
                <span className="font-mono font-bold text-gray-900 text-sm">
                  {currentFlowRate} <span className="text-xs text-gray-500 font-normal">flows / sec</span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Allowed traffic</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {metrics.known_count.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Suspicious monitored</span>
                <span className="font-mono font-bold text-amber-600 text-sm">
                  {metrics.suspicious_count.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Blocked zero-day</span>
                <span className="font-mono font-bold text-red-600 text-sm">
                  {metrics.blocked_count.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Average latency</span>
                <span className="font-mono font-medium text-gray-900">
                  {metrics.avg_latency_ms.toFixed(1)} ms
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Unknown candidate rate</span>
                <span className="font-mono font-bold text-purple-700">
                  {((metrics.unknown_count / Math.max(1, metrics.total_flows)) * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                <span className="text-gray-500">Current open-set threshold</span>
                <span className="font-mono font-bold text-gray-900">
                  τ = 0.1844
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Engine status</span>
                <span className="font-semibold text-emerald-700 flex items-center space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>RoNeTC+ Online</span>
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 6 — TRAFFIC SIMULATOR CARD & LAST INJECTED FLOW */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-4">
            <div>
              <h3 className="text-[16px] font-bold text-gray-950 tracking-tight">
                Traffic Simulator
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Generate controlled traffic through the live RoNeTC+ inference pipeline.
              </p>
            </div>

            {/* Quick Trigger Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleSimulateKnown}
                disabled={isInjecting}
                className="w-full flex items-center justify-center space-x-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2 text-xs font-semibold text-gray-800 shadow-sm transition disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 text-emerald-600 fill-current" />
                <span>Generate Known</span>
              </button>

              <button
                onClick={handleInjectZeroDay}
                disabled={isInjecting}
                className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2 text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                <span>Generate Zero-Day</span>
              </button>
            </div>

            {/* Processing Animation Step Sequence if Injecting */}
            {isInjecting && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-xs space-y-1.5">
                <div className="flex items-center space-x-2 text-blue-900 font-semibold">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#007AFF]" />
                  <span>
                    {injectState === "capturing" && "Capturing demo flow..."}
                    {injectState === "inferring" && "RoNeTC+ multi-view inference..."}
                    {injectState === "fusing" && "Evidence fusion via Dempster-Shafer..."}
                    {injectState === "evaluating" && "Evaluating open-set threshold..."}
                    {injectState === "done" && "Verdict reached & dispatched!"}
                  </span>
                </div>
                <div className="w-full bg-blue-200 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-[#007AFF] h-full transition-all duration-200"
                    style={{
                      width:
                        injectState === "capturing"
                          ? "25%"
                          : injectState === "inferring"
                          ? "50%"
                          : injectState === "fusing"
                          ? "75%"
                          : "100%",
                    }}
                  />
                </div>
              </div>
            )}

            {/* LAST INJECTED FLOW CARD */}
            {lastInjectedFlow ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    LAST INJECTED FLOW
                  </span>
                  <DecisionBadge decision={lastInjectedFlow.decision.status} />
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Flow ID:</span>
                    <span className="font-mono font-semibold text-gray-900">{lastInjectedFlow.event_id}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Source:</span>
                    <span className="font-mono text-gray-700">{lastInjectedFlow.source.ip}:{lastInjectedFlow.source.port}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Destination:</span>
                    <span className="font-mono text-gray-700">{lastInjectedFlow.destination.ip}:{lastInjectedFlow.destination.port}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Classification:</span>
                    <span className="font-bold text-gray-900">{lastInjectedFlow.prediction.label}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Uncertainty:</span>
                    <span
                      className={`font-mono font-bold ${
                        lastInjectedFlow.open_set.uncertainty >= lastInjectedFlow.open_set.threshold
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {lastInjectedFlow.open_set.uncertainty.toFixed(4)}{" "}
                      <span className="text-gray-400 font-normal">(τ = {lastInjectedFlow.open_set.threshold})</span>
                    </span>
                  </div>

                  {/* PROMINENT DEMO GROUND TRUTH LABEL */}
                  {lastInjectedFlow.ground_truth && (
                    <div className="mt-2 rounded-lg border border-purple-200 bg-purple-50/70 p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase tracking-wide text-purple-900 text-[10px]">
                          DEMO GROUND TRUTH
                        </span>
                        <span className="font-semibold text-purple-800">
                          {lastInjectedFlow.ground_truth}
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-700 mt-0.5">
                        *Withheld from model during test evaluation
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSelectEvent(lastInjectedFlow)}
                  className="w-full mt-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 py-1.5 text-xs font-semibold text-gray-700 transition shadow-xs text-center block"
                >
                  Inspect Complete Multi-View Evidence →
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                No simulated flow triggered yet. Click "Generate Known" or "Generate Zero-Day" to inject.
              </div>
            )}
          </div>

          {/* SECTION 7 — VISUAL NETWORK ACTIVITY (DECISION SUMMARY) */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-3">
            <div>
              <h3 className="text-[16px] font-bold text-gray-950 tracking-tight">
                Traffic Decisions
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Distribution of allowed, monitored, and blocked traffic.
              </p>
            </div>

            {/* Segmented Bar */}
            {(() => {
              const total = Math.max(1, metrics.total_flows);
              const allowedPct = Math.round((metrics.known_count / total) * 100);
              const suspiciousPct = Math.round((metrics.suspicious_count / total) * 100);
              const blockedPct = Math.min(100, 100 - allowedPct - suspiciousPct);

              return (
                <div className="space-y-3">
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${allowedPct}%` }}
                      className="bg-[#16A34A] h-full transition-all duration-300"
                      title={`Allowed: ${allowedPct}%`}
                    />
                    <div
                      style={{ width: `${suspiciousPct}%` }}
                      className="bg-[#F59E0B] h-full transition-all duration-300"
                      title={`Suspicious: ${suspiciousPct}%`}
                    />
                    <div
                      style={{ width: `${blockedPct}%` }}
                      className="bg-[#DC2626] h-full transition-all duration-300"
                      title={`Blocked: ${blockedPct}%`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <span className="text-emerald-800 text-[11px] font-semibold block">Allowed</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm block">
                        {metrics.known_count}
                      </span>
                      <span className="text-[10px] text-emerald-600">{allowedPct}%</span>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-50/50 border border-amber-100">
                      <span className="text-amber-800 text-[11px] font-semibold block">Monitored</span>
                      <span className="font-mono font-bold text-amber-700 text-sm block">
                        {metrics.suspicious_count}
                      </span>
                      <span className="text-[10px] text-amber-600">{suspiciousPct}%</span>
                    </div>

                    <div className="p-2 rounded-xl bg-red-50/50 border border-red-100">
                      <span className="text-red-800 text-[11px] font-semibold block">Blocked</span>
                      <span className="font-mono font-bold text-red-700 text-sm block">
                        {metrics.blocked_count}
                      </span>
                      <span className="text-[10px] text-red-600">{blockedPct}%</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* DEMO TRAFFIC REPLAY MODAL                                  */}
      {/* ========================================================== */}
      {showReplayModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/30 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !isReplaying && setShowReplayModal(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-950 tracking-tight">
                  Demo Traffic Replay
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Replay authentic UNSW-NB15 flow records through the RoNeTC+ gateway.
                </p>
              </div>
              <button
                onClick={() => !isReplaying && setShowReplayModal(false)}
                disabled={isReplaying}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition disabled:opacity-30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Known Categories Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Known Traffic (100 flows total)
                </span>
                <span className="text-[11px] text-gray-400">Base Model Vocabulary</span>
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {["Normal", "DoS", "Exploits", "Fuzzers", "Generic"].map((cat) => {
                  const isSelected = replayCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleReplayCategory(cat)}
                      disabled={isReplaying}
                      className={`p-2 rounded-xl border text-center font-semibold transition ${
                        isSelected
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="truncate">{cat}</div>
                      <span className="text-[10px] text-gray-400 font-normal">20 flows</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unknown Zero-Day Categories Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                  Unknown Traffic (50 flows total)
                </span>
                <span className="text-[11px] text-red-500">Withheld Classes</span>
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {["Analysis", "Backdoor", "Reconnaissance", "Shellcode", "Worms"].map((cat) => {
                  const isSelected = replayCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleReplayCategory(cat)}
                      disabled={isReplaying}
                      className={`p-2 rounded-xl border text-center font-semibold transition ${
                        isSelected
                          ? "bg-red-50 text-red-800 border-red-300"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="truncate">{cat}</div>
                      <span className="text-[10px] text-gray-400 font-normal">10 flows</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-400 font-medium">Quick presets:</span>
              <button
                onClick={() => setReplayCategories(["Normal", "DoS", "Exploits", "Fuzzers", "Generic"])}
                disabled={isReplaying}
                className="px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
              >
                Replay Known
              </button>
              <button
                onClick={() => setReplayCategories(["Analysis", "Backdoor", "Reconnaissance", "Shellcode", "Worms"])}
                disabled={isReplaying}
                className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-medium"
              >
                Replay Zero-Day
              </button>
              <button
                onClick={() =>
                  setReplayCategories([
                    "Normal", "DoS", "Exploits", "Fuzzers", "Generic",
                    "Analysis", "Backdoor", "Reconnaissance", "Shellcode", "Worms"
                  ])
                }
                disabled={isReplaying}
                className="px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
              >
                Replay All
              </button>
            </div>

            {/* Configuration Controls */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 text-xs">
              <div>
                <span className="text-gray-500 font-medium block mb-1">Records Limit:</span>
                <div className="flex space-x-1">
                  {[10, 25, 50, 100].map((count) => (
                    <button
                      key={count}
                      onClick={() => setReplayRecordLimit(count)}
                      disabled={isReplaying}
                      className={`flex-1 py-1.5 rounded-lg border font-semibold text-center transition ${
                        replayRecordLimit === count
                          ? "bg-blue-50 text-[#007AFF] border-blue-200"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-gray-500 font-medium block mb-1">Interval Speed:</span>
                <div className="flex space-x-1">
                  {[
                    { label: "250ms", ms: 250 },
                    { label: "500ms", ms: 500 },
                    { label: "1s", ms: 1000 },
                    { label: "2s", ms: 2000 },
                  ].map((item) => (
                    <button
                      key={item.ms}
                      onClick={() => setReplayIntervalMs(item.ms)}
                      disabled={isReplaying}
                      className={`flex-1 py-1.5 rounded-lg border font-semibold text-center transition ${
                        replayIntervalMs === item.ms
                          ? "bg-blue-50 text-[#007AFF] border-blue-200"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress Bar when Replaying */}
            {replayProgress && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-semibold text-gray-700">
                  <span>
                    Replaying Seed {replayProgress.current} / {replayProgress.total} ({replayProgress.category})
                  </span>
                  <span className="font-mono">
                    {Math.round((replayProgress.current / replayProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#007AFF] h-full transition-all duration-200"
                    style={{
                      width: `${(replayProgress.current / replayProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
              {isReplaying ? (
                <button
                  onClick={handleStopReplay}
                  className="rounded-xl bg-red-600 hover:bg-red-500 text-white px-5 py-2 text-xs font-bold shadow-sm transition"
                >
                  Stop Replay
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowReplayModal(false)}
                    className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 text-xs font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartReplay}
                    disabled={replayCategories.length === 0}
                    className="rounded-xl bg-[#007AFF] hover:bg-blue-600 text-white px-5 py-2 text-xs font-bold shadow-sm transition disabled:opacity-50"
                  >
                    Start Replay
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
