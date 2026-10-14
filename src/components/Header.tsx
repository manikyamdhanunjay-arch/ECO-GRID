import React from 'react';
import {
  Zap,
  Leaf,
  Globe2,
  Award,
  Activity,
  ScanLine,
  Flame,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { UI_TRANSLATIONS } from '../data/mockData';

interface HeaderProps {
  activeTab: 'command' | 'scanner' | 'grid' | 'leaderboard';
  setActiveTab: (tab: 'command' | 'scanner' | 'grid' | 'leaderboard') => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  userCredits: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  userCredits,
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-blue-500/25 text-slate-100 shadow-[0_4px_30px_rgba(37,99,235,0.15)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Brand with Fluid Vibrant Blue Gradient */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('command')}
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-400 shadow-[0_0_22px_rgba(37,99,235,0.55)] group-hover:shadow-[0_0_32px_rgba(6,182,212,0.7)] transition-all duration-300 ring-1 ring-white/30 group-hover:scale-105">
              <Leaf className="w-6 h-6 text-slate-950 absolute -rotate-12 translate-x-[-2px] translate-y-[-2px]" />
              <Zap className="w-5 h-5 text-amber-300 absolute z-10 translate-x-[4px] translate-y-[3px]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-white flex items-center">
                  Eco<span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent">Grid</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-gradient-to-r from-blue-500/20 via-sky-500/20 to-indigo-500/20 text-sky-300 border border-blue-400/40 shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping mr-1.5" />
                  Live v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block tracking-wide">
                {t.appTagline}
              </p>
            </div>
          </div>

          {/* Navigation Tabs with Vibrant Active Indicator */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-blue-900/40 backdrop-blur-md shadow-inner">
            <button
              onClick={() => setActiveTab('command')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                activeTab === 'command'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_18px_rgba(37,99,235,0.45)] scale-102'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Activity className="w-4 h-4 text-sky-300" />
              <span>{t.tabs.commandCenter}</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_18px_rgba(37,99,235,0.45)] scale-102'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <ScanLine className="w-4 h-4 text-amber-300" />
              <span>{t.tabs.wasteScanner}</span>
              <span className="text-[10px] bg-amber-400/25 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
                AI
              </span>
            </button>

            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                activeTab === 'grid'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_18px_rgba(37,99,235,0.45)] scale-102'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span>{t.tabs.gridPulse}</span>
              <span className="text-[10px] bg-orange-500/25 text-orange-300 px-1.5 py-0.5 rounded font-mono font-bold">
                24h
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_18px_rgba(37,99,235,0.45)] scale-102'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-cyan-300" />
              <span>{t.tabs.leaderboard}</span>
            </button>
          </nav>

          {/* Right Action: Language & EcoCredits Badge */}
          <div className="flex items-center gap-3">
            {/* Language Selector with Blue Accent Hover */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-xl p-1 text-xs transition-colors">
              <Globe2 className="w-3.5 h-3.5 text-blue-400 ml-1.5 mr-1" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1 py-0.5"
              >
                <option value="en" className="bg-slate-900 text-white">EN (English)</option>
                <option value="hi" className="bg-slate-900 text-white">HI (हिंदी)</option>
                <option value="te" className="bg-slate-900 text-white">TE (తెలుగు)</option>
              </select>
            </div>

            {/* EcoCredits Badge with Radiant Electric Blue Glow */}
            <div
              onClick={() => setActiveTab('leaderboard')}
              className="flex items-center gap-2.5 bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/80 border border-blue-500/40 hover:border-blue-400 px-3.5 py-1.5 rounded-2xl cursor-pointer shadow-[0_0_18px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all duration-300 group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/25 to-indigo-500/25 border border-blue-400/40 flex items-center justify-center text-blue-300 group-hover:scale-110 transition-transform">
                <Award className="w-4 h-4 text-sky-300" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-medium leading-none flex items-center gap-1">
                  EcoCredits
                  <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
                </div>
                <div className="text-sm font-black text-transparent bg-gradient-to-r from-blue-300 via-sky-200 to-cyan-300 bg-clip-text font-mono leading-tight">
                  {userCredits.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Sub-Nav */}
        <div className="flex lg:hidden overflow-x-auto py-2.5 gap-2 scrollbar-none border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('command')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'command'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t.tabs.commandCenter}</span>
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'scanner'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.tabs.wasteScanner}</span>
          </button>
          <button
            onClick={() => setActiveTab('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'grid'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>{t.tabs.gridPulse}</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.tabs.leaderboard}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
