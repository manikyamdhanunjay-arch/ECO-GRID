import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Zap,
  Sun,
  Flame,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  TrendingDown,
  Award,
  RefreshCw,
  Clock,
  Radio,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  EnergyHourlyData,
  GridAlertPlan,
  PeakPledge,
  SupportedLanguage,
} from '../types';
import { UI_TRANSLATIONS } from '../data/mockData';
import { fetchGridPeakPlan } from '../services/api';
import { MotionCard, motion } from './motion/MotionTransitions';

interface GridPulseTabProps {
  hourlyData: EnergyHourlyData[];
  pledges: PeakPledge[];
  onTogglePledge: (pledgeId: string) => void;
  language: SupportedLanguage;
  onSimulatePeakSuccess: (plan: GridAlertPlan) => void;
  totalPledgedKw: number;
}

export const GridPulseTab: React.FC<GridPulseTabProps> = ({
  hourlyData,
  pledges,
  onTogglePledge,
  language,
  onSimulatePeakSuccess,
  totalPledgedKw,
}) => {
  const t = UI_TRANSLATIONS[language]?.grid || UI_TRANSLATIONS.en.grid;

  const [isSimulatingSpike, setIsSimulatingSpike] = useState<boolean>(false);
  const [activeAlertPlan, setActiveAlertPlan] = useState<GridAlertPlan | null>(null);
  const [isSpikeActive, setIsSpikeActive] = useState<boolean>(true);

  // Compute live chart data factoring in current pledges
  const chartData = hourlyData.map((item) => {
    const baseDemand = item.demandKw;
    const peakReduction = item.isPeak ? totalPledgedKw : 0;
    const optimized = Math.max(160, baseDemand - peakReduction);

    return {
      ...item,
      demandDisplay: isSpikeActive ? item.demandKw : Math.min(item.demandKw, 420),
      optimizedDemandKw: isSpikeActive ? optimized : Math.min(optimized, 390),
      netLoadKw: Math.max(0, item.demandKw - item.solarKw),
    };
  });

  const currentPeakDemand = Math.max(...chartData.map((d) => d.demandDisplay));
  const currentOptimizedPeak = Math.max(...chartData.map((d) => d.optimizedDemandKw));
  const safeThreshold = 420;
  const isOverloaded = currentOptimizedPeak > safeThreshold;
  const overloadKw = Math.max(0, currentOptimizedPeak - safeThreshold);

  const handleSimulateSpike = async () => {
    setIsSimulatingSpike(true);
    setIsSpikeActive(true);

    const res = await fetchGridPeakPlan({
      currentPeakKw: 485,
      thresholdKw: 420,
      solarKw: 15,
      hourTime: '19:00',
      criticalSubstation: 'Substation Transformer T-04 (Market West)',
    });

    setActiveAlertPlan(res.data);
    onSimulatePeakSuccess(res.data);
    setIsSimulatingSpike(false);
  };

  const handlePledgeClick = (id: string) => {
    onTogglePledge(id);
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#8b5cf6', '#10b981', '#06b6d4', '#f59e0b'],
      });
    } catch (e) {
      // safe fallback
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Spike Simulator with Ultraviolet Mesh */}
      <div className="bg-gradient-to-r from-slate-900 via-violet-950/50 to-slate-900 p-6 sm:p-7 rounded-3xl border border-violet-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-2.5 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Autonomous Microgrid Dispatch & Demand Response</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSimulateSpike}
              disabled={isSimulatingSpike}
              className="flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-950/80 transition-all duration-300 hover:scale-105 cursor-pointer disabled:opacity-50"
            >
              {isSimulatingSpike ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{t.simulatingAlert}</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 text-slate-950" />
                  <span>{t.simulatePeakBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Transformer Health Indicator & Stats with Radiant Speculars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Safe Threshold Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl">
          <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">Safe Grid Capacity Limit</span>
          <div className="mt-1 flex items-baseline gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mr-1" />
            <span className="text-2xl font-black text-white font-mono">420</span>
            <span className="text-xs text-slate-400 font-mono">kW Rating</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Substation Transformer T-04 Limit</span>
        </div>

        {/* Raw Peak Load */}
        <div className="bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl">
          <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">Unmitigated Peak Demand</span>
          <div className="mt-1 flex items-baseline gap-1">
            <Flame className="w-4 h-4 text-orange-400 mr-1" />
            <span className="text-2xl font-black text-orange-400 font-mono">{currentPeakDemand}</span>
            <span className="text-xs text-slate-400 font-mono">kW (19:00)</span>
          </div>
          <span className="text-[10px] text-orange-300/80 mt-1 block font-mono font-semibold">
            +{currentPeakDemand - safeThreshold} kW above safe threshold
          </span>
        </div>

        {/* Community Shaved Load */}
        <div className="bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl">
          <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">Active Community Load Shaved</span>
          <div className="mt-1 flex items-baseline gap-1">
            <TrendingDown className="w-4 h-4 text-emerald-400 mr-1" />
            <span className="text-2xl font-black text-transparent bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text font-mono">
              -{totalPledgedKw}
            </span>
            <span className="text-xs text-slate-400 font-mono">kW Pledged</span>
          </div>
          <span className="text-[10px] text-emerald-400/90 mt-1 block font-mono font-semibold">
            {pledges.filter((p) => p.active).length} of {pledges.length} pledges active
          </span>
        </div>

        {/* Transformer Health State */}
        <div className={`p-5 rounded-3xl border backdrop-blur-xl transition-all duration-500 ${isOverloaded ? 'bg-rose-950/30 border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.25)]' : 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.25)]'}`}>
          <span className="text-[11px] text-slate-300 block font-semibold uppercase tracking-wider">Transformer Operating State</span>
          <div className="mt-1 flex items-center justify-between">
            <span className={`text-base font-black font-mono ${isOverloaded ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isOverloaded ? `OVERLOAD (+${overloadKw} kW)` : 'SECURE & BALANCED'}
            </span>
            <span className="text-xs font-mono font-black text-white">
              {Math.round((currentOptimizedPeak / safeThreshold) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mt-2.5 border border-slate-800">
            <div
              className={`h-full transition-all duration-700 ${
                isOverloaded
                  ? 'bg-gradient-to-r from-rose-500 to-red-600'
                  : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400'
              }`}
              style={{ width: `${Math.min(100, Math.round((currentOptimizedPeak / safeThreshold) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gemini Peak-Shaving AI Advisory Card */}
      {activeAlertPlan && (
        <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-amber-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden animate-fluid-fade">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono">
                  Gemini Energy Dispatch Directive
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {activeAlertPlan.alertTitle}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                {activeAlertPlan.severity} Priority
              </span>
              <span className="text-xs font-mono font-bold text-slate-200 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                Target Shed: {activeAlertPlan.targetShedKw} kW
              </span>
            </div>
          </div>

          <div className="my-4 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-medium flex items-start gap-3 shadow-inner">
            <Radio className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold text-white block text-[11px] uppercase tracking-wider mb-1 font-mono">
                Neighborhood App Push Broadcast:
              </span>
              "{activeAlertPlan.citizenBroadcast}"
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
            {activeAlertPlan.steps.map((step, sIdx) => (
              <div
                key={sIdx}
                className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-black mb-1.5">
                    <span className="text-white">Step {sIdx + 1}: {step.title}</span>
                    <span className="text-emerald-400 font-mono text-xs">
                      -{step.estimatedReductionKw} kW
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recharts 24-Hour Area Chart with Radiant Gradients */}
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>24-Hour Diurnal Demand vs Solar Generation Curve</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Notice the midday solar peak (Duck Curve) and 18:00 - 21:00 evening demand surge when solar drops.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span>Solar Supply</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <span>Raw Demand</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span>Optimized Demand</span>
            </span>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="solarGlowGrad" x1="0%" y1="0%" x2="0%" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="rawDemandGlowGrad" x1="0%" y1="0%" x2="0%" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="optDemandGlowGrad" x1="0%" y1="0%" x2="0%" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                  <stop offset="60%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                unit="kW"
                domain={[0, 520]}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950/95 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-2xl text-xs space-y-1.5">
                        <div className="font-bold text-white border-b border-slate-800 pb-1 mb-1 font-mono">
                          Time: {label} {data.isPeak ? '⚡ [Peak Hours]' : ''}
                        </div>
                        <div className="text-rose-400 font-mono flex justify-between gap-5 font-semibold">
                          <span>Raw Demand:</span>
                          <span>{data.demandDisplay} kW</span>
                        </div>
                        <div className="text-amber-400 font-mono flex justify-between gap-5 font-semibold">
                          <span>Solar Output:</span>
                          <span>{data.solarKw} kW</span>
                        </div>
                        <div className="text-emerald-400 font-mono flex justify-between gap-5 font-black border-t border-slate-800 pt-1">
                          <span>Optimized Demand:</span>
                          <span>{data.optimizedDemandKw} kW</span>
                        </div>
                        <div className="text-slate-400 text-[10px] pt-1 font-mono">
                          Safe Capacity Limit: 420 kW
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <ReferenceLine
                y={420}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: 'Safe Transformer Limit (420 kW)',
                  fill: '#f43f5e',
                  fontSize: 11,
                  position: 'top',
                }}
              />

              <Area
                type="monotone"
                dataKey="solarKw"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#solarGlowGrad)"
                name="Solar Generation"
              />

              <Area
                type="monotone"
                dataKey="demandDisplay"
                stroke="#f43f5e"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#rawDemandGlowGrad)"
                name="Unmitigated Demand"
              />

              <Area
                type="monotone"
                dataKey="optimizedDemandKw"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#optDemandGlowGrad)"
                name="Optimized Net Load"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Load Shifting Pledges Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>{t.activePledgesTitle}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Click any pledge to shift high-power household devices out of the 6 PM - 9 PM peak window.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-1.5 rounded-2xl text-xs text-emerald-300 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Pledges Shaved: <strong className="font-mono text-sm">{totalPledgedKw} kW</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {pledges.map((pledge) => {
            return (
              <MotionCard
                key={pledge.id}
                onClick={() => handlePledgeClick(pledge.id)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                  pledge.active
                    ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-cyan-950/40 border-emerald-400 ring-2 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                      -{pledge.kwReduction} kW Shift
                    </span>
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1 font-mono">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      +{pledge.ecoCredits} Credits
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white">{pledge.title}</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {pledge.description}
                  </p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {pledge.participantsCount} households pledged
                  </span>
                  <div
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all duration-300 ${
                      pledge.active
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {pledge.active ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Pledged Active</span>
                      </>
                    ) : (
                      <span>+ Pledge Load Shift</span>
                    )}
                  </div>
                </div>
              </MotionCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
