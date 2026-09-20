/**
 * frontend/components/ui/NetEvolveLogo.tsx
 * Enterprise NetEvolve Vector Logo — Shield with Evidential Neural Nodes & Evolution Vectors
 */
import React from "react";

interface NetEvolveLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function NetEvolveLogo({
  size = 36,
  className = "",
  showText = false,
}: NetEvolveLogoProps) {
  return (
    <div className={`inline-flex items-center space-x-3 select-none ${className}`}>
      {/* Dynamic Shield with Evidential Neural Graph */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
      >
        <defs>
          {/* Main Shield Gradient */}
          <linearGradient id="ne-shield-grad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0055FF" />
            <stop offset="50%" stopColor="#007AFF" />
            <stop offset="100%" stopColor="#00C6FF" />
          </linearGradient>

          {/* Inner Core Glow */}
          <linearGradient id="ne-core-grad" x1="16" y1="14" x2="32" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.8" />
          </linearGradient>

          {/* Neural Node Glow */}
          <radialGradient id="ne-node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#00C6FF" />
          </radialGradient>

          {/* Subtle Drop Shadow */}
          <filter id="ne-shadow" x="0" y="0" width="48" height="50" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0055FF" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer Shield Geometry */}
        <path
          d="M24 4L8 10V22C8 32.5 14.8 41.8 24 44C33.2 41.8 40 32.5 40 22V10L24 4Z"
          fill="url(#ne-shield-grad)"
          filter="url(#ne-shadow)"
        />

        {/* Inner Subtle Shield Border Accent */}
        <path
          d="M24 6.5L10 11.8V21.5C10 30.8 16 39.2 24 41.3C32 39.2 38 30.8 38 21.5V11.8L24 6.5Z"
          stroke="#FFFFFF"
          strokeOpacity="0.3"
          strokeWidth="1.2"
          fill="none"
        />

        {/* Neural Network Nodes & Evidential Fusion Connections */}
        <g stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.85">
          {/* Edges */}
          <line x1="24" y1="14" x2="16" y2="22" />
          <line x1="24" y1="14" x2="32" y2="22" />
          <line x1="16" y1="22" x2="24" y2="30" />
          <line x1="32" y1="22" x2="24" y2="30" />
          <line x1="16" y1="22" x2="32" y2="22" strokeDasharray="2 2" strokeOpacity="0.6" />
          <line x1="24" y1="30" x2="24" y2="36" />
        </g>

        {/* Evidential Multi-View Nodes */}
        {/* Top Node: Ingress Flow */}
        <circle cx="24" cy="14" r="3" fill="url(#ne-core-grad)" stroke="#0055FF" strokeWidth="1.2" />
        {/* Left Node: IP Evidence */}
        <circle cx="16" cy="22" r="3.2" fill="url(#ne-core-grad)" stroke="#007AFF" strokeWidth="1.2" />
        {/* Right Node: Transport Evidence */}
        <circle cx="32" cy="22" r="3.2" fill="url(#ne-core-grad)" stroke="#007AFF" strokeWidth="1.2" />
        {/* Center Fusion Node: Dempster-Shafer Consensus */}
        <circle cx="24" cy="22" r="2.2" fill="#FFFFFF" />
        {/* Bottom Node: Open-Set Decision */}
        <circle cx="24" cy="30" r="3.4" fill="#FFFFFF" stroke="#00C6FF" strokeWidth="1.4" />
        {/* Output Vector Anchor */}
        <circle cx="24" cy="36" r="1.8" fill="#FFFFFF" />
      </svg>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className="text-[17px] font-extrabold tracking-tight text-gray-950 leading-none font-heading">
              NETEVOLVE
            </span>
            <span className="rounded bg-blue-50 border border-blue-200/80 px-1 py-0.2 text-[9px] font-bold text-[#007AFF] uppercase tracking-wider">
              SOC
            </span>
          </div>
          <span className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase mt-0.5">
            Security Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
