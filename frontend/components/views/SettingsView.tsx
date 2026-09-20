/**
 * frontend/components/views/SettingsView.tsx
 * Apple macOS System Settings style enterprise configuration console.
 */
"use client";

import React, { useState } from "react";
import {
  Sliders,
  Shield,
  Bell,
  RotateCcw,
  Save,
  Check,
  Info,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";

interface SettingsViewProps {
  onResetDemo: () => void;
}

export function SettingsView({ onResetDemo }: SettingsViewProps) {
  const [threshold, setThreshold] = useState<number>(0.1844);
  const [enforcementMode, setEnforcementMode] = useState<"AUTOMATIC" | "BALANCED" | "AUDIT">("AUTOMATIC");
  const [defaultSpeed, setDefaultSpeed] = useState<number>(1.0);
  const [defaultScenario, setDefaultScenario] = useState<string>("Mixed Enterprise Traffic");
  const [appearance, setAppearance] = useState<"light" | "system" | "dark">("light");
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1.5 font-normal">
            Gateway detection sensitivity, open-set decision thresholds, and application preferences.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 rounded-xl bg-[#007AFF] hover:bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
        >
          {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{isSaved ? "Saved" : "Save Changes"}</span>
        </button>
      </div>

      {/* Main Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detection Settings */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex items-center space-x-2.5 border-b border-gray-100 pb-3">
            <Sliders className="h-4 w-4 text-[#007AFF]" />
            <h3 className="text-[15px] font-semibold text-gray-900">
              Detection & Open-Set Cutoff
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-gray-700 font-medium">Open-set decision cutoff (τ):</span>
                <span className="font-mono text-[#007AFF] font-semibold text-sm">
                  {threshold.toFixed(4)}
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.40"
                step="0.005"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#007AFF]"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>0.05 (Strict)</span>
                <span className="font-medium text-[#007AFF]">0.1844 (Youden Optimal)</span>
                <span>0.40 (Permissive)</span>
              </div>
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80 space-y-1">
              <div className="flex items-center space-x-1.5 text-gray-900 font-semibold text-[11px]">
                <Info className="h-3.5 w-3.5 text-[#007AFF]" />
                <span>Youden J-Statistic Optimization</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Threshold <strong>τ = 0.1844</strong> was mathematically calculated on the UNSW-NB15 validation partition to maximize True Positives while minimizing false rejections.
              </p>
            </div>

            <div>
              <label className="text-gray-500 text-[11px] font-medium block mb-1.5 uppercase tracking-wider">
                ENFORCEMENT MODE
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "AUTOMATIC", label: "Auto Quarantine" },
                  { id: "BALANCED", label: "Balanced" },
                  { id: "AUDIT", label: "Audit Only" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setEnforcementMode(mode.id as any)}
                    className={`py-2 px-1 rounded-xl text-xs font-medium border transition ${
                      enforcementMode === mode.id
                        ? "bg-blue-50 text-[#007AFF] border-blue-200 font-semibold shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:text-gray-900"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Simulation & Appearance Preferences */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex items-center space-x-2.5 border-b border-gray-100 pb-3">
            <Shield className="h-4 w-4 text-[#007AFF]" />
            <h3 className="text-[15px] font-semibold text-gray-900">
              Simulation & Appearance
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-gray-500 text-[11px] font-medium block mb-1.5 uppercase tracking-wider">
                DEFAULT STREAM SPEED
              </label>
              <div className="flex gap-2">
                {[1.0, 2.0, 5.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setDefaultSpeed(spd)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-medium transition ${
                      defaultSpeed === spd
                        ? "bg-blue-50 text-[#007AFF] border-blue-200 font-semibold"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:text-gray-900"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-500 text-[11px] font-medium block mb-1.5 uppercase tracking-wider">
                DEFAULT SCENARIO
              </label>
              <select
                value={defaultScenario}
                onChange={(e) => setDefaultScenario(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#007AFF]"
              >
                <option value="Mixed Enterprise Traffic">Mixed Enterprise Profile</option>
                <option value="Zero-Day Burst">Zero-Day Burst Scenario</option>
                <option value="Attack Storm">Attack Storm Simulation</option>
              </select>
            </div>

            {/* Appearance Mode */}
            <div>
              <label className="text-gray-500 text-[11px] font-medium block mb-1.5 uppercase tracking-wider">
                APPEARANCE
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "light", label: "Light (Default)", icon: Sun },
                  { id: "system", label: "System", icon: Laptop },
                  { id: "dark", label: "Dark", icon: Moon },
                ].map((app) => {
                  const Icon = app.icon;
                  return (
                    <button
                      key={app.id}
                      onClick={() => setAppearance(app.id as any)}
                      className={`flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-medium border transition ${
                        appearance === app.id
                          ? "bg-blue-50 text-[#007AFF] border-blue-200 font-semibold shadow-sm"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{app.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset Demonstration State */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-red-200 bg-red-50/40">
                <div>
                  <span className="font-semibold text-gray-900 block text-xs">
                    Reset Demonstration Environment
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Purges in-memory incident queue and restores 5-class baseline vocabulary.
                  </p>
                </div>
                <button
                  onClick={onResetDemo}
                  className="rounded-xl border border-red-200 bg-white hover:bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition shrink-0 ml-3"
                >
                  Reset State
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
