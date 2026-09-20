/**
 * frontend/components/layout/StatusBar.tsx
 * Clean, understated bottom telemetry strip for NetEvolve.
 */
import React from "react";

interface StatusBarProps {
  totalFlows: number;
  avgLatency: number;
  threshold?: number;
  isExpanded?: boolean;
}

export function StatusBar({
  totalFlows,
  avgLatency,
  threshold = 0.1844,
  isExpanded = false,
}: StatusBarProps) {
  return (
    <footer className="h-7 border-t border-[#E5E7EB] bg-white px-4 text-[12px] text-gray-500 flex items-center justify-between z-20 select-none">
      <div className="flex items-center space-x-3">
        <span className="flex items-center space-x-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
          <span className="text-gray-700 font-medium">Gateway Active</span>
        </span>
        <span className="text-gray-300">•</span>
        <span>
          Decision Threshold: <strong className="font-mono text-gray-700 font-normal">τ = {threshold.toFixed(4)}</strong>
        </span>
        <span className="text-gray-300">•</span>
        <span>
          Vocabulary: <strong className="text-gray-700 font-medium">{isExpanded ? "7 Classes (Expanded)" : "5 Classes (Base)"}</strong>
        </span>
      </div>

      <div className="flex items-center space-x-3">
        <span>
          Processed: <strong className="text-gray-700 font-medium">{totalFlows.toLocaleString()} flows</strong>
        </span>
        <span className="text-gray-300">•</span>
        <span>
          Latency: <strong className="font-mono text-gray-700 font-normal">{avgLatency.toFixed(1)} ms</strong>
        </span>
      </div>
    </footer>
  );
}
