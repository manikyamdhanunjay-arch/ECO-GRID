/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { CommandCenterTab } from './components/CommandCenterTab';
import { WasteScannerTab } from './components/WasteScannerTab';
import { GridPulseTab } from './components/GridPulseTab';
import { CommunityLeaderboard } from './components/CommunityLeaderboard';
import { AnimatePresence, PageTransition } from './components/motion/MotionTransitions';
import {
  DispatchEvent,
  GridAlertPlan,
  LeaderboardEntry,
  MapNode,
  PeakPledge,
  RecipientHub,
  SupportedLanguage,
  WasteScanResult,
} from './types';
import {
  INITIAL_DISPATCH_FEED,
  INITIAL_HOURLY_ENERGY,
  INITIAL_KPIS,
  INITIAL_MAP_NODES,
  INITIAL_PLEDGES,
  LEADERBOARD_ENTRIES,
  UI_TRANSLATIONS,
} from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'command' | 'scanner' | 'grid' | 'leaderboard'>('command');
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  // KPI Metrics State
  const [wasteDivertedKg, setWasteDivertedKg] = useState<number>(INITIAL_KPIS.totalWasteDivertedKg);
  const [mealsRescued, setMealsRescued] = useState<number>(INITIAL_KPIS.mealsRescued);
  const [activeNgoPickups, setActiveNgoPickups] = useState<number>(INITIAL_KPIS.activeNgoPickups);
  const [co2eAvoidedKg, setCo2eAvoidedKg] = useState<number>(INITIAL_KPIS.co2eAvoidedKg);
  const [gridPeakShavedKw, setGridPeakShavedKw] = useState<number>(INITIAL_KPIS.gridPeakShavedKw);

  // User EcoCredits state
  const [userCredits, setUserCredits] = useState<number>(1450);

  // Map & Dispatch Data State
  const [mapNodes, setMapNodes] = useState<MapNode[]>(INITIAL_MAP_NODES);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(INITIAL_MAP_NODES[0]);
  const [dispatchFeed, setDispatchFeed] = useState<DispatchEvent[]>(INITIAL_DISPATCH_FEED);

  // GridPulse State
  const [hourlyEnergy, setHourlyEnergy] = useState(INITIAL_HOURLY_ENERGY);
  const [pledges, setPledges] = useState<PeakPledge[]>(INITIAL_PLEDGES);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(LEADERBOARD_ENTRIES);

  // Compute total pledged kW
  const totalPledgedKw = pledges
    .filter((p) => p.active)
    .reduce((acc, curr) => acc + curr.kwReduction, 0);

  // Handle Dispatch from Scanner or Command Center
  const handleDispatchSuccess = (
    scanResult: WasteScanResult,
    recipient: RecipientHub,
    customTitle: string
  ) => {
    // 1. Update KPIs
    const weight = scanResult.estimatedWeightKg || 25;
    const additionalMeals =
      scanResult.itemCategory === 'surplus_food' ? Math.round(weight * 2.5) : 0;
    const addedCo2 = scanResult.co2SavedKg || 50;

    setWasteDivertedKg((prev) => Math.round(prev + weight));
    if (additionalMeals > 0) {
      setMealsRescued((prev) => prev + additionalMeals);
    }
    setCo2eAvoidedKg((prev) => Math.round(prev + addedCo2));
    setActiveNgoPickups((prev) => prev + 1);
    setUserCredits((prev) => prev + 180);

    // 2. Add New Van to Map Nodes with full real GPS telemetry
    const newVanId = `van-${Date.now()}`;
    const randLat = +(17.4350 + Math.random() * 0.015).toFixed(4);
    const randLng = +(78.3750 + Math.random() * 0.020).toFixed(4);

    const newVanNode: MapNode = {
      id: newVanId,
      name: `Rescue Van (Assigned to ${recipient.name.slice(0, 22)})`,
      type: 'pickup_van',
      sector: 'Market Square',
      x: Math.floor(Math.random() * 30) + 35,
      y: Math.floor(Math.random() * 30) + 35,
      lat: randLat,
      lng: randLng,
      address: `Navigating via Arterial Parkway towards ${recipient.address}`,
      status: `Dispatched to ${recipient.name}`,
      color: 'blue',
      urgency: 'normal',
      driverName: 'Vikram Singh (Rapid EV #09)',
      destination: recipient.name,
      etaMinutes: Math.floor(Math.random() * 6) + 4,
      speedKmH: 32,
      batteryLevel: 94,
      contactPhone: `+91 98450 ${Math.floor(10000 + Math.random() * 90000)}`,
      details: `Dispatched for ${weight} kg of ${scanResult.itemCategory.replace('_', ' ')}. Destination: ${recipient.address}`,
    };

    setMapNodes((prev) => [newVanNode, ...prev]);
    setSelectedNode(newVanNode);

    // 3. Add Live Feed Event
    const newFeedEvent: DispatchEvent = {
      id: `feed-${Date.now()}`,
      timestamp: 'Just now',
      type: 'pickup_dispatched',
      title: `${customTitle} Dispatched`,
      description: `Pickup van en route to ${recipient.name} for ${weight} kg batch.`,
      mealsCount: additionalMeals > 0 ? additionalMeals : undefined,
      co2ImpactKg: addedCo2,
      badge: 'Rapid Dispatch',
    };

    setDispatchFeed((prev) => [newFeedEvent, ...prev]);
  };

  // Direct dispatch action from map node
  const handleDirectMapDispatch = (targetNodeId: string) => {
    const node = mapNodes.find((n) => n.id === targetNodeId);
    if (!node) return;

    setActiveNgoPickups((prev) => prev + 1);
    setWasteDivertedKg((prev) => prev + 28);
    setMealsRescued((prev) => prev + 70);
    setUserCredits((prev) => prev + 120);

    const updatedFeed: DispatchEvent = {
      id: `feed-${Date.now()}`,
      timestamp: 'Just now',
      type: 'pickup_dispatched',
      title: `Express Van Dispatched to ${node.name}`,
      description: `Rapid collection unit assigned for urgent collection window.`,
      mealsCount: 70,
      badge: 'Expedited',
    };

    setDispatchFeed((prev) => [updatedFeed, ...prev]);
  };

  // Toggle Peak Load Shift Pledge
  const handleTogglePledge = (pledgeId: string) => {
    setPledges((prev) =>
      prev.map((p) => {
        if (p.id === pledgeId) {
          const nextActive = !p.active;
          if (nextActive) {
            setUserCredits((c) => c + p.ecoCredits);
            setGridPeakShavedKw((kw) => +(kw + p.kwReduction).toFixed(1));

            // Add to feed
            const pledgeEvent: DispatchEvent = {
              id: `feed-${Date.now()}`,
              timestamp: 'Just now',
              type: 'pledge_activated',
              title: `Pledge Activated: ${p.title}`,
              description: `Shifted -${p.kwReduction} kW off evening peak. Earned +${p.ecoCredits} EcoCredits!`,
              kwImpact: p.kwReduction,
              badge: 'EcoPledge',
            };
            setDispatchFeed((f) => [pledgeEvent, ...f]);
          } else {
            setUserCredits((c) => Math.max(0, c - p.ecoCredits));
            setGridPeakShavedKw((kw) => Math.max(0, +(kw - p.kwReduction).toFixed(1)));
          }
          return { ...p, active: nextActive };
        }
        return p;
      })
    );
  };

  // When Peak Spike Simulation is triggered in GridPulse
  const handleSimulatePeakSuccess = (plan: GridAlertPlan) => {
    const alertEvent: DispatchEvent = {
      id: `feed-${Date.now()}`,
      timestamp: 'Just now',
      type: 'peak_alert',
      title: plan.alertTitle,
      description: plan.citizenBroadcast,
      kwImpact: plan.currentOverloadKw,
      badge: 'Grid Warning',
    };
    setDispatchFeed((prev) => [alertEvent, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-mesh-aurora text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        userCredits={userCredits}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top 5 KPI Cards (Live across all tabs) */}
        <KpiCards
          wasteDivertedKg={wasteDivertedKg}
          mealsRescued={mealsRescued}
          activeNgoPickups={activeNgoPickups}
          co2eAvoidedKg={co2eAvoidedKg}
          gridPeakShavedKw={gridPeakShavedKw}
          language={language}
        />

        {/* Tab Content Views with Fluid Framer Motion Transitions */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === 'command' && (
              <PageTransition tabKey="command">
                <CommandCenterTab
                  nodes={mapNodes}
                  selectedNode={selectedNode}
                  setSelectedNode={setSelectedNode}
                  feed={dispatchFeed}
                  onDispatchVan={handleDirectMapDispatch}
                  language={language}
                  onOpenScanner={() => setActiveTab('scanner')}
                  onOpenGrid={() => setActiveTab('grid')}
                />
              </PageTransition>
            )}

            {activeTab === 'scanner' && (
              <PageTransition tabKey="scanner">
                <WasteScannerTab
                  language={language}
                  onDispatchSuccess={handleDispatchSuccess}
                />
              </PageTransition>
            )}

            {activeTab === 'grid' && (
              <PageTransition tabKey="grid">
                <GridPulseTab
                  hourlyData={hourlyEnergy}
                  pledges={pledges}
                  onTogglePledge={handleTogglePledge}
                  language={language}
                  onSimulatePeakSuccess={handleSimulatePeakSuccess}
                  totalPledgedKw={totalPledgedKw}
                />
              </PageTransition>
            )}

            {activeTab === 'leaderboard' && (
              <PageTransition tabKey="leaderboard">
                <CommunityLeaderboard
                  entries={leaderboard}
                  userCredits={userCredits}
                  language={language}
                  wasteDivertedKg={wasteDivertedKg}
                  mealsRescued={mealsRescued}
                  gridPeakShavedKw={gridPeakShavedKw}
                  co2eAvoidedKg={co2eAvoidedKg}
                />
              </PageTransition>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">EcoGrid</span>
            <span>• Community Micro-Waste & Neighborhood Energy Optimizer</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Powered by Gemini 2.5 Flash Multimodal</span>
            <span>•</span>
            <span>FSSAI & Municipal Zero-Waste Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
