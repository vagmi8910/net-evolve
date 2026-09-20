/**
 * frontend/components/layout/Sidebar.tsx
 * Apple / Linear style enterprise sidebar with refined navigation and subtle states.
 */
"use client";

import React from "react";
import {
  Activity,
  Radio,
  AlertTriangle,
  Layers,
  Brain,
  Cpu,
  RefreshCcw,
  PlaySquare,
  Crosshair,
  Server,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  incidentCount: number;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  incidentCount,
}: SidebarProps) {
  const sections = [
    {
      title: "MONITOR",
      items: [
        { id: "overview", label: "Overview", icon: Activity },
        { id: "traffic", label: "Live Traffic", icon: Radio },
        { id: "incidents", label: "Incidents", icon: AlertTriangle, badge: incidentCount },
      ],
    },
    {
      title: "INTELLIGENCE",
      items: [
        { id: "discovery", label: "Zero-Day Discovery", icon: Layers },
        { id: "threat-intelligence", label: "Threat Intelligence", icon: Brain },
        { id: "model", label: "Model Observability", icon: Cpu },
        { id: "continual", label: "Model Evolution", icon: RefreshCcw },
      ],
    },
    {
      title: "TESTING",
      items: [
        { id: "replay", label: "Replay Lab", icon: PlaySquare },
        { id: "demo-lab", label: "Demo Attack Lab", icon: Crosshair },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { id: "system", label: "System Health", icon: Server },
        { id: "settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-[#E5E7EB] bg-white transition-all duration-200 z-30 select-none ${
        isCollapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-[#E5E7EB] px-4">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-[#007AFF]">
            <Shield className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-[14px] font-semibold text-gray-900 tracking-tight leading-tight">
                NETEVOLVE
              </span>
              <span className="text-[12px] text-gray-500 font-normal leading-tight">
                Security
              </span>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </h3>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`group flex w-full items-center rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-[#007AFF]"
                        : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                    } ${isCollapsed ? "justify-center" : "justify-between"}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-[#007AFF]"
                            : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 border border-red-200/60">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Subtle Engine Footer */}
      {!isCollapsed && (
        <div className="border-t border-[#E5E7EB] p-3.5">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 p-2.5">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#16A34A]" />
              </span>
              <span className="text-xs font-medium text-gray-700">RoNeTC+ Engine</span>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">v1.2</span>
          </div>
        </div>
      )}
    </aside>
  );
}
