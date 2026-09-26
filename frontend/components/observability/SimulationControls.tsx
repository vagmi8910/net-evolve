/**
 * frontend/components/observability/SimulationControls.tsx
 * Apple/Linear-style interactive simulation controls.
 * Provides Play, Pause, Step Forward/Back, Restart, Auto-Play toggle, and Step Progress.
 */
"use client";

import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface SimulationControlsProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onRestart: () => void;
  onPrev: () => void;
  onNext: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
}

export function SimulationControls({
  currentStep,
  totalSteps,
  stepTitle,
  isPlaying,
  onPlayPause,
  onRestart,
  onPrev,
  onNext,
  playbackSpeed,
  onChangeSpeed,
}: SimulationControlsProps) {
  const speeds = [1.0, 1.5, 2.0];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Step Progress & Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-gray-800 shadow-2xs">
          <span className="text-[#007AFF]">STEP {currentStep}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500">{totalSteps}</span>
        </div>
        <span className="text-sm font-bold text-gray-900 font-heading">
          {stepTitle}
        </span>
      </div>

      {/* Playback Button Group */}
      <div className="flex items-center space-x-2">
        {/* Restart */}
        <button
          type="button"
          onClick={onRestart}
          title="Restart simulation (Step 1)"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-gray-600 hover:text-gray-900 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        {/* Previous Step */}
        <button
          type="button"
          onClick={onPrev}
          disabled={currentStep <= 1}
          title="Previous step"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-gray-600 hover:text-gray-900 hover:bg-slate-100 transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Play / Pause Toggle */}
        <button
          type="button"
          onClick={onPlayPause}
          className={`flex items-center space-x-1.5 px-4 h-8 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer ${
            isPlaying
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-[#007AFF] hover:bg-blue-600 text-white shadow-blue-500/20"
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="h-3.5 w-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{currentStep === totalSteps ? "Replay" : "Play"}</span>
            </>
          )}
        </button>

        {/* Next Step */}
        <button
          type="button"
          onClick={onNext}
          disabled={currentStep >= totalSteps}
          title="Next step"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-gray-600 hover:text-gray-900 hover:bg-slate-100 transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Speed Selector */}
        <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
          <span className="text-[11px] text-gray-400 font-mono mr-1">Speed:</span>
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition cursor-pointer ${
                playbackSpeed === s
                  ? "bg-blue-100 text-[#007AFF] font-bold"
                  : "text-gray-500 hover:bg-white"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
