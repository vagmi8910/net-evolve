/**
 * frontend/components/observability/InferenceSimulation.tsx
 * Master Interactive Video-Like Inference Simulation Component for NetEvolve.
 * Demonstrates step-by-step RoNeTC+ evidential inference for both Known and Unknown zero-day traffic.
 */
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Sliders,
  Sparkles,
  ChevronDown,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { SimulationControls } from "./SimulationControls";
import { PipelineDiagram } from "./PipelineDiagram";
import { SimulationExplanation, SimulationSample } from "./SimulationExplanation";
import { NovelDiscoveryAnimation } from "./NovelDiscoveryAnimation";

// Pre-calibrated deterministic samples matching real UNSW-NB15 seeds & model behavior
const KNOWN_SAMPLES: Record<string, SimulationSample> = {
  DoS: {
    category: "DoS",
    isUnknown: false,
    sourceIp: "10.0.1.42",
    sourcePort: 51234,
    destIp: "10.0.0.8",
    destPort: 80,
    protocol: "TCP",
    service: "http",
    packets: 48,
    bytes: 24576,
    duration: 0.042,
    evidence: {
      ip: { Normal: 0.1, DoS: 18.4, Exploits: 0.3, Fuzzers: 0.2, Generic: 0.1 },
      transport: { Normal: 0.2, DoS: 16.2, Exploits: 0.4, Fuzzers: 0.3, Generic: 0.1 },
      payload: { Normal: 0.1, DoS: 14.8, Exploits: 0.2, Fuzzers: 0.4, Generic: 0.1 },
    },
    dirichlet: {
      alpha: { Normal: 1.13, DoS: 17.47, Exploits: 1.30, Fuzzers: 1.30, Generic: 1.10 },
      strength: 22.3,
      belief: { Normal: 0.006, DoS: 0.739, Exploits: 0.013, Fuzzers: 0.013, Generic: 0.004 },
      uncertainty: 0.2242,
    },
    fusion: {
      conflict: 0.0142,
      fusedBelief: { Normal: 0.002, DoS: 0.942, Exploits: 0.004, Fuzzers: 0.003, Generic: 0.001 },
      fusedUncertainty: 0.0480,
    },
    decision: {
      threshold: 0.1844,
      isKnown: true,
      verdict: "DoS (High Confidence)",
      action: "ALLOW / CLASSIFIED",
    },
  },
  Normal: {
    category: "Normal",
    isUnknown: false,
    sourceIp: "10.0.1.10",
    sourcePort: 53889,
    destIp: "10.0.0.8",
    destPort: 443,
    protocol: "TCP",
    service: "ssl",
    packets: 2,
    bytes: 496,
    duration: 0.001,
    evidence: {
      ip: { Normal: 22.1, DoS: 0.1, Exploits: 0.1, Fuzzers: 0.1, Generic: 0.1 },
      transport: { Normal: 19.4, DoS: 0.2, Exploits: 0.1, Fuzzers: 0.1, Generic: 0.1 },
      payload: { Normal: 18.2, DoS: 0.1, Exploits: 0.1, Fuzzers: 0.2, Generic: 0.1 },
    },
    dirichlet: {
      alpha: { Normal: 20.9, DoS: 1.13, Exploits: 1.10, Fuzzers: 1.13, Generic: 1.10 },
      strength: 25.36,
      belief: { Normal: 0.785, DoS: 0.005, Exploits: 0.004, Fuzzers: 0.005, Generic: 0.004 },
      uncertainty: 0.1972,
    },
    fusion: {
      conflict: 0.0084,
      fusedBelief: { Normal: 0.965, DoS: 0.001, Exploits: 0.001, Fuzzers: 0.001, Generic: 0.001 },
      fusedUncertainty: 0.0310,
    },
    decision: {
      threshold: 0.1844,
      isKnown: true,
      verdict: "Normal Enterprise Traffic",
      action: "ALLOW / CLASSIFIED",
    },
  },
  Exploits: {
    category: "Exploits",
    isUnknown: false,
    sourceIp: "10.0.1.88",
    sourcePort: 49210,
    destIp: "10.0.0.8",
    destPort: 21,
    protocol: "TCP",
    service: "ftp",
    packets: 14,
    bytes: 4210,
    duration: 0.185,
    evidence: {
      ip: { Normal: 0.2, DoS: 0.4, Exploits: 17.8, Fuzzers: 0.5, Generic: 0.2 },
      transport: { Normal: 0.1, DoS: 0.3, Exploits: 15.6, Fuzzers: 0.6, Generic: 0.2 },
      payload: { Normal: 0.2, DoS: 0.2, Exploits: 16.2, Fuzzers: 0.4, Generic: 0.1 },
    },
    dirichlet: {
      alpha: { Normal: 1.17, DoS: 1.30, Exploits: 17.53, Fuzzers: 1.50, Generic: 1.17 },
      strength: 22.67,
      belief: { Normal: 0.007, DoS: 0.013, Exploits: 0.729, Fuzzers: 0.022, Generic: 0.007 },
      uncertainty: 0.2205,
    },
    fusion: {
      conflict: 0.0182,
      fusedBelief: { Normal: 0.003, DoS: 0.005, Exploits: 0.928, Fuzzers: 0.008, Generic: 0.002 },
      fusedUncertainty: 0.0540,
    },
    decision: {
      threshold: 0.1844,
      isKnown: true,
      verdict: "Exploits (Known Signature)",
      action: "ALLOW / CLASSIFIED",
    },
  },
  Fuzzers: {
    category: "Fuzzers",
    isUnknown: false,
    sourceIp: "10.0.1.15",
    sourcePort: 43900,
    destIp: "10.0.0.8",
    destPort: 80,
    protocol: "TCP",
    service: "http",
    packets: 32,
    bytes: 18120,
    duration: 0.31,
    evidence: {
      ip: { Normal: 0.2, DoS: 0.5, Exploits: 0.6, Fuzzers: 15.4, Generic: 0.3 },
      transport: { Normal: 0.2, DoS: 0.4, Exploits: 0.5, Fuzzers: 14.8, Generic: 0.2 },
      payload: { Normal: 0.1, DoS: 0.3, Exploits: 0.4, Fuzzers: 15.9, Generic: 0.2 },
    },
    dirichlet: {
      alpha: { Normal: 1.17, DoS: 1.40, Exploits: 1.50, Fuzzers: 16.37, Generic: 1.23 },
      strength: 21.67,
      belief: { Normal: 0.008, DoS: 0.018, Exploits: 0.023, Fuzzers: 0.709, Generic: 0.011 },
      uncertainty: 0.2307,
    },
    fusion: {
      conflict: 0.0210,
      fusedBelief: { Normal: 0.003, DoS: 0.008, Exploits: 0.009, Fuzzers: 0.915, Generic: 0.004 },
      fusedUncertainty: 0.0610,
    },
    decision: {
      threshold: 0.1844,
      isKnown: true,
      verdict: "Fuzzers (Protocol Anomalies)",
      action: "ALLOW / CLASSIFIED",
    },
  },
  Generic: {
    category: "Generic",
    isUnknown: false,
    sourceIp: "10.0.1.60",
    sourcePort: 54201,
    destIp: "10.0.0.8",
    destPort: 53,
    protocol: "UDP",
    service: "dns",
    packets: 4,
    bytes: 512,
    duration: 0.005,
    evidence: {
      ip: { Normal: 0.2, DoS: 0.2, Exploits: 0.2, Fuzzers: 0.2, Generic: 18.2 },
      transport: { Normal: 0.1, DoS: 0.2, Exploits: 0.1, Fuzzers: 0.2, Generic: 17.5 },
      payload: { Normal: 0.2, DoS: 0.1, Exploits: 0.2, Fuzzers: 0.1, Generic: 16.8 },
    },
    dirichlet: {
      alpha: { Normal: 1.17, DoS: 1.17, Exploits: 1.17, Fuzzers: 1.17, Generic: 18.5 },
      strength: 23.18,
      belief: { Normal: 0.007, DoS: 0.007, Exploits: 0.007, Fuzzers: 0.007, Generic: 0.755 },
      uncertainty: 0.2157,
    },
    fusion: {
      conflict: 0.0114,
      fusedBelief: { Normal: 0.002, DoS: 0.002, Exploits: 0.002, Fuzzers: 0.002, Generic: 0.938 },
      fusedUncertainty: 0.0520,
    },
    decision: {
      threshold: 0.1844,
      isKnown: true,
      verdict: "Generic Cryptographic Attack",
      action: "ALLOW / CLASSIFIED",
    },
  },
};

