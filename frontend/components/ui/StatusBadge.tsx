/**
 * frontend/components/ui/StatusBadge.tsx
 * Refined Apple-style status, severity, and decision badges for NetEvolve.
 */
import React from "react";

export function SeverityBadge({ severity }: { severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string }) {
  const map: Record<string, string> = {
    CRITICAL: "bg-red-50 text-red-700 border-red-200/80",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200/80",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200/80",
    LOW: "bg-blue-50 text-blue-700 border-blue-200/80",
  };

  const style = map[severity.toUpperCase()] || "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${style}`}>
      {severity}
    </span>
  );
}

export function DecisionBadge({
  decision,
  status,
}: {
  decision?: "ALLOWED" | "SUSPICIOUS" | "BLOCKED" | "REJECTED" | string;
  status?: "ALLOWED" | "SUSPICIOUS" | "BLOCKED" | "REJECTED" | string;
}) {
  const val = (decision || status || "ALLOWED").toUpperCase();
  const isBlocked = val === "BLOCKED" || val === "REJECTED";
  const isSuspicious = val === "SUSPICIOUS";

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${
        isBlocked
          ? "bg-red-50 text-red-700 border-red-200/80"
          : isSuspicious
          ? "bg-amber-50 text-amber-700 border-amber-200/80"
          : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
      }`}
    >
      {val === "ALLOWED" ? "Allowed" : val === "BLOCKED" ? "Blocked" : val === "SUSPICIOUS" ? "Suspicious" : val}
    </span>
  );
}

export function IncidentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW: "bg-red-50 text-red-700 border-red-200/80",
    INVESTIGATING: "bg-blue-50 text-blue-700 border-blue-200/80",
    CONTAINED: "bg-amber-50 text-amber-700 border-amber-200/80",
    RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    FALSE_POSITIVE: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const style = map[status.toUpperCase()] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${style}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export const StatusBadge = IncidentStatusBadge;
