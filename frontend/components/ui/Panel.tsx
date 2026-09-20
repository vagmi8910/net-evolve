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
    <div className={`rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4 mb-5">
          <div>
            {title && (
              <h3 className="text-[15px] font-semibold text-gray-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">
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
