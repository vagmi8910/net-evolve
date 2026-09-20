/**
 * frontend/components/ui/EvidenceMeter.tsx
 * Apple-style visual gauge meter for Dirichlet belief mass and uncertainty.
 */
import React from "react";

interface EvidenceMeterProps {
  label: string;
  evidence?: number;
  belief: number;
  uncertainty: number;
  threshold?: number;
  highlight?: boolean;
}

export function EvidenceMeter({
  label,
  evidence,
  belief,
  uncertainty,
  threshold = 0.1844,
  highlight = false,
}: EvidenceMeterProps) {
  const isExceeded = uncertainty >= threshold;
  const beliefPct = Math.min(100, Math.max(0, belief * 100));
  const unkPct = Math.min(100, Math.max(0, uncertainty * 100));
  const displayEvidence =
    evidence !== undefined
      ? evidence.toFixed(2)
      : ((belief * 10) / Math.max(0.01, uncertainty)).toFixed(1);

  return (
    <div
      className={`rounded-xl p-3.5 transition border ${
        highlight
          ? "border-blue-200 bg-blue-50/50"
          : "border-gray-200 bg-gray-50/60"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-900">{label}</span>
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="text-gray-500">Evidence:</span>
          <span className="font-mono text-gray-900 font-medium">{displayEvidence}</span>
        </div>
      </div>

      {/* Dual Progress Track: Belief (Blue) vs Vacuity Uncertainty (Red/Amber) */}
      <div className="space-y-2 pt-1">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Belief Mass (b):</span>
            <span className="font-mono text-blue-600 font-medium">{belief.toFixed(3)}</span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${beliefPct}%` }}
              className="h-full bg-[#007AFF] rounded-full transition-all duration-300"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Dirichlet Uncertainty (u):</span>
            <span
              className={`font-mono font-medium ${
                isExceeded ? "text-red-600" : "text-amber-600"
              }`}
            >
              {uncertainty.toFixed(4)}
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${unkPct}%` }}
              className={`h-full rounded-full transition-all duration-300 ${
                isExceeded ? "bg-[#DC2626]" : "bg-amber-500"
              }`}
            />
          </div>
        </div>
      </div>

      {isExceeded && (
        <div className="mt-2 text-[11px] text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200/80">
          Uncertainty exceeds decision cutoff (τ = {threshold}) → Zero-Day Candidate
        </div>
      )}
    </div>
  );
}
