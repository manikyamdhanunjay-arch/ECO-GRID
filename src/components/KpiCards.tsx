import React from 'react';
import {
  Recycle,
  UtensilsCrossed,
  Truck,
  CloudFog,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { UI_TRANSLATIONS } from '../data/mockData';
import { motion } from './motion/MotionTransitions';

interface KpiCardsProps {
  wasteDivertedKg: number;
  mealsRescued: number;
  activeNgoPickups: number;
  co2eAvoidedKg: number;
  gridPeakShavedKw: number;
  language: SupportedLanguage;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  wasteDivertedKg,
  mealsRescued,
  activeNgoPickups,
  co2eAvoidedKg,
  gridPeakShavedKw,
  language,
}) => {
  const t = UI_TRANSLATIONS[language]?.kpi || UI_TRANSLATIONS.en.kpi;

  const cards = [
    {
      id: 'waste',
      title: t.wasteDiverted,
      value: `${wasteDivertedKg.toLocaleString()} kg`,
      subtext: '+14% weekly surge',
      trend: 'up',
      icon: Recycle,
      iconColor: 'text-emerald-300',
      iconBg: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30',
      gradient: 'from-emerald-950/70 via-slate-900/90 to-teal-950/50',
      border: 'border-emerald-500/30 hover:border-emerald-400/60',
      shadow: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]',
      valColor: 'from-emerald-300 to-teal-200',
    },
    {
      id: 'meals',
      title: t.mealsRescued,
      value: `${mealsRescued.toLocaleString()}`,
      subtext: '48 shelters served',
      trend: 'up',
      icon: UtensilsCrossed,
      iconColor: 'text-amber-300',
      iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400/30',
      gradient: 'from-amber-950/70 via-slate-900/90 to-orange-950/50',
      border: 'border-amber-500/30 hover:border-amber-400/60',
      shadow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]',
      valColor: 'from-amber-300 to-orange-200',
    },
    {
      id: 'pickups',
      title: t.activePickups,
      value: `${activeNgoPickups}`,
      subtext: 'EV & Hybrid Fleet',
      trend: 'live',
      icon: Truck,
      iconColor: 'text-cyan-300',
      iconBg: 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/30',
      gradient: 'from-cyan-950/70 via-slate-900/90 to-sky-950/50',
      border: 'border-cyan-500/30 hover:border-cyan-400/60',
      shadow: 'hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]',
      valColor: 'from-cyan-300 to-blue-200',
    },
    {
      id: 'co2',
      title: t.co2Avoided,
      value: `${(co2eAvoidedKg / 1000).toFixed(2)} t`,
      subtext: `${co2eAvoidedKg.toLocaleString()} kg net CO2e`,
      trend: 'up',
      icon: CloudFog,
      iconColor: 'text-teal-300',
      iconBg: 'bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border-teal-400/30',
      gradient: 'from-teal-950/70 via-slate-900/90 to-emerald-950/50',
      border: 'border-teal-500/30 hover:border-teal-400/60',
      shadow: 'hover:shadow-[0_0_25px_rgba(20,184,166,0.25)]',
      valColor: 'from-teal-300 to-emerald-200',
    },
    {
      id: 'grid',
      title: t.peakShaved,
      value: `${gridPeakShavedKw.toFixed(1)} kW`,
      subtext: 'Substation safe',
      trend: 'up',
      icon: Zap,
      iconColor: 'text-violet-300',
      iconBg: 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-violet-400/30',
      gradient: 'from-violet-950/70 via-slate-900/90 to-purple-950/50',
      border: 'border-violet-500/30 hover:border-violet-400/60',
      shadow: 'hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]',
      valColor: 'from-violet-300 to-purple-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 my-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 340,
              damping: 24,
              delay: idx * 0.05,
            }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} border ${card.border} p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all duration-300 ${card.shadow} group`}
          >
            {/* Ambient specular highlight */}
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 rounded-full bg-white/5 blur-xl group-hover:bg-white/10 transition-colors pointer-events-none" />

            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-semibold text-slate-400 line-clamp-1 tracking-wide">
                {card.title}
              </span>
              <div
                className={`p-2 rounded-xl border ${card.iconBg} ${card.iconColor} shadow-inner transition-transform duration-300 group-hover:scale-110`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 relative z-10">
              <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight text-transparent bg-gradient-to-r ${card.valColor} bg-clip-text`}>
                {card.value}
              </span>
            </div>

            <div className="mt-2.5 flex items-center text-[11px] text-slate-400 relative z-10">
              {card.trend === 'live' ? (
                <span className="inline-flex items-center text-cyan-400 font-bold mr-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping mr-1" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center text-emerald-400 font-bold mr-1.5">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  Realtime
                </span>
              )}
              <span className="truncate text-slate-400 font-medium">{card.subtext}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
