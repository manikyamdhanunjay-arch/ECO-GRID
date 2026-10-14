import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Smartphone,
  Server,
  Zap,
  Recycle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Eye,
  Activity,
  Maximize2,
  X,
  FileText,
  Clock,
  Radio,
  QrCode,
  Gauge,
  Sparkles,
} from 'lucide-react';

interface DeploymentStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentStrategyModal: React.FC<DeploymentStrategyModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'virtualization' | 'matrix' | 'telemetry' | 'roadmap'>('overview');
  const [districtHomes, setDistrictHomes] = useState<number>(2500);
  const [copiedAscii, setCopiedAscii] = useState<boolean>(false);
  const [selectedPhase, setSelectedPhase] = useState<1 | 2 | 3>(1);

  const asciiRoadmap = `MONTH 0 ─────── MONTH 3 ────────────── MONTH 8 ──────────────── MONTH 18
  │                │                      │                       │
  ▼                ▼                      ▼                       ▼
┌──────────────────┐  ┌───────────────────┐  ┌────────────────────┐
│     PHASE 1      │  │      PHASE 2      │  │      PHASE 3       │
│  Zero-Hardware   │  │ High-Impact Hubs  │  │  Full Integration  │
│  Digital Twin    │  │  Surgical CapEx   │  │   Autonomous CPS   │
└──────────────────┘  └───────────────────┘  └────────────────────┘
  CapEx: $0              CapEx: ~$12,500         CapEx: Funded by OpEx`;

  const copyAsciiToClipboard = () => {
    navigator.clipboard.writeText(asciiRoadmap);
    setCopiedAscii(true);
    setTimeout(() => setCopiedAscii(false), 2500);
  };

  if (!isOpen) return null;

  // Dynamic CapEx comparison calculation
  const traditionalCost = districtHomes * 180 + 30 * 4500 + 45000; // Smart meters + 30 truck cameras + SCADA
  const ecoGridPhase1Cost = 0;
  const ecoGridPhase2Cost = 12500; // Substation CTs, 2 Hub vision docks, Top 10 meters, LoRaWAN
  const savingsAmount = traditionalCost - ecoGridPhase2Cost;
  const savingsPercent = Math.round((savingsAmount / traditionalCost) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-blue-500/40 rounded-3xl shadow-[0_0_60px_rgba(37,99,235,0.25)] flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-900/40 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">Cyber-Physical Systems (CPS) Architecture</h2>
                <span className="text-[10px] font-mono font-medium tracking-wide px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                  CapEx Minimization Blueprint
                </span>
              </div>
              <p className="text-xs text-slate-400">
                EcoGrid Phased IoT Rollout: Virtualization-First, Asymmetric Pareto Choke Points & Low-Cost Telemetry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-950/40 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'overview', label: 'CapEx ROI & Timeline', icon: DollarSign },
            { id: 'virtualization', label: '1. Virtualization & Twin', icon: Database },
            { id: 'matrix', label: '2. Progressive Priority Matrix', icon: Layers },
            { id: 'telemetry', label: '3. Low-Cost / Passive Telemetry', icon: Smartphone },
            { id: 'roadmap', label: '4. Actionable 3-Phase Roadmap', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
          
          {/* SECTION: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              
              {/* INTERACTIVE ASCII / TIMELINE ARCHITECTURE BANNER */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-900 border border-blue-500/40 shadow-lg shadow-blue-950/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono text-xs uppercase tracking-wider text-cyan-300 font-bold">
                      CPS Chronological Deployment Trajectory (Months 0–18)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyAsciiToClipboard}
                      className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-blue-950 border border-blue-600/40 hover:bg-blue-900/60 text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy ASCII architecture timeline"
                    >
                      {copiedAscii ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Copy ASCII Roadmap</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveSection('roadmap')}
                      className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-indigo-950 border border-indigo-600/40 hover:bg-indigo-900/60 text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Deep Dive Roadmap</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* ASCII Diagram Code block */}
                <div className="p-4 bg-slate-950/90 rounded-xl border border-blue-900/40 font-mono text-xs text-cyan-300 leading-snug overflow-x-auto select-all shadow-inner">
                  <pre className="tracking-tight text-[11px] sm:text-xs">
{asciiRoadmap}
                  </pre>
                </div>

                {/* Interactive Clickable Phase Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {/* Phase 1 Interactive Card */}
                  <div
                    onClick={() => { setSelectedPhase(1); setActiveSection('roadmap'); }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                      selectedPhase === 1
                        ? 'bg-blue-950/50 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900/70 border-slate-800 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-cyan-400 font-bold">MONTH 0 ➔ 3</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-bold">
                        CapEx: $0
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                      PHASE 1: Zero-Hardware Digital Twin
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Virtualize 90% of energy and waste with municipal billing, route logs & driver smartphone GPS.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-cyan-300">
                      <span>Explore 4 Milestones</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Phase 2 Interactive Card */}
                  <div
                    onClick={() => { setSelectedPhase(2); setActiveSection('roadmap'); }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                      selectedPhase === 2
                        ? 'bg-indigo-950/50 border-indigo-400/80 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-slate-900/70 border-slate-800 hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-indigo-400 font-bold">MONTH 3 ➔ 8</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800 font-bold">
                        CapEx: ~$12.5k
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                      PHASE 2: High-Impact Hubs Surgical CapEx
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Instrument 4 substation feeders, 2 central sorting dock vision stations, and Top 10 commercial anchors.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-indigo-300">
                      <span>Explore 5 Milestones</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Phase 3 Interactive Card */}
                  <div
                    onClick={() => { setSelectedPhase(3); setActiveSection('roadmap'); }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                      selectedPhase === 3
                        ? 'bg-sky-950/50 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                        : 'bg-slate-900/70 border-slate-800 hover:border-sky-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-sky-400 font-bold">MONTH 8 ➔ 18</span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-bold">
                        Funded by OpEx
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm group-hover:text-sky-300 transition-colors">
                      PHASE 3: Full Integration Autonomous CPS
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      OpenADR 2.0b demand response, automated HVAC setbacks, LoRaWAN mesh & community battery storage.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-sky-300">
                      <span>Explore 5 Milestones</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlight Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider font-mono">
                    <Sparkles className="w-4 h-4" />
                    Asymmetric Pareto Strategy (80/20 Rule)
                  </div>
                  <h3 className="text-xl font-black text-white">97.8% CapEx Reduction vs Blanket Industrial IoT</h3>
                  <p className="text-xs text-slate-300 max-w-xl">
                    By virtualizing 75% of asset telemetry from municipal billing and route manifests, and sensorizing only 10 strategic choke points, EcoGrid unlocks immediate operational intelligence at zero Day-1 hardware cost.
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-3 rounded-2xl border border-blue-500/30 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">CapEx Savings</div>
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                      {savingsPercent}%
                    </div>
                  </div>
                  <div className="h-9 w-px bg-slate-800" />
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Upfront CapEx</div>
                    <div className="text-xl font-black text-emerald-400">$0</div>
                  </div>
                </div>
              </div>

              {/* Dynamic Interactive Calculator */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-cyan-400" />
                      Interactive District CapEx Comparison Simulator
                    </h4>
                    <p className="text-xs text-slate-400">
                      Adjust district scale to observe capital expenditure divergence.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">District Households:</span>
                    <input
                      type="range"
                      min={500}
                      max={10000}
                      step={500}
                      value={districtHomes}
                      onChange={(e) => setDistrictHomes(Number(e.target.value))}
                      className="w-32 accent-blue-500 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-cyan-300 text-xs w-16 text-right">
                      {districtHomes.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Traditional Blanket IoT */}
                  <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wide">Traditional Blanket IoT</span>
                      <span className="text-xs font-mono text-red-300">Procurement Heavy</span>
                    </div>
                    <div className="text-2xl font-black text-red-200">${traditionalCost.toLocaleString()}</div>
                    <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                      <li>{districtHomes.toLocaleString()} Household Smart Meters ($180 ea)</li>
                      <li>30 Truck Vision & Dynamic Weigh Scales ($4,500 ea)</li>
                      <li>Proprietary SCADA Modems & Multi-year Cellular SIMs</li>
                      <li>High maintenance battery liability & stranded assets</li>
                    </ul>
                  </div>

                  {/* EcoGrid Phased Rollout */}
                  <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/40 space-y-2 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">EcoGrid Phased Approach</span>
                      <span className="text-xs font-mono text-emerald-400 font-black">Recommended</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-cyan-300">${ecoGridPhase2Cost.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 font-mono">(Phase 1 is $0)</span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                      <li>Phase 1: 100% Virtualized Digital Twin (Municipal bills + GIS)</li>
                      <li>Phase 2: 4 Substation CTs + 2 Central NGO Hub Vision Scales</li>
                      <li>Zero truck hardware: Driver Smartphone PWA + QR Proof-of-Custody</li>
                      <li>Net CapEx Savings: <strong className="text-emerald-400 font-mono">${savingsAmount.toLocaleString()}</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Core Tenets Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">1. Virtualization First</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Derive high-fidelity 15-minute synthetic interval energy profiles and waste yields from historical utility statements and cadastral footprints before purchasing a single wire.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">2. Choke Point Sensors</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Instrumenting 2 central sorting docks and 4 substation feeders captures 80% of urban flows at 2% of the sensor count of edge-level deployment.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">3. Smartphone as a Sensor</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Replace $800 commercial telematics boxes with driver smartphone PWAs, QR-code cryptographic custody handovers, and open-source ESP32 telemetry.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: VIRTUALIZATION */}
          {activeSection === 'virtualization' && (
            <div className="space-y-6">
              <div className="border border-blue-500/30 bg-blue-950/20 p-5 rounded-2xl">
                <h3 className="text-base font-black text-white flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  Virtual Digital Twin Engine: Zero-Hardware Pattern Synthesis
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Before investing in physical meters, EcoGrid disaggregates monthly utility billing aggregates, municipal weighbridge manifests, building spatial geometry, and commercial food registries into dynamic 15-minute operational telemetry.
                </p>
              </div>

              {/* Data Ingestion Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  {
                    title: '1. Utility Ingestion',
                    desc: 'Monthly aggregate kWh, peak demand (kW), TOU tariff rates, and power factor history.',
                    badge: 'Utility Billing CSV',
                  },
                  {
                    title: '2. MSW Route Logs',
                    desc: 'Landfill weighbridge scale slips, truck route logs, tipping receipts, and seasonal pickup variance.',
                    badge: 'Sanitation Manifests',
                  },
                  {
                    title: '3. Spatial Footprints',
                    desc: 'GIS cadastral parcels, gross floor area (GSF), construction age, and thermal mass envelopes.',
                    badge: 'City GIS Shapefiles',
                  },
                  {
                    title: '4. Commercial Registry',
                    desc: 'Catering permits, banquet seating capacities, restaurant density, and cold-storage square footage.',
                    badge: 'Commercial Licenses',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/40 text-sky-300 font-bold border border-blue-800">
                      {item.badge}
                    </span>
                    <h5 className="font-bold text-white text-xs mt-1">{item.title}</h5>
                    <p className="text-[11px] text-slate-400 leading-normal">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Mathematical Formulation Showcase */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                  Disaggregation Formulation (Energy & Waste)
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-sky-300 leading-relaxed overflow-x-auto">
                  <code>
                    P_i(t) = P_baseload,i + α_i · CDD(t) + β_i · HDD(t) + γ_i(t) · OccArchetype(t, Zoning_i) · Area_i
                  </code>
                </div>
                <p className="text-xs font-sans text-slate-400">
                  Where <strong className="text-slate-200">CDD/HDD</strong> are cooling/heating degree days computed from open-source weather telemetry, <strong className="text-slate-200">γ_i(t)</strong> is the building typology load shape factor, and <strong className="text-slate-200">OccArchetype</strong> disaggregates commercial vs residential occupancy peaks.
                </p>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-cyan-300 leading-relaxed overflow-x-auto">
                  <code>
                    W_k(t) = Σ [ μ_j · Capacity_j · EventFactor_j(t) ] + Σ [ ω · Occupants_m · Seasonality(t) ]
                  </code>
                </div>
                <p className="text-xs font-sans text-slate-400">
                  Predicts localized food waste and recyclable yield per block with a 95% Bayesian Confidence Interval. Dispatch vans trigger pickup routes only when the volume lower-bound exceeds 20kg, guaranteeing zero wasted fuel trips.
                </p>
              </div>
            </div>
          )}

          {/* SECTION: HARDWARE PRIORITY MATRIX */}
          {activeSection === 'matrix' && (
            <div className="space-y-6">
              <div className="border border-indigo-500/30 bg-indigo-950/20 p-5 rounded-2xl">
                <h3 className="text-base font-black text-white flex items-center gap-2 mb-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Surgical Choke Points: Hardware Prioritization Matrix
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Never deploy hardware uniformly. EcoGrid enforces an asymmetric priority matrix where every dollar of hardware expenditure must monitor at least 50x the throughput of an individual endpoint sensor.
                </p>
              </div>

              {/* Priority Matrix Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                      <th className="p-3.5">Asset Tier</th>
                      <th className="p-3.5">Target Location</th>
                      <th className="p-3.5">Hardware Solution</th>
                      <th className="p-3.5">CapEx / Unit</th>
                      <th className="p-3.5">Throughput Coverage</th>
                      <th className="p-3.5">Priority Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    <tr className="bg-blue-950/20">
                      <td className="p-3.5 font-bold font-mono text-cyan-400">Tier 1 (Crucial)</td>
                      <td className="p-3.5 font-semibold text-white">Substation Feeders</td>
                      <td className="p-3.5 text-slate-300">3-Phase Rogowski CT Loggers on 415V secondary</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">$450</td>
                      <td className="p-3.5 text-slate-300">1,500 homes / sensor</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 font-bold font-mono text-[10px]">Deploy Month 4</span></td>
                    </tr>
                    <tr className="bg-blue-950/20">
                      <td className="p-3.5 font-bold font-mono text-cyan-400">Tier 1 (Crucial)</td>
                      <td className="p-3.5 font-semibold text-white">NGO Sorting Docks</td>
                      <td className="p-3.5 text-slate-300">Overhead 4K Camera + Industrial Floor Bench Scale</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">$650</td>
                      <td className="p-3.5 text-slate-300">5–10 tonnes waste / day</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 font-bold font-mono text-[10px]">Deploy Month 5</span></td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold font-mono text-sky-400">Tier 2 (High-Value)</td>
                      <td className="p-3.5 font-semibold text-white">Top 5% Commercial Anchors</td>
                      <td className="p-3.5 text-slate-300">Smart Sub-meter on banquet halls & supermarkets</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">$280</td>
                      <td className="p-3.5 text-slate-300">40% of district peak demand</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-indigo-500/20 text-sky-300 font-bold font-mono text-[10px]">Deploy Month 6</span></td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold font-mono text-slate-400">Tier 2 (Low-Cost)</td>
                      <td className="p-3.5 font-semibold text-white">Collection Fleet Vans</td>
                      <td className="p-3.5 text-slate-300">Driver Smartphone PWA + Bluetooth OBD-II Dongle</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">$25</td>
                      <td className="p-3.5 text-slate-300">Full Real-Time Fleet Tracking</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Day 1 Software</span></td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold font-mono text-slate-500">Tier 3 (Passive)</td>
                      <td className="p-3.5 font-semibold text-white">Individual Donor Bins</td>
                      <td className="p-3.5 text-slate-300">Weatherproof Laser-etched QR / NFC plates</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">$0.40</td>
                      <td className="p-3.5 text-slate-300">Handover Proof of Custody</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Continuous</span></td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold font-mono text-amber-500">Tier 4 (Deferred)</td>
                      <td className="p-3.5 font-semibold text-white">Residential Homes</td>
                      <td className="p-3.5 text-slate-400">Postponed — virtualized from substation feeder</td>
                      <td className="p-3.5 font-mono text-slate-500">$0 (Save $180)</td>
                      <td className="p-3.5 text-slate-400">1 household / meter</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono text-[10px]">Deferred to Phase 3</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Case Study Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Direct Comparison: Central Sorting Vision vs. Individual Truck Cameras
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 space-y-1">
                    <div className="font-bold text-red-300">30 Individual Truck Sensor Kits</div>
                    <div className="text-slate-400">30 vehicles × $4,500 = <strong className="text-red-200 font-mono">$135,000 CapEx</strong></div>
                    <div className="text-slate-400">High road vibration, daily washdown water damage, 30 cellular SIM contracts.</div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                    <div className="font-bold text-emerald-300">2 Central Receiving Dock Vision Systems</div>
                    <div className="text-slate-400">2 docks × $1,200 = <strong className="text-emerald-200 font-mono">$2,400 CapEx</strong></div>
                    <div className="text-slate-400">Zero vibration, indoor climate-controlled, Ethernet connected, inspects 100% of material.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: LOW-COST TELEMETRY */}
          {activeSection === 'telemetry' && (
            <div className="space-y-6">
              <div className="border border-cyan-500/30 bg-cyan-950/20 p-5 rounded-2xl">
                <h3 className="text-base font-black text-white flex items-center gap-2 mb-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  Low-Cost & Passive Telemetry Alternatives
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Avoid proprietary industrial telemetry lock-in. EcoGrid harnesses drivers' smartphones, passive NFC/QR tokens, and open-source maker-grade hardware.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Smartphone PWA */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-cyan-400 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                      $0 Hardware
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Smartphone-as-a-Sensor PWA</h4>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
                    <li><strong className="text-slate-200">HTML5 Geolocation</strong> with Kalman filtering streams real-time GPS coordinates.</li>
                    <li><strong className="text-slate-200">Battery API Aware</strong>: Automatically throttles polling when geofence-stationary to preserve driver battery.</li>
                    <li><strong className="text-slate-200">Gemini Camera Compression</strong>: Client-side WebP compression sends lightweight scans directly to Gemini Vision.</li>
                  </ul>
                </div>

                {/* Passive QR/NFC */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                      $0.40 / tag
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Passive QR / NFC Geo-Proof</h4>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>Laser-etched aluminium QR plates on food donor crates and municipal dumpsters.</li>
                    <li>Zero electronics, zero batteries, waterproof, and heat resistant.</li>
                    <li><strong className="text-slate-200">Cryptographic Geo-Proof</strong>: Driver scan validates driver phone GPS against donor cadastral polygon.</li>
                  </ul>
                </div>

                {/* Open-Source LoRaWAN & ESP32 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Radio className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-800 font-bold">
                      $38 vs $1,400
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Open-Source CTs & LoRaWAN</h4>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
                    <li><strong className="text-slate-200">ESP32 + SCT-013 CT Clamps</strong>: $38 open-hardware power meter vs $1,400 industrial meter.</li>
                    <li><strong className="text-slate-200">Single LoRaWAN Gateway ($250)</strong> covers a 5km radius with zero per-device monthly cellular SIM fees.</li>
                    <li>JSN-SR04T waterproof ultrasonic bin depth sensor ($16 BOM).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: ROADMAP & MILESTONES */}
          {activeSection === 'roadmap' && (
            <div className="space-y-6">
              <div className="border border-blue-500/30 bg-blue-950/20 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2 mb-1">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    Actionable 3-Phase Deployment Roadmap
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Chronological rollout: Zero-CapEx virtualization (M0-M3) ➔ High-Impact Hubs (M3-M8) ➔ Autonomous CPS (M8-M18).
                  </p>
                </div>
                <button
                  onClick={copyAsciiToClipboard}
                  className="px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-900 border border-blue-500/40 hover:bg-blue-950 text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copiedAscii ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied Timeline!</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span>Copy ASCII Schema</span>
                    </>
                  )}
                </button>
              </div>

              {/* ASCII Diagram Code block */}
              <div className="p-4 bg-slate-950/90 rounded-2xl border border-blue-900/40 font-mono text-xs text-cyan-300 leading-snug overflow-x-auto select-all shadow-inner">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 font-mono">
                  Master CPS Rollout Gantt Schema:
                </div>
                <pre className="tracking-tight text-[11px] sm:text-xs">
{asciiRoadmap}
                </pre>
              </div>

              {/* Phase Quick Filter Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
                <button
                  onClick={() => setSelectedPhase(0 as any)}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                    selectedPhase === (0 as any)
                      ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-sm shadow-blue-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  View All Phases (Months 0–18)
                </button>
                <button
                  onClick={() => setSelectedPhase(1)}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                    selectedPhase === 1
                      ? 'bg-cyan-600 text-white border-cyan-400 font-bold shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Phase 1 • Months 0–3 ($0 CapEx)
                </button>
                <button
                  onClick={() => setSelectedPhase(2)}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                    selectedPhase === 2
                      ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-sm shadow-indigo-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Phase 2 • Months 3–8 (~$12,500)
                </button>
                <button
                  onClick={() => setSelectedPhase(3)}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                    selectedPhase === 3
                      ? 'bg-sky-600 text-white border-sky-400 font-bold shadow-sm shadow-sky-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Phase 3 • Months 8–18 (Funded by OpEx)
                </button>
              </div>

              {/* Timeline Cards */}
              <div className="space-y-4">
                {/* Phase 1 */}
                {(selectedPhase === (0 as any) || selectedPhase === 1) && (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-blue-500/40 relative overflow-hidden transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                          Phase 1: Months 0 ➔ 3
                        </span>
                        <h4 className="text-base font-bold text-white">Zero-Hardware Digital Twin & Crowd-Telemetry</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-lg text-xs font-mono font-bold">
                          CapEx: $0 (100% Software)
                        </span>
                        <span className="px-2.5 py-1 bg-blue-950/80 text-cyan-300 border border-blue-800/60 rounded-lg text-xs font-mono font-semibold">
                          Coverage: 75% Virtualized
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      Build the complete cyber-physical simulation and launch citizen/driver apps without purchasing or deploying a single physical sensor.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M1.1 (Month 0–1):</strong> Ingest 12–24 months municipal billing, cadastral GIS polygons, and transfer scale receipts into PostgreSQL.
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M1.2 (Month 1–2):</strong> Calibrate 15-minute synthetic interval energy profiles and block-level food surplus distributions (R² &gt; 0.84 target).
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M1.3 (Month 2):</strong> Deploy Driver PWA using HTML5 smartphone GPS tracking, background dispatch websockets, and Gemini vision scanner.
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M1.4 (Month 3):</strong> Onboard initial 50 commercial food donors with laser-etched QR proof-of-custody plates ($0.40/unit).
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                      <span className="text-cyan-300">Phase 1 Gate: Synthetic profile R² &gt; 0.84 & 50 active donor touchpoints</span>
                      <span className="text-emerald-400 font-bold">Unlocks Phase 2 Approval</span>
                    </div>
                  </div>
                )}

                {/* Phase 2 */}
                {(selectedPhase === (0 as any) || selectedPhase === 2) && (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/40 relative overflow-hidden transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
                          Phase 2: Months 3 ➔ 8
                        </span>
                        <h4 className="text-base font-bold text-white">High-Impact Hubs & Surgical CapEx Instrumentation</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 rounded-lg text-xs font-mono font-bold">
                          CapEx: ~$12,500 (16 High-Value Hubs)
                        </span>
                        <span className="px-2.5 py-1 bg-blue-950/80 text-cyan-300 border border-blue-800/60 rounded-lg text-xs font-mono font-semibold">
                          Coverage: 92% Physical Grounded
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      Sensorize centralized choke points where one hardware deployment monitors 50x–100x the throughput of individual residential edge meters.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M2.1 (Month 4):</strong> Deploy 4x 3-phase split-core Rogowski CT meters at primary 415V secondary substation feeders ($1,800 total).
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M2.2 (Month 5):</strong> Install 2x Automated Receiving Vision Stations & bench scales at NGO sorting hubs ($1,500 total).
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M2.3 (Month 6):</strong> Sub-meter Top 10 Commercial Energy Consumers (banquet halls & supermarket refrigeration, $2,800 total).
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M2.4 (Month 7):</strong> Mount 1x long-range Outdoor LoRaWAN Gateway (868/915 MHz) covering 5km radius with zero monthly SIM fees.
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 sm:col-span-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M2.5 (Month 8):</strong> Continuous Bayesian calibration: Ground truth from 16 choke points updates Bayesian prior weights, reducing error to ±3.5%.
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                      <span className="text-indigo-300">Phase 2 Gate: Choke point streaming latency &lt; 2.5s & calibrated error &lt; 4%</span>
                      <span className="text-cyan-300 font-bold">Unlocks Phase 3 Closed Loop</span>
                    </div>
                  </div>
                )}

                {/* Phase 3 */}
                {(selectedPhase === (0 as any) || selectedPhase === 3) && (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/40 relative overflow-hidden transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                          Phase 3: Months 8 ➔ 18
                        </span>
                        <h4 className="text-base font-bold text-white">Full Integration & Autonomous Cyber-Physical Systems (CPS)</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-mono font-bold">
                          CapEx: Funded by OpEx Savings
                        </span>
                        <span className="px-2.5 py-1 bg-blue-950/80 text-cyan-300 border border-blue-800/60 rounded-lg text-xs font-mono font-semibold">
                          Coverage: 99% Autonomous Closed-Loop
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      Scale automated actuation, dynamic demand response contracts with electric utilities, and micro-storage—funded 100% by documented energy peak-shaving and landfill avoidance.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M3.1 (Month 10):</strong> Automated OpenADR 2.0b integration with electric distribution utility for automated peak-shaving cash settlement.
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M3.2 (Month 12):</strong> Smart contactor switchgear & thermostat setbacks for commercial partners during red grid alerts.
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M3.3 (Month 14):</strong> Open-source LoRaWAN ultrasonic bin sensors on top 50 high-volume commercial dumpsters ($16 BOM).
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M3.4 (Month 16):</strong> Deploy pilot 50kWh Community Battery (BESS) at distribution substation buffer charged via solar surplus.
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 sm:col-span-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-white font-mono">M3.5 (Month 18):</strong> Full Autonomous Closed-Loop: System autonomously dispatches rescue vans based on predictive surplus food curves and dynamic grid headroom.
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                      <span className="text-cyan-300">Phase 3 Gate: Autonomous closed-loop operation with zero manual dispatch interventions</span>
                      <span className="text-emerald-400 font-bold">100% Self-Funded</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Documented in full detail in <code className="text-cyan-300 font-mono">/DEPLOYMENT_STRATEGY.md</code></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const nextSection =
                  activeSection === 'overview'
                    ? 'virtualization'
                    : activeSection === 'virtualization'
                    ? 'matrix'
                    : activeSection === 'matrix'
                    ? 'telemetry'
                    : activeSection === 'telemetry'
                    ? 'roadmap'
                    : 'overview';
                setActiveSection(nextSection);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Next Section</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
