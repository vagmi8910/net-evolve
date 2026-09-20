/**
 * frontend/components/views/OverviewView.tsx
 * Apple-style Executive Security Overview.
 * Clean, spacious, high-trust dashboard with subtle area charts,
 * 5 key metric cards, horizontal threat breakdown, and security posture.
 */
"use client";

import React, { useState } from "react";
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Clock,
  Radio,
  ArrowUpRight,
  Cpu,
  Layers,
  Zap,
} from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { SeverityBadge, DecisionBadge } from "@/components/ui/StatusBadge";
import { SimStatus, TrafficEvent, Incident } from "@/types/soc";

interface OverviewViewProps {
  metrics: SimStatus;
  recentEvents: TrafficEvent[];
  incidents: Incident[];
  onSelectEvent: (event: TrafficEvent) => void;
  onNavigateToTraffic: (categoryFilter?: string) => void;
  onNavigateToIncidents: () => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToContinual?: () => void;
}

export function OverviewView({
  metrics,
  recentEvents,
  incidents,
  onSelectEvent,
  onNavigateToTraffic,
  onNavigateToIncidents,
  onNavigateToDiscovery,
  onNavigateToContinual,
}: OverviewViewProps) {
  const [timeRange, setTimeRange] = useState<string>("15m");
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  const total = Math.max(1, metrics.total_flows);
  const activeIncidents = incidents.filter(
    (i) => i.status === "NEW" || i.status === "INVESTIGATING"
  );

  // Clean volume history for Apple Health / Linear style area chart
  const volumeData =
    metrics.volume_history.length >= 6
      ? metrics.volume_history
      : [
          { time: "10:35", known: 12, unknown: 0, total: 12 },
          { time: "10:37", known: 24, unknown: 1, total: 25 },
          { time: "10:39", known: 38, unknown: 2, total: 40 },
          { time: "10:41", known: 28, unknown: 0, total: 28 },
          { time: "10:43", known: 45, unknown: 3, total: 48 },
          { time: "10:45", known: 34, unknown: 1, total: 35 },
          { time: "10:47", known: 52, unknown: 2, total: 54 },
          { time: "10:49", known: 41, unknown: 1, total: 42 },
        ];

  const maxTotal = Math.max(10, ...volumeData.map((d) => d.total));

  // Build SVG path for smooth area chart
  const width = 700;
  const height = 180;
  const padX = 20;
  const padY = 20;
  const graphW = width - padX * 2;
  const graphH = height - padY * 2;

  const points = volumeData.map((d, i) => {
    const x = padX + (i / Math.max(1, volumeData.length - 1)) * graphW;
    const y = height - padY - (d.total / maxTotal) * graphH;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1]?.x || width},${height - padY} L ${points[0]?.x || 0},${height - padY} Z`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
            Security Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time visibility across monitored network traffic and model-rejected zero-day threats.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 text-xs text-gray-500">
          <span className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 text-emerald-700 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>LIVE</span>
          </span>
          <span>Updated just now</span>
        </div>
      </div>

      {/* Row 1: 5 Clean Apple-style Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <MetricCard
          title="Traffic"
          value={metrics.total_flows.toLocaleString()}
          delta="+8.4%"
          deltaType="positive"
          subtitle="flows / min"
          icon={Activity}
          color="blue"
        />
        <MetricCard
          title="Threats Blocked"
          value={metrics.unknown_count + metrics.suspicious_count}
          delta="+12%"
          deltaType="warning"
          subtitle="today"
          icon={ShieldAlert}
          color="rose"
        />
        <MetricCard
          title="Unknown Traffic"
          value={metrics.unknown_count}
          subtitle="zero-day candidates"
          icon={AlertOctagon}
          color="purple"
        />
        <MetricCard
          title="Incidents"
          value={activeIncidents.length}
          subtitle={
            activeIncidents.length > 0
              ? `${activeIncidents.length} require attention`
              : "Queue clear"
          }
          icon={Clock}
          color="amber"
        />
        <MetricCard
          title="Inference"
          value={`${metrics.avg_latency_ms.toFixed(1)} ms`}
          subtitle="RoNeTC+ latency"
          icon={Zap}
          color="emerald"
        />
      </div>

      {/* Row 2: Main Overview Grid (Network Activity + Security Posture) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Network Activity Area Chart (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">
                Network Activity
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Volumetric distribution of inspected traffic
              </p>
            </div>

            <div className="flex items-center space-x-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
              {["5m", "15m", "1h", "24h"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    timeRange === range
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Minimalist Apple Health Style Area Chart */}
          <div className="relative w-full h-[220px] flex items-center justify-center">
            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="appleBlueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#007AFF" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#007AFF" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Minimal Horizontal Gridlines */}
              <line
                x1={padX}
                y1={padY}
                x2={width - padX}
                y2={padY}
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <line
                x1={padX}
                y1={height / 2}
                x2={width - padX}
                y2={height / 2}
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <line
                x1={padX}
                y1={height - padY}
                x2={width - padX}
                y2={height - padY}
                stroke="#E5E7EB"
                strokeWidth="1"
              />

              {/* Area Fill */}
              <path d={areaD} fill="url(#appleBlueGradient)" />

              {/* Smooth Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#007AFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Data Nodes */}
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={activeTooltip === i ? 5 : 3.5}
                  fill="#FFFFFF"
                  stroke="#007AFF"
                  strokeWidth="2.5"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setActiveTooltip(i)}
                  onMouseLeave={() => setActiveTooltip(null)}
                />
              ))}
            </svg>

            {/* Subtle Tooltip */}
            {activeTooltip !== null && points[activeTooltip] && (
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none rounded-xl border border-gray-200 bg-white/95 px-3 py-1.5 text-xs shadow-md"
              >
                <div className="font-semibold text-gray-900">
                  {points[activeTooltip].data.total} flows total
                </div>
                <div className="text-[11px] text-gray-500">
                  {points[activeTooltip].data.known} safe • {points[activeTooltip].data.unknown} zero-day
                </div>
              </div>
            )}
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-[#007AFF]" />
                <span className="text-gray-700 font-medium">Known In-Distribution</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
                <span className="text-gray-700 font-medium">Zero-Day Candidates</span>
              </span>
            </div>
            <button
              onClick={() => onNavigateToTraffic()}
              className="text-[#007AFF] hover:underline font-medium inline-flex items-center space-x-1"
            >
              <span>Inspect live feed</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Security Posture Card (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-[15px] font-semibold text-gray-900">
                Security Posture
              </h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/80">
                Optimal
              </span>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Detection Engine</span>
                <span className="font-medium text-gray-900 flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                  <span>Operational</span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Open-set threshold</span>
                <span className="font-mono text-gray-900 font-medium">0.1844</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Unknown detection</span>
                <span className="font-medium text-emerald-600 font-mono">98.40%</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Inference latency</span>
                <span className="font-mono text-gray-900 font-medium">12.4 ms</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Model</span>
                <span className="font-medium text-gray-900">RoNeTC+ v1.2</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Classes</span>
                <span className="font-medium text-gray-900">
                  {metrics.threat_distribution["Analysis"] ? "7 classes (Expanded)" : "5 known"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100">
            <button
              onClick={() => onNavigateToIncidents()}
              className="w-full rounded-xl bg-gray-50 hover:bg-gray-100 py-2.5 text-xs font-medium text-gray-700 transition flex items-center justify-center space-x-1.5"
            >
              <span>View Active Incident Triage</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Threat Category Breakdown & Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Threat Distribution (Horizontal Bars - 4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">
                Threat Distribution
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Classified categories across flows
              </p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {Object.entries(metrics.threat_distribution).map(([category, count]) => {
              const pct = Math.min(100, Math.round((count / total) * 100));
              const isNormal = category === "Normal";

              return (
                <div
                  key={category}
                  onClick={() => onNavigateToTraffic(category)}
                  className="cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700 group-hover:text-[#007AFF] transition">
                      {category}
                    </span>
                    <span className="text-gray-500 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(5, pct)}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isNormal ? "bg-emerald-500" : "bg-[#007AFF]"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Security Events Table (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">
                  Recent Security Events
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Latest evaluated flows in RoNeTC+ gateway
                </p>
              </div>
              <button
                onClick={() => onNavigateToTraffic()}
                className="text-xs text-[#007AFF] hover:underline font-medium inline-flex items-center space-x-1"
              >
                <span>View all flows</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                    <th className="pb-2 font-normal">TIME</th>
                    <th className="pb-2 font-normal">FLOW ID</th>
                    <th className="pb-2 font-normal">SOURCE</th>
                    <th className="pb-2 font-normal">CLASS</th>
                    <th className="pb-2 font-normal">UNCERTAINTY</th>
                    <th className="pb-2 font-normal">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700">
                  {recentEvents.slice(0, 6).map((ev) => (
                    <tr
                      key={ev.event_id}
                      onClick={() => onSelectEvent(ev)}
                      className="hover:bg-[#F9FAFB] cursor-pointer transition"
                    >
                      <td className="py-2.5 font-mono text-gray-500">{ev.timestamp}</td>
                      <td className="py-2.5 font-mono font-medium text-gray-900">{ev.event_id}</td>
                      <td className="py-2.5 font-mono text-gray-600">{ev.source.ip}</td>
                      <td className="py-2.5 font-medium text-gray-800">{ev.prediction.label}</td>
                      <td className="py-2.5 font-mono text-gray-600">
                        {ev.open_set.uncertainty.toFixed(4)}
                      </td>
                      <td className="py-2.5">
                        <DecisionBadge decision={ev.decision.status} />
                      </td>
                    </tr>
                  ))}

                  {recentEvents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                        No traffic events logged yet. Start simulation stream to inspect flows.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
