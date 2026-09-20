/**
 * frontend/components/ui/MetricCard.tsx
 * Apple-style minimalist KPI card with refined typography, subtle borders, and soft indicators.
 */
import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral" | "warning";
  trend?: "up" | "down" | "neutral" | string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  color?: "cyan" | "emerald" | "amber" | "rose" | "purple" | "blue" | string;
}

export function MetricCard({
  title,
  value,
  delta,
  deltaType,
  trend,
  subtitle,
  icon: Icon,
  iconColor,
  color = "blue",
}: MetricCardProps) {
  const effectiveDeltaType: "positive" | "negative" | "neutral" | "warning" =
    deltaType ||
    (trend === "up" ? "positive" : trend === "down" ? "negative" : "neutral");

  const deltaColorMap = {
    positive: "text-emerald-700 bg-emerald-50 border-emerald-200/80",
    negative: "text-red-700 bg-red-50 border-red-200/80",
    warning: "text-amber-700 bg-amber-50 border-amber-200/80",
    neutral: "text-gray-600 bg-gray-100 border-gray-200",
  };

  const iconContainerMap: Record<string, string> = {
    blue: "text-[#007AFF] bg-blue-50 border-blue-100",
    cyan: "text-[#007AFF] bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    rose: "text-red-600 bg-red-50 border-red-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
  };

  const iconStyle = iconColor || iconContainerMap[color] || "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-gray-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-gray-500 tracking-normal">
          {title}
        </span>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${iconStyle}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-semibold tracking-tight text-gray-900">
          {value}
        </div>
        {delta && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${deltaColorMap[effectiveDeltaType]}`}>
            {delta}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-1.5 text-xs text-gray-500">
          {subtitle}
        </div>
      )}
    </div>
  );
}