const UNKNOWN_SAMPLES: Record<string, SimulationSample> = {
  Backdoor: {
    category: "Backdoor",
    isUnknown: true,
    sourceIp: "192.168.1.50",
    sourcePort: 63272,
    destIp: "10.0.0.8",
    destPort: 4444,
    protocol: "TCP",
    service: "-",
    packets: 20,
    bytes: 1280,
    duration: 0.922,
    evidence: {
      ip: { Normal: 0.3, DoS: 0.4, Exploits: 0.2, Fuzzers: 0.3, Generic: 0.2 },
      transport: { Normal: 0.2, DoS: 0.3, Exploits: 0.4, Fuzzers: 0.2, Generic: 0.1 },
      payload: { Normal: 0.4, DoS: 0.2, Exploits: 0.3, Fuzzers: 0.3, Generic: 0.2 },
    },
    dirichlet: {
      alpha: { Normal: 1.30, DoS: 1.30, Exploits: 1.30, Fuzzers: 1.27, Generic: 1.17 },
      strength: 6.34,
      belief: { Normal: 0.047, DoS: 0.047, Exploits: 0.047, Fuzzers: 0.043, Generic: 0.027 },
      uncertainty: 0.7886,
    },
    fusion: {
      conflict: 0.0421,
      fusedBelief: { Normal: 0.112, DoS: 0.108, Exploits: 0.105, Fuzzers: 0.098, Generic: 0.085 },
      fusedUncertainty: 0.4920,
    },
    decision: {
      threshold: 0.1844,
      isKnown: false,
      verdict: "UNKNOWN (High Dirichlet Vacuity)",
      action: "BLOCK / QUARANTINE",
    },
  },
  Analysis: {
    category: "Analysis",
    isUnknown: true,
    sourceIp: "192.168.1.112",
    sourcePort: 51400,
    destIp: "10.0.0.8",
    destPort: 8080,
    protocol: "TCP",
    service: "http",
    packets: 18,
    bytes: 8420,
    duration: 0.45,
    evidence: {
      ip: { Normal: 0.4, DoS: 0.3, Exploits: 0.5, Fuzzers: 0.6, Generic: 0.2 },
      transport: { Normal: 0.3, DoS: 0.2, Exploits: 0.4, Fuzzers: 0.5, Generic: 0.2 },
      payload: { Normal: 0.2, DoS: 0.4, Exploits: 0.6, Fuzzers: 0.4, Generic: 0.3 },
    },
    dirichlet: {
      alpha: { Normal: 1.30, DoS: 1.30, Exploits: 1.50, Fuzzers: 1.50, Generic: 1.23 },
      strength: 6.83,
      belief: { Normal: 0.044, DoS: 0.044, Exploits: 0.073, Fuzzers: 0.073, Generic: 0.034 },
      uncertainty: 0.7321,
    },
    fusion: {
      conflict: 0.0384,
      fusedBelief: { Normal: 0.094, DoS: 0.098, Exploits: 0.134, Fuzzers: 0.142, Generic: 0.064 },
      fusedUncertainty: 0.4680,
    },
    decision: {
      threshold: 0.1844,
      isKnown: false,
      verdict: "UNKNOWN (High Dirichlet Vacuity)",
      action: "BLOCK / QUARANTINE",
    },
  },
  Reconnaissance: {
    category: "Reconnaissance",
    isUnknown: true,
    sourceIp: "192.168.1.80",
    sourcePort: 40122,
    destIp: "10.0.0.8",
    destPort: 22,
    protocol: "TCP",
    service: "ssh",
    packets: 2,
    bytes: 120,
    duration: 0.002,
    evidence: {
      ip: { Normal: 0.2, DoS: 0.3, Exploits: 0.2, Fuzzers: 0.2, Generic: 0.1 },
      transport: { Normal: 0.3, DoS: 0.2, Exploits: 0.1, Fuzzers: 0.2, Generic: 0.1 },
      payload: { Normal: 0.1, DoS: 0.2, Exploits: 0.2, Fuzzers: 0.1, Generic: 0.2 },
    },
    dirichlet: {
      alpha: { Normal: 1.20, DoS: 1.23, Exploits: 1.17, Fuzzers: 1.17, Generic: 1.13 },
      strength: 5.9,
      belief: { Normal: 0.034, DoS: 0.039, Exploits: 0.029, Fuzzers: 0.029, Generic: 0.022 },
      uncertainty: 0.8475,
    },
    fusion: {
      conflict: 0.0291,
      fusedBelief: { Normal: 0.102, DoS: 0.105, Exploits: 0.092, Fuzzers: 0.095, Generic: 0.085 },
      fusedUncertainty: 0.5210,
    },
    decision: {
      threshold: 0.1844,
      isKnown: false,
      verdict: "UNKNOWN (High Dirichlet Vacuity)",
      action: "BLOCK / QUARANTINE",
    },
  },
  Shellcode: {
    category: "Shellcode",
    isUnknown: true,
    sourceIp: "192.168.1.15",
    sourcePort: 58900,
    destIp: "10.0.0.8",
    destPort: 139,
    protocol: "TCP",
    service: "netbios",
    packets: 24,
    bytes: 12450,
    duration: 0.28,
    evidence: {
      ip: { Normal: 0.1, DoS: 0.2, Exploits: 0.4, Fuzzers: 0.3, Generic: 0.1 },
      transport: { Normal: 0.2, DoS: 0.2, Exploits: 0.5, Fuzzers: 0.2, Generic: 0.1 },
      payload: { Normal: 0.1, DoS: 0.1, Exploits: 0.4, Fuzzers: 0.2, Generic: 0.2 },
    },
    dirichlet: {
      alpha: { Normal: 1.13, DoS: 1.17, Exploits: 1.43, Fuzzers: 1.23, Generic: 1.13 },
      strength: 6.09,
      belief: { Normal: 0.021, DoS: 0.028, Exploits: 0.071, Fuzzers: 0.038, Generic: 0.021 },
      uncertainty: 0.8210,
    },
    fusion: {
      conflict: 0.0310,
      fusedBelief: { Normal: 0.081, DoS: 0.084, Exploits: 0.152, Fuzzers: 0.105, Generic: 0.085 },
      fusedUncertainty: 0.5530,
    },
    decision: {
      threshold: 0.1844,
      isKnown: false,
      verdict: "UNKNOWN (High Dirichlet Vacuity)",
      action: "BLOCK / QUARANTINE",
    },
  },
  Worms: {
    category: "Worms",
    isUnknown: true,
    sourceIp: "192.168.1.204",
    sourcePort: 60111,
    destIp: "10.0.0.8",
    destPort: 445,
    protocol: "TCP",
    service: "smb",
    packets: 35,
    bytes: 16800,
    duration: 0.34,
    evidence: {
      ip: { Normal: 0.2, DoS: 0.3, Exploits: 0.3, Fuzzers: 0.2, Generic: 0.2 },
      transport: { Normal: 0.1, DoS: 0.4, Exploits: 0.2, Fuzzers: 0.2, Generic: 0.2 },
      payload: { Normal: 0.2, DoS: 0.2, Exploits: 0.3, Fuzzers: 0.2, Generic: 0.3 },
    },
    dirichlet: {
      alpha: { Normal: 1.17, DoS: 1.30, Exploits: 1.27, Fuzzers: 1.20, Generic: 1.23 },
      strength: 6.17,
      belief: { Normal: 0.028, DoS: 0.049, Exploits: 0.044, Fuzzers: 0.032, Generic: 0.037 },
      uncertainty: 0.8104,
    },
    fusion: {
      conflict: 0.0345,
      fusedBelief: { Normal: 0.085, DoS: 0.114, Exploits: 0.108, Fuzzers: 0.092, Generic: 0.097 },
      fusedUncertainty: 0.5340,
    },
    decision: {
      threshold: 0.1844,
      isKnown: false,
      verdict: "UNKNOWN (High Dirichlet Vacuity)",
      action: "BLOCK / QUARANTINE",
    },
  },
};

