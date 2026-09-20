/**
 * frontend/components/views/ThreatIntelligenceView.tsx
 * Apple-style Threat Intelligence & Adversary Telemetry Workspace.
 * Model-derived intelligence regarding persistent threat actors, targeted subnets,
 * unknown service footprints, and automated MITRE ATT&CK mapping.
 */
"use client";

import React from "react";
import {
  Brain,
  ShieldAlert,
  Globe,
  Crosshair,
  Server,
  Layers,
  ArrowUpRight,
  Target,
} from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { SeverityBadge } from "@/components/ui/StatusBadge";

interface ThreatSource {
  ip: string;
  subnet: string;
  flows: number;
  maxUncertainty: number;
  candidateCluster: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  firstSeen: string;
}

const SUSPICIOUS_SOURCES: ThreatSource[] = [
  {
    ip: "175.45.176.2",
    subnet: "External AS131279",
    flows: 48,
    maxUncertainty: 0.5218,
    candidateCluster: "Cluster 1 (Candidate: Backdoor-like)",
    severity: "CRITICAL",
    firstSeen: "10 mins ago",
  },
  {
    ip: "198.51.100.44",
    subnet: "External AS64500",
    flows: 35,
    maxUncertainty: 0.4429,
    candidateCluster: "Cluster 2 (Candidate: Shellcode-like)",
    severity: "CRITICAL",
    firstSeen: "22 mins ago",
  },
  {
    ip: "203.0.113.88",
    subnet: "External AS64496",
    flows: 72,
    maxUncertainty: 0.3891,
    candidateCluster: "Cluster 0 (Candidate: Reconnaissance-like)",
    severity: "MEDIUM",
    firstSeen: "45 mins ago",
  },
  {
    ip: "192.0.2.19",
    subnet: "External AS64510",
    flows: 29,
    maxUncertainty: 0.3644,
    candidateCluster: "Cluster 3 (Candidate: Analysis-like)",
    severity: "HIGH",
    firstSeen: "1 hr ago",
  },
];

const MITRE_MAPPINGS = [
  {
    techniqueId: "T1071.001",
    name: "Web Protocols (C2)",
    cluster: "Cluster 1: Backdoor",
    confidence: "94.2%",
    description: "Periodic HTTP/S beaconing to external IPs with encoded payloads.",
  },
  {
    techniqueId: "T1059",
    name: "Command and Scripting Interpreter",
    cluster: "Cluster 2: Shellcode",
    confidence: "98.1%",
    description: "In-memory shellcode execution targeting SMB/RPC services.",
  },
  {
    techniqueId: "T1046",
    name: "Network Service Discovery",
    cluster: "Cluster 0: Reconnaissance",
    confidence: "88.7%",
    description: "Horizontal port sweeps across internal Class C subnet ranges.",
  },
  {
    techniqueId: "T1190",
    name: "Exploit Public-Facing Application",
    cluster: "Cluster 3: Analysis",
    confidence: "91.5%",
    description: "Parameter fuzzing and directory traversal patterns in URI strings.",
  },
];

export function ThreatIntelligenceView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
            Threat Intelligence
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Model-derived intelligence from Dirichlet evidential clustering, unknown traffic signatures, and MITRE ATT&CK mapping.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Active Zero-Day Clusters"
          value="5 Clusters"
          subtitle="Latent embedding groups"
          icon={Layers}
          color="purple"
        />
        <MetricCard
          title="Open-Set Rejection Rate"
          value="2.14%"
          delta="+0.3% today"
          trend="warning"
          icon={ShieldAlert}
          color="amber"
        />
        <MetricCard
          title="Targeted Protocol"
          value="TCP / 445"
          subtitle="SMB & Remote RPC"
          icon={Target}
          color="blue"
        />
        <MetricCard
          title="Correlated Adversaries"
          value="4 Host Pools"
          subtitle="External Autonomous Systems"
          icon={Globe}
          color="rose"
        />
      </div>

      {/* Top Suspicious Source Hosts Table */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crosshair className="h-4 w-4 text-red-600" />
            <h3 className="text-[15px] font-semibold text-gray-900">
              High-Risk External Anomaly Sources
            </h3>
          </div>
          <span className="text-xs text-gray-400">Ranked by Dirichlet uncertainty</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-[#FAFAFA] text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-4 font-normal">SOURCE HOST</th>
                <th className="py-2.5 px-4 font-normal">NETWORK SUBNET</th>
                <th className="py-2.5 px-4 font-normal">ANOMALOUS FLOWS</th>
                <th className="py-2.5 px-4 font-normal">PEAK VACUITY (u)</th>
                <th className="py-2.5 px-4 font-normal">CANDIDATE ZERO-DAY CLUSTER</th>
                <th className="py-2.5 px-4 font-normal">SEVERITY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {SUSPICIOUS_SOURCES.map((src) => (
                <tr key={src.ip} className="hover:bg-gray-50/60 transition">
                  <td className="py-3 px-4 font-mono font-medium text-gray-900">{src.ip}</td>
                  <td className="py-3 px-4 text-gray-500">{src.subnet}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">{src.flows}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-red-600">{src.maxUncertainty.toFixed(4)}</td>
                  <td className="py-3 px-4 text-gray-700 font-medium">{src.candidateCluster}</td>
                  <td className="py-3 px-4">
                    <SeverityBadge severity={src.severity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MITRE ATT&CK Technique Mapping */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-4 w-4 text-[#007AFF]" />
            <h3 className="text-[15px] font-semibold text-gray-900">
              Automated MITRE ATT&CK Correlation
            </h3>
          </div>
          <span className="text-xs text-gray-400">Heuristic multi-view feature mapping</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {MITRE_MAPPINGS.map((mitre) => (
            <div
              key={mitre.techniqueId}
              className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2 hover:border-gray-300 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-semibold text-[#007AFF]">{mitre.techniqueId}</span>
                  <span className="font-semibold text-gray-900">{mitre.name}</span>
                </div>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-[#007AFF] border border-blue-200">
                  {mitre.confidence} match
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">{mitre.description}</p>
              <div className="pt-1 text-[11px] text-gray-500">
                Associated Profile: <span className="text-gray-800 font-medium">{mitre.cluster}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
