/**
 * frontend/components/observability/SimulationExplanation.tsx
 * Dynamic narrative and mathematical parameter inspector for each simulation step.
 * Adapts between Known and Unknown traffic scenarios with live computed values.
 */
"use client";

import React from "react";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  GitMerge,
  Scale,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export interface SimulationSample {
  category: string;
  isUnknown: boolean;
  sourceIp: string;
  sourcePort: number;
  destIp: string;
  destPort: number;
  protocol: string;
  service: string;
  packets: number;
  bytes: number;
  duration: number;
  evidence: {
    ip: Record<string, number>;
    transport: Record<string, number>;
    payload: Record<string, number>;
  };
  dirichlet: {
    alpha: Record<string, number>;
    strength: number;
    belief: Record<string, number>;
    uncertainty: number;
  };
  fusion: {
    conflict: number;
    fusedBelief: Record<string, number>;
    fusedUncertainty: number;
  };
  decision: {
    threshold: number;
    isKnown: boolean;
    verdict: string;
    action: string;
  };
}

interface SimulationExplanationProps {
  currentStep: number;
  sample: SimulationSample;
  isUnknownMode: boolean;
}

export function SimulationExplanation({
  currentStep,
  sample,
  isUnknownMode,
}: SimulationExplanationProps) {
  const threshold = sample.decision.threshold;
  const fusedU = sample.fusion.fusedUncertainty;
  const isRejected = fusedU >= threshold;

  // Step 1: Flow Ingestion
  const renderStep1 = () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-[#007AFF] font-bold text-sm">
        <Cpu className="h-4 w-4" />
        <span>Step 1: Network Flow Capture & Ingestion</span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">
        NetEvolve intercepts live network traffic at the gateway, assembling packets into bidirectional flow records.
        Packet timing, byte volumes, and IP/TCP header fields are compiled into a unified raw flow telemetry record.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
          <span className="text-[10px] text-gray-400 block font-medium">SOURCE ENDPOINT</span>
          <span className="font-mono font-semibold text-gray-900">
            {sample.sourceIp}:{sample.sourcePort}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
          <span className="text-[10px] text-gray-400 block font-medium">DESTINATION ENDPOINT</span>
          <span className="font-mono font-semibold text-gray-900">
            {sample.destIp}:{sample.destPort}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
          <span className="text-[10px] text-gray-400 block font-medium">PROTOCOL / SERVICE</span>
          <span className="font-semibold text-gray-900">
            {sample.protocol} / {sample.service}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
          <span className="text-[10px] text-gray-400 block font-medium">VOLUME & DURATION</span>
          <span className="font-mono font-semibold text-gray-900">
            {sample.packets} pkts • {sample.bytes.toLocaleString()} B • {sample.duration}s
          </span>
        </div>
      </div>
    </div>
  );

  // Step 2: Normalization
  const renderStep2 = () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-[#007AFF] font-bold text-sm">
        <Layers className="h-4 w-4" />
        <span>Step 2: Flow Normalization & Feature Encoding</span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">
        The raw flow attributes (42 features from the UNSW-NB15 standard) undergo numerical standardization
        (via <code className="text-[#007AFF] bg-blue-50 px-1 py-0.5 rounded">StandardScaler</code>) and categorical
        one-hot projection (protocol, service, and TCP state), preventing high-magnitude byte counters from dominating gradients.
      </p>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-gray-500 pb-1 border-b border-slate-200">
          <span>Continuous Feature Vector &phi;(x) &isin; &reals;<sup>42</sup></span>
          <span className="text-emerald-600 font-semibold">&mu; = 0.0, &sigma; = 1.0 Normalized</span>
        </div>
        <div className="text-gray-700 truncate">
          x = [ {sample.duration.toFixed(3)}, {(sample.bytes / 1000).toFixed(2)}, {(sample.packets / 10).toFixed(2)}, 0.421, 0.819, 0.012, 0.941, 0.128, ... ]
        </div>
      </div>
    </div>
  );

  // Step 3: Multi-View Splicing
  const renderStep3 = () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-[#007AFF] font-bold text-sm">
        <Layers className="h-4 w-4" />
        <span>Step 3: Multi-View Domain Splicing</span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">
        Rather than treating the flow as a flat 1D vector, RoNeTC+ partitions the 42 features into 3 complementary domain views
        structured into 11&times;11 spatial grids. If an attacker spoofs transport headers, the independent IP or payload backbones retain uncorrupted evidence.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
        <div className="p-3 rounded-xl bg-white border border-blue-200">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-gray-900">🌐 IP View</span>
            <span className="text-[10px] font-mono text-[#007AFF] bg-blue-50 px-1.5 py-0.5 rounded">9 Features</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-normal">
            dur, sbytes, dbytes, sttl, dttl, sloss, dloss, sload, dload. Captures volumetric throughput.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white border border-indigo-200">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-gray-900">⚡ Transport View</span>
            <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">7 Features</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-normal">
            sport, dsport, proto, service, state, ct_srv_src, ct_srv_dst. Captures protocol state machines.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white border border-purple-200">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-gray-900">📦 Payload View</span>
            <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">6 Features</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-normal">
            spkts, dpkts, smean, dmean, ct_state_ttl, ct_flw_http_mthd. Captures packet sizing signatures.
          </p>
        </div>
      </div>
    </div>
  );

  // Step 4: Evidence Generation
  const renderStep4 = () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-[#007AFF] font-bold text-sm">
        <Cpu className="h-4 w-4" />
        <span>Step 4: Non-Negative Evidence Generation (Softplus)</span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">
        Each view passes through its CNN/MLP backbone into a non-negative evidence layer:
        <code className="text-[#007AFF] bg-blue-50 px-1.5 py-0.5 rounded mx-1">e_k = ln(1 + exp(z_k))</code>.
        Unlike Softmax, which forces sum-to-one, evidence only accumulates when patterns actively match known training distributions.
      </p>

      <div className="space-y-2 pt-1">
        {["ip", "transport", "payload"].map((viewKey) => {
          const vEv = sample.evidence[viewKey as keyof typeof sample.evidence];
          const topClass = Object.entries(vEv).sort((a, b) => b[1] - a[1])[0];
          const maxVal = Math.max(...Object.values(vEv), 1);

          return (
            <div key={viewKey} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold uppercase tracking-wider text-gray-700">
                  {viewKey === "ip" ? "🌐 IP View Evidence" : viewKey === "transport" ? "⚡ Transport View Evidence" : "📦 Payload View Evidence"}
                </span>
                <span className="font-mono text-gray-500">
                  Peak: <strong className="text-gray-900">{topClass[0]}</strong> (e = {topClass[1].toFixed(2)})
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {Object.entries(vEv).map(([cls, val]) => (
                  <div key={cls} className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>{cls}</span>
                      <span className="font-mono">{val.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#007AFF] transition-all duration-300"
                        style={{ width: `${Math.min(100, (val / maxVal) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Step 5: Dirichlet Opinion
  const renderStep5 = () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-[#007AFF] font-bold text-sm">
        <Scale className="h-4 w-4" />
        <span>Step 5: Subjective Logic & Dirichlet Distribution Modeling</span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">
        Evidence vectors induce a Dirichlet distribution: <code className="text-[#007AFF] bg-blue-50 px-1.5 py-0.5 rounded">&alpha;_k = e_k + 1</code>.
        Belief masses <code className="bg-slate-100 px-1 py-0.5 rounded">b_k = e_k / S</code> and epistemic uncertainty
        <code className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-1">u = K / S</code> satisfy the Subjective Logic axiom:
        <strong> &sum; b_k + u = 1</strong>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <span className="text-[10px] text-gray-400 block font-medium">DIRICHLET STRENGTH (S)</span>
          <span className="text-lg font-extrabold text-gray-900 font-mono">
            {sample.dirichlet.strength.toFixed(2)}
          </span>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            S = &sum; &alpha;_k (Total evidentiary mass)
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <span className="text-[10px] text-gray-400 block font-medium">PRIMARY BELIEF MASS (b_k)</span>
          <span className="text-lg font-extrabold text-[#007AFF] font-mono">
            {(Math.max(...Object.values(sample.dirichlet.belief)) * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            Top allocated probability belief
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <span className="text-[10px] font-bold block text-gray-400">EPISTEMIC UNCERTAINTY (u)</span>
          <span className={`text-lg font-extrabold font-mono ${sample.dirichlet.uncertainty > threshold ? "text-rose-600" : "text-emerald-600"}`}>
            {sample.dirichlet.uncertainty.toFixed(4)}
          </span>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            u = K / S (Second-order vacuity)
          </span>
        </div>
      </div>
    </div>
  );

  // Step 6: Dempster-Shafer Fusion
  const renderStep6 = () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-[#007AFF] font-bold text-sm">
        <GitMerge className="h-4 w-4" />
        <span>Step 6: Dempster-Shafer Conflict-Free Multi-View Fusion</span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">
        The opinions from IP, Transport, and Payload views are fused mathematically using the Dempster-Shafer rule.
        Views with lower uncertainty naturally receive higher weighting. The orthogonal conflict factor
        <code className="text-gray-700 bg-slate-100 px-1 py-0.5 rounded mx-1">C = &sum;_(i&ne;j) b_i^1 &middot; b_j^2</code> measures inter-view disagreement.
      </p>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-2">
        <div className="text-[11px] text-gray-700">
          b_k<sup>(fused)</sup> = [ b_k^1 &middot; b_k^2 + b_k^1 &middot; u^2 + b_k^2 &middot; u^1 ] / (1 - C) &nbsp;&bull;&nbsp; u<sup>(fused)</sup> = (u^1 &middot; u^2) / (1 - C)
        </div>
        <div className="flex items-center space-x-4 pt-1 text-xs border-t border-slate-200">
          <span>Inter-View Conflict C: <strong>{sample.fusion.conflict.toFixed(4)}</strong></span>
          <span>&bull;</span>
          <span>Fused Epistemic Uncertainty u: <strong className={sample.fusion.fusedUncertainty >= threshold ? "text-rose-600" : "text-emerald-600"}>{sample.fusion.fusedUncertainty.toFixed(4)}</strong></span>
        </div>
      </div>
    </div>
  );

  // Step 7: Decision Gate
  const renderStep7 = () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-[#007AFF] font-bold text-sm">
        <Scale className="h-4 w-4" />
        <span>Step 7: Open-Set Decision Gate & Threshold Comparison</span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">
        The fused uncertainty <code className="font-mono font-bold">{fusedU.toFixed(4)}</code> is audited against
        the calibrated Youden index threshold (<code className="font-mono text-[#007AFF]">tau = {threshold.toFixed(4)}</code>).
      </p>

      <div className="p-4 rounded-xl border bg-white shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              FUSED UNCERTAINTY (u) vs THRESHOLD (tau)
            </span>
            <div className="flex items-center space-x-2 font-mono text-base font-extrabold">
              <span className={isRejected ? "text-rose-600" : "text-emerald-600"}>
                {fusedU.toFixed(4)}
              </span>
              <span className="text-gray-400">
                {isRejected ? "&ge;" : "<"}
              </span>
              <span className="text-[#007AFF]">
                {threshold.toFixed(4)}
              </span>
            </div>
          </div>

          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
            isRejected
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}>
            {isRejected ? "UNKNOWN / ZERO-DAY REJECTION" : "KNOWN IN-DISTRIBUTION"}
          </div>
        </div>

        {/* Visual Progress Bar Comparing u vs tau */}
        <div className="space-y-1">
          <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isRejected ? "bg-rose-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(100, (fusedU / 0.8) * 100)}%` }}
            />
            {/* Threshold Pin */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#007AFF] z-10"
              style={{ left: `${(threshold / 0.8) * 100}%` }}
              title={`Decision Threshold tau = ${threshold}`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-mono">
            <span>0.0 (Certain)</span>
            <span className="text-[#007AFF] font-bold">&uarr; tau = {threshold}</span>
            <span>0.80 (Complete Ignorance)</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 8: Outcome
  const renderStep8 = () => {
    if (isUnknownMode || isRejected) {
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
            <ShieldAlert className="h-4 w-4" />
            <span>Step 8: Zero-Day Quarantine & Novel Class Discovery</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Because Dirichlet uncertainty exceeded the decision threshold (<strong>u = {fusedU.toFixed(4)} &ge; {threshold}</strong>),
            NetEvolve securely quarantined the packet flow, generated an automated SOC incident, and extracted its 384-dimensional latent embedding
            into the Novel Class Discovery pool.
          </p>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-800 space-y-1.5">
            <div className="font-bold flex items-center space-x-1.5">
              <span>🚨 Zero-Day Traffic Handled: Quarantine &rarr; Latent Space &rarr; Unsupervised Clustering</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              The model refused to make a false high-confidence guess. The flow is now clustered into novel threat categories
              without disrupting closed-set inference.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-emerald-600 font-bold text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <span>Step 8: Verified Closed-Set Classification & Allow Policy</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Because Dirichlet uncertainty remained well within safe operational limits (<strong>u = {fusedU.toFixed(4)} &lt; {threshold}</strong>),
          NetEvolve confidently classified the flow into known category <strong>{sample.category}</strong> with
          <strong> {(Math.max(...Object.values(sample.fusion.fusedBelief)) * 100).toFixed(1)}% confidence</strong>.
        </p>

        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 space-y-1">
          <div className="font-bold flex items-center space-x-1.5">
            <span>✓ Verified Known Flow: ALLOWED & CLASSIFIED</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            The packet flow was forwarded through the gateway without friction. Historical benchmark accuracy is preserved.
          </p>
        </div>
      </div>
    );
  };

  const stepRenderers = [
    renderStep1,
    renderStep2,
    renderStep3,
    renderStep4,
    renderStep5,
    renderStep6,
    renderStep7,
    renderStep8,
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.04)] space-y-3">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-heading">
          CURRENT PIPELINE STAGE REASONING
        </span>
        <span className="text-xs font-semibold text-[#007AFF] bg-blue-50 px-2 py-0.5 rounded">
          RoNeTC+ Evidential Core
        </span>
      </div>

      {stepRenderers[currentStep - 1]()}
    </div>
  );
}