const STEP_TITLES = [
  "1. Incoming Network Flow",
  "2. Flow Normalization & Standardization",
  "3. Multi-View Domain Splicing",
  "4. Non-Negative Evidence Generation",
  "5. Subjective Logic / Dirichlet Opinion",
  "6. Dempster-Shafer Multi-View Fusion",
  "7. Open-Set Decision Gate (Threshold Check)",
  "8. Final Verdict & Operational Outcome",
];

export function InferenceSimulation() {
  const [mode, setMode] = useState<"KNOWN" | "UNKNOWN">("KNOWN");
  const [selectedKnownClass, setSelectedKnownClass] = useState<string>("DoS");
  const [selectedUnknownClass, setSelectedUnknownClass] = useState<string>("Backdoor");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active sample based on mode and class selection
  const activeSample: SimulationSample = useMemo(() => {
    if (mode === "KNOWN") {
      return KNOWN_SAMPLES[selectedKnownClass] || KNOWN_SAMPLES["DoS"];
    }
    return UNKNOWN_SAMPLES[selectedUnknownClass] || UNKNOWN_SAMPLES["Backdoor"];
  }, [mode, selectedKnownClass, selectedUnknownClass]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle Play/Pause
  const handlePlayPause = () => {
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
    } else {
      if (currentStep >= 8) {
        setCurrentStep(1);
      }
      setIsPlaying(true);
    }
  };

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      const stepDuration = 2200 / playbackSpeed;
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 8) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 8;
          }
          return prev + 1;
        });
      }, stepDuration);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  const handleRestart = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
    setCurrentStep(1);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(8, prev + 1));
  };

  const handleSelectStep = (step: number) => {
    setIsPlaying(false);
    setCurrentStep(step);
  };

  const handleModeChange = (newMode: "KNOWN" | "UNKNOWN") => {
    setIsPlaying(false);
    setMode(newMode);
    setCurrentStep(1);
  };

  return (
    <div className="space-y-6">
      {/* SECTION BANNER & MODE SELECTOR */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.04)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#007AFF]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#007AFF] font-heading">
                INTERACTIVE INFERENCE SIMULATION
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-950 font-heading mt-1">
              How NetEvolve Detects & Classifies Traffic
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Watch the RoNeTC+ multi-view evidential neural network process a network flow through all 8 mathematical stages.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => handleModeChange("KNOWN")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mode === "KNOWN"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Known Traffic</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("UNKNOWN")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mode === "UNKNOWN"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              <span>Unknown / Zero-Day</span>
            </button>
          </div>
        </div>

        {/* Mode Explanation & Flow Vector Picker */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 text-xs">
          <div className="max-w-xl space-y-0.5">
            <div className="font-bold text-gray-900 font-heading flex items-center space-x-1.5">
              <span>{mode === "KNOWN" ? "Scenario: In-Distribution Traffic Verification" : "Scenario: Out-of-Distribution Zero-Day Quarantine"}</span>
            </div>
            <p className="text-gray-500 leading-relaxed text-[11px]">
              {mode === "KNOWN"
                ? "Demonstrates how NetEvolve confidently classifies traffic belonging to learned classes with low Dirichlet uncertainty (u < 0.1844)."
                : "Demonstrates how NetEvolve detects traffic outside learned space without misclassifying it, rejecting it via high vacuity (u >= 0.1844)."}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-medium text-gray-500">Select Test Vector:</span>

            {mode === "KNOWN" ? (
              <select
                value={selectedKnownClass}
                onChange={(e) => {
                  setSelectedKnownClass(e.target.value);
                  handleRestart();
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-gray-800 shadow-2xs focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="DoS">DoS (SYN Flood / Heavy Flow)</option>
                <option value="Normal">Normal (Benign SSL/TLS)</option>
                <option value="Exploits">Exploits (FTP Exploit)</option>
                <option value="Fuzzers">Fuzzers (HTTP Malformed)</option>
                <option value="Generic">Generic (DNS Cryptographic)</option>
              </select>
            ) : (
              <select
                value={selectedUnknownClass}
                onChange={(e) => {
                  setSelectedUnknownClass(e.target.value);
                  handleRestart();
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-gray-800 shadow-2xs focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Backdoor">Backdoor (Withheld Zero-Day)</option>
                <option value="Analysis">Analysis (Withheld Web Scanner)</option>
                <option value="Reconnaissance">Reconnaissance (Withheld SYN Sweep)</option>
                <option value="Shellcode">Shellcode (Withheld Overflow)</option>
                <option value="Worms">Worms (Withheld Lateral SMB)</option>
              </select>
            )}

            <button
              type="button"
              onClick={handlePlayPause}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#007AFF] hover:bg-blue-600 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition cursor-pointer"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>{isPlaying ? "Pause" : "Run Simulation"}</span>
            </button>
          </div>
        </div>

        {/* SIMULATION CONTROLS */}
        <SimulationControls
          currentStep={currentStep}
          totalSteps={8}
          stepTitle={STEP_TITLES[currentStep - 1]}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onRestart={handleRestart}
          onPrev={handlePrev}
          onNext={handleNext}
          playbackSpeed={playbackSpeed}
          onChangeSpeed={setPlaybackSpeed}
        />

        {/* WORKFLOW DIAGRAM */}
        <PipelineDiagram
          currentStep={currentStep}
          totalSteps={8}
          sample={activeSample}
          isUnknownMode={mode === "UNKNOWN"}
          onSelectStep={handleSelectStep}
        />

        {/* DYNAMIC EXPLANATION PANEL */}
        <SimulationExplanation
          currentStep={currentStep}
          sample={activeSample}
          isUnknownMode={mode === "UNKNOWN"}
        />

        {/* STEP 8 BRANCHING VISUALIZATION */}
        {currentStep === 8 && (
          <div className="pt-2 animate-fadeIn">
            {mode === "UNKNOWN" ? (
              <NovelDiscoveryAnimation
                activeCategory={activeSample.category}
                groundTruthLabel={activeSample.category}
                isSimulating={isPlaying}
              />
            ) : (
              /* Known Traffic Final Verdict Card */
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-950 font-heading">
                        Verified In-Distribution Classification
                      </h3>
                      <p className="text-xs text-emerald-800">
                        High Dirichlet belief mass verified with safe epistemic uncertainty bounds.
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    {activeSample.decision.action}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-emerald-200">
                    <span className="text-[10px] text-gray-400 block font-medium">PREDICTED CATEGORY</span>
                    <span className="text-base font-bold text-gray-900 font-heading">
                      {activeSample.category}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-emerald-200">
                    <span className="text-[10px] text-gray-400 block font-medium">CONFIDENCE BELIEF</span>
                    <span className="text-base font-bold text-emerald-600 font-mono">
                      {(Math.max(...Object.values(activeSample.fusion.fusedBelief)) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-emerald-200">
                    <span className="text-[10px] text-gray-400 block font-medium">EPISTEMIC UNCERTAINTY</span>
                    <span className="text-base font-bold text-gray-900 font-mono">
                      u = {activeSample.fusion.fusedUncertainty.toFixed(4)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-emerald-200">
                    <span className="text-[10px] text-gray-400 block font-medium">DECISION THRESHOLD (tau)</span>
                    <span className="text-base font-bold text-[#007AFF] font-mono">
                      {activeSample.decision.threshold} (Passed)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-emerald-800 leading-relaxed pt-1">
                  Because <strong>u = {activeSample.fusion.fusedUncertainty.toFixed(4)} &lt; {activeSample.decision.threshold}</strong>,
                  the flow is validated as genuine in-distribution traffic and forwarded without false-alarm alerts.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
