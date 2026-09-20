/**
 * frontend/components/ui/Panel.tsx
 * Apple-style container card with subtle border, header, and clean spacing.
 */
import React from "react";

interface PanelProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: PanelProps) {
  return (
    <div className={`rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-slate-300 transition-all duration-200 ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4 mb-5">
          <div>
            {title && (
              <h3 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight font-heading">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm sm:text-[15px] text-gray-500 mt-1 font-medium">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
