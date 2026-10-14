import React from 'react';
import {
  Download,
  Award,
  Trophy,
  Medal,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  Building,
  Home,
  UtensilsCrossed,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { LeaderboardEntry, SupportedLanguage } from '../types';
import { UI_TRANSLATIONS } from '../data/mockData';
import { MotionCard, motion } from './motion/MotionTransitions';

interface CommunityLeaderboardProps {
  entries: LeaderboardEntry[];
  userCredits: number;
  language: SupportedLanguage;
  wasteDivertedKg: number;
  mealsRescued: number;
  gridPeakShavedKw: number;
  co2eAvoidedKg: number;
}

export const CommunityLeaderboard: React.FC<CommunityLeaderboardProps> = ({
  entries,
  userCredits,
  language,
  wasteDivertedKg,
  mealsRescued,
  gridPeakShavedKw,
  co2eAvoidedKg,
}) => {
  const t = UI_TRANSLATIONS[language]?.leaderboard || UI_TRANSLATIONS.en.leaderboard;

  // Clean, secure CSV generator
  const handleDownloadCsv = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const headers = [
      'Record_ID',
      'Entity_Name',
      'Community_Sector',
      'Resource_Category',
      'Waste_Diverted_Kg',
      'Meals_Rescued_Count',
      'Peak_Shaved_kW',
      'CO2e_Avoided_Kg',
      'EcoCredits_Earned',
      'Audit_Status',
    ];

    const sanitizeCsvCell = (str: any) => {
      const val = String(str ?? '').replace(/"/g, '""');
      return `"${val}"`;
    };

    const rows = entries.map((e, idx) => [
      sanitizeCsvCell(`MUNI-AUDIT-${2026}-${100 + idx}`),
      sanitizeCsvCell(e.name),
      sanitizeCsvCell(e.pockets),
      sanitizeCsvCell('Circular Resource Flow'),
      e.wasteDivertedKg,
      Math.round(e.wasteDivertedKg * 2.5),
      e.peakShavedKw,
      Math.round(e.wasteDivertedKg * 2.5),
      e.ecoCredits,
      sanitizeCsvCell('VERIFIED_COMPLIANT'),
    ]);

    rows.push([
      sanitizeCsvCell('MUNI-TOTAL-SUMMARY'),
      sanitizeCsvCell('Total Neighborhood Aggregate'),
      sanitizeCsvCell('All 5 Micro-Zones'),
      sanitizeCsvCell('Combined Zero-Waste & Energy'),
      wasteDivertedKg,
      mealsRescued,
      gridPeakShavedKw,
      co2eAvoidedKg,
      userCredits,
      sanitizeCsvCell('OFFICIAL_MUNICIPAL_SEAL'),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EcoGrid_Municipal_Audit_Report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner with Download CSV Action & Vibrant Blue Mesh Gradient */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900 p-6 sm:p-7 rounded-3xl border border-blue-500/35 shadow-[0_4px_30px_rgba(37,99,235,0.25)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-sky-300 text-xs font-semibold mb-2.5 shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Municipal Circular Economy & Clean Grid Leaderboard</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-blue-950/80 transition-all duration-300 hover:scale-102 cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            <span>{t.downloadCsv}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Municipal Audit Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MotionCard className="bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/25 to-indigo-500/25 border border-blue-400/40 flex items-center justify-center text-sky-300 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">Compliance Seal</span>
            <span className="text-sm font-semibold text-white">ISO 14001 Circular Ready</span>
            <span className="text-[10px] text-sky-400 block font-mono">Municipal Green Rating: AAA</span>
          </div>
        </MotionCard>

        <MotionCard className="bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/25 to-orange-500/25 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">Community EcoCredits Pool</span>
            <span className="text-sm font-semibold text-amber-300 font-mono tabular-nums">14,940 Points</span>
            <span className="text-[10px] text-amber-400 block font-mono">Redeemable for solar tariffs</span>
          </div>
        </MotionCard>

        <MotionCard className="bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/25 to-violet-500/25 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">Substation Protection</span>
            <span className="text-sm font-semibold text-purple-300 font-mono tabular-nums">{gridPeakShavedKw} kW Shaved</span>
            <span className="text-[10px] text-purple-400 block font-mono">Overheat risk mitigated</span>
          </div>
        </MotionCard>
      </div>

      {/* Leaderboard Table with Specular Rows */}
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-white text-base flex items-center gap-2">
            <Medal className="w-4 h-4 text-amber-400" />
            <span>Top Neighborhood Sustainability Champions</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Audited Realtime • Municipal Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium tracking-wider uppercase text-[10px]">
              <tr>
                <th className="py-4 px-5">{t.rank}</th>
                <th className="py-4 px-5">{t.name}</th>
                <th className="py-4 px-5">Sector</th>
                <th className="py-4 px-5 text-right">{t.wasteDiverted}</th>
                <th className="py-4 px-5 text-right">{t.peakShaved}</th>
                <th className="py-4 px-5 text-right">{t.credits}</th>
                <th className="py-4 px-5 text-center">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {entries.map((entry) => {
                return (
                  <tr
                    key={entry.rank}
                    className="hover:bg-slate-800/40 transition-colors duration-200"
                  >
                    <td className="py-4 px-5 font-mono font-medium">
                      {entry.rank === 1 && (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950 font-bold shadow-md">
                          1
                        </span>
                      )}
                      {entry.rank === 2 && (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white font-bold shadow-md">
                          2
                        </span>
                      )}
                      {entry.rank === 3 && (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 font-bold shadow-md">
                          3
                        </span>
                      )}
                      {entry.rank > 3 && (
                        <span className="text-slate-400 px-2 font-mono">#{entry.rank}</span>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <span className="text-2xl filter drop-shadow">{entry.avatar}</span>
                        <div>
                          <span className="font-semibold text-white block text-sm">
                            {entry.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {entry.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-slate-300">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-medium">
                        {entry.pockets}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right font-mono font-medium text-sky-400 tabular-nums">
                      {entry.wasteDivertedKg.toLocaleString()} kg
                    </td>

                    <td className="py-4 px-5 text-right font-mono font-medium text-violet-400 tabular-nums">
                      {entry.peakShavedKw} kW
                    </td>

                    <td className="py-4 px-5 text-right font-mono font-semibold text-amber-400 tabular-nums">
                      {entry.ecoCredits.toLocaleString()} pts
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className="inline-block text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-400/30 uppercase tracking-wider">
                        {entry.badge}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
