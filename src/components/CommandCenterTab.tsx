import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Clock,
  Truck,
  Zap,
  Recycle,
  UtensilsCrossed,
  Filter,
  Radio,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Info,
  ExternalLink,
  PlusCircle,
  Activity,
  Layers,
  Compass,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  Eye,
  EyeOff,
  Search,
  BatteryCharging,
  Gauge,
  Phone,
  Crosshair,
  Sun,
  AlertTriangle,
  RotateCcw,
  Route,
  CheckCircle2,
} from 'lucide-react';
import { DispatchEvent, MapNode, SupportedLanguage } from '../types';
import { UI_TRANSLATIONS } from '../data/mockData';
import {
  MotionRadarSweep,
  MotionAnimatedPath,
  MotionBeacon,
  MotionCard,
  StaggerContainer,
  StaggerItem,
  motion,
} from './motion/MotionTransitions';
import { RealtimeLeafletMap } from './RealtimeLeafletMap';

interface CommandCenterTabProps {
  nodes: MapNode[];
  selectedNode: MapNode | null;
  setSelectedNode: (node: MapNode | null) => void;
  feed: DispatchEvent[];
  onDispatchVan: (targetNodeId: string) => void;
  language: SupportedLanguage;
  onOpenScanner: () => void;
  onOpenGrid: () => void;
}

interface LiveVanTelemetry {
  x: number;
  y: number;
  bearing: number;
  speed: number;
  progress: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  targetName: string;
}

export const CommandCenterTab: React.FC<CommandCenterTabProps> = ({
  nodes,
  selectedNode,
  setSelectedNode,
  feed,
  onDispatchVan,
  language,
  onOpenScanner,
  onOpenGrid,
}) => {
  const t = UI_TRANSLATIONS[language]?.map || UI_TRANSLATIONS.en.map;

  // Map Filter & View Controls
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [simulatedMinutes, setSimulatedMinutes] = useState(0);
  const [mapMode, setMapMode] = useState<'carto' | 'vector'>('carto');
  const [activeFollowVanId, setActiveFollowVanId] = useState<string | null>(null);

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layer Visibility Toggles
  const [showPowerLines, setShowPowerLines] = useState<boolean>(true);
  const [showVanRoutes, setShowVanRoutes] = useState<boolean>(true);
  const [showSolarHeatmap, setShowSolarHeatmap] = useState<boolean>(true);
  const [showStreetGrid, setShowStreetGrid] = useState<boolean>(true);

  // Pin Drop Reporting Mode
  const [isDropPinMode, setIsDropPinMode] = useState<boolean>(false);
  const [hoveredCoord, setHoveredCoord] = useState<{ lat: number; lng: number; x: number; y: number } | null>(null);
  const [pinDropModalCoord, setPinDropModalCoord] = useState<{ x: number; y: number; lat: number; lng: number } | null>(null);
  const [pinReportTitle, setPinReportTitle] = useState<string>('');
  const [pinReportCategory, setPinReportCategory] = useState<'surplus_food' | 'grid_spike'>('surplus_food');

  // Dynamic moving vehicle positions (Real-time GPS simulation with calculated dynamic paths)
  const [liveVanPositions, setLiveVanPositions] = useState<{ [vanId: string]: LiveVanTelemetry }>({
    'van-01': {
      x: 38,
      y: 42,
      bearing: 45,
      speed: 34,
      progress: 0.35,
      originX: 38,
      originY: 42,
      targetX: 32,
      targetY: 28,
      targetName: 'Grand Orchid Banquet Hall',
    },
    'van-02': {
      x: 50,
      y: 45,
      bearing: 120,
      speed: 28,
      progress: 0.65,
      originX: 50,
      originY: 45,
      targetX: 68,
      targetY: 22,
      targetName: 'Metro Wholesale Supermart',
    },
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Countdown timer periodic update
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedMinutes((prev) => prev + 1);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Vehicle Motion Engine: interpolate vehicles along routes and recalculate dynamic paths
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveVanPositions((prev) => {
        const next: { [vanId: string]: LiveVanTelemetry } = { ...prev };
        const vanNodes = nodes.filter((n) => n.type === 'pickup_van');

        vanNodes.forEach((van) => {
          let current = next[van.id];

          // Initialize van telemetry if newly added or not tracked yet
          if (!current) {
            // Find destination node in current nodes
            const destNode = nodes.find(
              (n) =>
                n.name === van.destination ||
                (van.details && van.details.includes(n.name)) ||
                (n.type === 'food_alert' && n.id !== van.id)
            );
            const origX = van.routeWaypoints?.[0]?.x ?? (van.x > 50 ? 50 : 38);
            const origY = van.routeWaypoints?.[0]?.y ?? (van.y > 50 ? 45 : 42);
            const targetX = destNode ? destNode.x : van.x;
            const targetY = destNode ? destNode.y : van.y;

            current = {
              x: van.x,
              y: van.y,
              bearing: 45,
              speed: van.speedKmH || 32,
              progress: 0.15,
              originX: origX,
              originY: origY,
              targetX: targetX,
              targetY: targetY,
              targetName: van.destination || destNode?.name || 'Assigned Sector',
            };
          }

          // Advance progress smoothly (loops naturally or bounces)
          const newProg = (current.progress + 0.016) % 1;

          // Realistic curved route interpolation through intermediate street coordinates
          const origX = current.originX;
          const origY = current.originY;
          const targetX = current.targetX;
          const targetY = current.targetY;

          // Midpoint street detour to simulate navigating road network
          const midX = (origX + targetX) / 2 + (origX > targetX ? 4 : -4);
          const midY = (origY + targetY) / 2 + (origY > targetY ? -5 : 5);

          // Quadratic Bezier interpolation: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
          const tVal = newProg;
          const oneMinusT = 1 - tVal;
          const curX =
            oneMinusT * oneMinusT * origX +
            2 * oneMinusT * tVal * midX +
            tVal * tVal * targetX;
          const curY =
            oneMinusT * oneMinusT * origY +
            2 * oneMinusT * tVal * midY +
            tVal * tVal * targetY;

          // Derivative for accurate vehicle bearing angle
          const dx = 2 * oneMinusT * (midX - origX) + 2 * tVal * (targetX - midX);
          const dy = 2 * oneMinusT * (midY - origY) + 2 * tVal * (targetY - midY);
          const angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));

          // Vary speed dynamically based on cornering and traffic
          const speedVariance = Math.floor(Math.sin(Date.now() / 2500 + curX) * 5);
          const curSpeed = Math.max(22, Math.min(42, (van.speedKmH || 30) + speedVariance));

          next[van.id] = {
            ...current,
            x: +curX.toFixed(2),
            y: +curY.toFixed(2),
            bearing: angle,
            speed: curSpeed,
            progress: newProg,
          };
        });

        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [nodes]);

  // Dynamic SVG Path Calculation Helper for Van Route Following
  const calculateVanPaths = (van: MapNode) => {
    const telemetry = liveVanPositions[van.id] || {
      x: van.x,
      y: van.y,
      originX: van.x > 50 ? 50 : 38,
      originY: van.y > 50 ? 45 : 42,
      targetX: van.x,
      targetY: van.y,
      progress: 0.5,
    };

    // Convert map percentage coordinates (0..100) to SVG coordinates (0..600 x 0..500)
    const toSvg = (x: number, y: number) => ({
      x: (x / 100) * 600,
      y: (y / 100) * 500,
    });

    const origSvg = toSvg(telemetry.originX, telemetry.originY);
    const curSvg = toSvg(telemetry.x, telemetry.y);
    const destSvg = toSvg(telemetry.targetX, telemetry.targetY);

    // Intermediate control points that follow street curvature
    const trailCtrlX = (origSvg.x + curSvg.x) / 2 + (origSvg.x > curSvg.x ? 18 : -18);
    const trailCtrlY = (origSvg.y + curSvg.y) / 2 + (origSvg.y > curSvg.y ? -18 : 18);

    const fwdCtrlX = (curSvg.x + destSvg.x) / 2 + (curSvg.x > destSvg.x ? 18 : -18);
    const fwdCtrlY = (curSvg.y + destSvg.y) / 2 + (curSvg.y > destSvg.y ? -18 : 18);

    // 1. Trail path (already traversed from origin to current vehicle position)
    const trailPathD = `M ${origSvg.x} ${origSvg.y} Q ${trailCtrlX} ${trailCtrlY} ${curSvg.x} ${curSvg.y}`;

    // 2. Forward guidance path (from current vehicle position to target destination)
    const forwardPathD = `M ${curSvg.x} ${curSvg.y} Q ${fwdCtrlX} ${fwdCtrlY} ${destSvg.x} ${destSvg.y}`;

    return {
      origSvg,
      curSvg,
      destSvg,
      trailPathD,
      forwardPathD,
      progress: telemetry.progress,
    };
  };

  // Filtered nodes based on user filter chips and sector
  const filteredNodes = nodes.filter((node) => {
    if (filterType === 'food' && node.type !== 'food_alert') return false;
    if (filterType === 'hubs' && node.type !== 'recycling_hub') return false;
    if (filterType === 'vans' && node.type !== 'pickup_van') return false;
    if (filterType === 'grid' && node.type !== 'transformer') return false;
    if (selectedSector !== 'all' && node.sector !== selectedSector) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = node.name.toLowerCase().includes(q);
      const matchDetails = node.details.toLowerCase().includes(q);
      const matchAddress = node.address?.toLowerCase().includes(q);
      if (!matchName && !matchDetails && !matchAddress) return false;
    }
    return true;
  });

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.4, +(z + 0.35).toFixed(2)));
  const handleZoomOut = () => {
    setZoomLevel((z) => {
      const next = Math.max(1, +(z - 0.35).toFixed(2));
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Center camera onto vehicle when tracking
  const handleCenterOnVan = (vanId: string) => {
    setMapMode('carto');
    setActiveFollowVanId(vanId);
    const pos = liveVanPositions[vanId];
    if (pos) {
      setZoomLevel(1.5);
      // Center on van coordinate
      setPanOffset({
        x: (50 - pos.x) * 4,
        y: (50 - pos.y) * 4,
      });
    }
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDropPinMode) return;
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Coordinate tracking for realism
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * 100;
      const relY = ((e.clientY - rect.top) / rect.height) * 100;
      const simulatedLat = +(17.445 - (relY / 100) * 0.03).toFixed(4);
      const simulatedLng = +(78.37 + (relX / 100) * 0.045).toFixed(4);
      setHoveredCoord({ lat: simulatedLat, lng: simulatedLng, x: +relX.toFixed(1), y: +relY.toFixed(1) });
    }

    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    // Limit pan bounds
    const maxPan = (zoomLevel - 1) * 220;
    setPanOffset({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY)),
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Handle map click for Drop Pin mode
  const handleMapClick = (e: React.MouseEvent) => {
    if (!isDropPinMode || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    const relY = ((e.clientY - rect.top) / rect.height) * 100;
    const lat = +(17.445 - (relY / 100) * 0.03).toFixed(4);
    const lng = +(78.37 + (relX / 100) * 0.045).toFixed(4);
    setPinDropModalCoord({ x: +relX.toFixed(1), y: +relY.toFixed(1), lat, lng });
  };

  const getNodeColorClass = (color: string) => {
    switch (color) {
      case 'amber':
        return {
          bg: 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.6)]',
          ring: 'ring-amber-400/50',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'emerald':
        return {
          bg: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500',
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.6)]',
          ring: 'ring-emerald-400/50',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'blue':
        return {
          bg: 'bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600',
          glow: 'shadow-[0_0_20px_rgba(6,182,212,0.6)]',
          ring: 'ring-cyan-400/50',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        };
      case 'purple':
        return {
          bg: 'bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600',
          glow: 'shadow-[0_0_20px_rgba(139,92,246,0.6)]',
          ring: 'ring-violet-400/50',
          badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500',
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.6)]',
          ring: 'ring-emerald-400/50',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
    }
  };

  const vanNodes = nodes.filter((n) => n.type === 'pickup_van');

  return (
    <div className="space-y-6">
      {/* Top Map Control Bar */}
      <div className="bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mr-1 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            Layers:
          </span>
          {[
            { id: 'all', label: t.filterAll, icon: Layers, count: nodes.length },
            {
              id: 'food',
              label: t.filterFood,
              icon: UtensilsCrossed,
              count: nodes.filter((n) => n.type === 'food_alert').length,
              color: 'text-amber-400',
            },
            {
              id: 'hubs',
              label: t.filterHubs,
              icon: Recycle,
              count: nodes.filter((n) => n.type === 'recycling_hub').length,
              color: 'text-emerald-400',
            },
            {
              id: 'vans',
              label: t.filterVans,
              icon: Truck,
              count: vanNodes.length,
              color: 'text-cyan-400',
            },
            {
              id: 'grid',
              label: t.filterGrid,
              icon: Zap,
              count: nodes.filter((n) => n.type === 'transformer').length,
              color: 'text-violet-400',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/35 font-black ring-1 ring-blue-400/50'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color || 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white font-bold' : 'bg-slate-800 text-slate-300'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sector and Search inputs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sector Selector */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 font-medium"
          >
            <option value="all">{t.sectorAll}</option>
            <option value="Market Square">Market Square (Commercial)</option>
            <option value="Green Valley">Green Valley (Residential)</option>
            <option value="Tech Corridor">Tech Corridor (Corporate)</option>
            <option value="North Hills">North Hills (Residential)</option>
            <option value="Solar Park">Solar Park (Microgrid Intertie)</option>
          </select>

          {/* Quick Node Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search hubs, vans, food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 w-44 sm:w-56 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 placeholder:text-slate-500 font-medium"
            />
          </div>

          {/* Drop Pin Report Button */}
          <button
            onClick={() => setIsDropPinMode(!isDropPinMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isDropPinMode
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-950/60 ring-2 ring-rose-400'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white hover:border-blue-500/50'
            }`}
          >
            <Crosshair className={`w-3.5 h-3.5 ${isDropPinMode ? 'animate-spin' : 'text-blue-400'}`} />
            <span>{isDropPinMode ? 'Click Map to Report' : 'Drop Pin Report'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map & Dispatch Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Geospatial Vector Canvas Map */}
        <div className="lg:col-span-2 bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          {/* Map Header with Real-time GPS & Layer Toggles */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/15 rounded-xl border border-blue-500/30 text-blue-400">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                  <span>{t.liveMapTitle}</span>
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-sky-300 bg-blue-500/20 border border-blue-400/40 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    LIVE GPS ROUTE STREAM
                  </span>
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
                  <span>Sector Grid: 17.438° N, 78.384° E</span>
                  <span>•</span>
                  <span>Active Vans: {vanNodes.length} units in motion</span>
                </div>
              </div>
            </div>

            {/* Mode Switcher: CARTO Voyager (Tile API) vs Blueprint Vector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setMapMode('carto')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  mapMode === 'carto'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>CARTO Voyager</span>
              </button>
              <button
                onClick={() => setMapMode('vector')}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  mapMode === 'vector'
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Blueprint
              </button>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setShowStreetGrid(!showStreetGrid)}
                title="Toggle Street Network"
                className={`px-2 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  showStreetGrid ? 'bg-slate-800 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Roads
              </button>
              <button
                onClick={() => setShowVanRoutes(!showVanRoutes)}
                title="Toggle Van Transit Paths"
                className={`px-2 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  showVanRoutes ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Van Routes
              </button>
              <button
                onClick={() => setShowPowerLines(!showPowerLines)}
                title="Toggle Grid Feeder Circuits"
                className={`px-2 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  showPowerLines ? 'bg-violet-950/70 text-violet-300 border border-violet-500/40' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Grid Bus
              </button>
              <button
                onClick={() => setShowSolarHeatmap(!showSolarHeatmap)}
                title="Toggle Rooftop Solar Insolation"
                className={`px-2 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  showSolarHeatmap ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Solar Heat
              </button>
            </div>
          </div>

          {/* Map Body: CARTO Voyager Realtime Leaflet Map OR Vector Blueprint */}
          {mapMode === 'carto' ? (
            <div className="my-3 min-h-[440px] sm:min-h-[500px] flex-1 flex flex-col">
              <RealtimeLeafletMap
                nodes={nodes}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                filterType={filterType}
                selectedSector={selectedSector}
                searchQuery={searchQuery}
                showPowerLines={showPowerLines}
                showVanRoutes={showVanRoutes}
                showSolarHeatmap={showSolarHeatmap}
                isDropPinMode={isDropPinMode}
                onDropPinAtCoord={(coord) => {
                  setPinDropModalCoord({
                    x: coord.x,
                    y: coord.y,
                    lat: coord.lat,
                    lng: coord.lng,
                  });
                }}
                onCenterOnVan={handleCenterOnVan}
                activeFollowVanId={activeFollowVanId}
                setActiveFollowVanId={setActiveFollowVanId}
              />
            </div>
          ) : (
            /* Interactive SVG Canvas Area */
            <div
              ref={mapContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={handleMapClick}
              className={`relative w-full h-[440px] sm:h-[500px] my-3 rounded-3xl bg-slate-950/90 border border-slate-800/80 overflow-hidden shadow-inner select-none ${
                isDropPinMode ? 'cursor-crosshair' : zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
              }`}
            >
            {/* Transform container for pan/zoom */}
            <div
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                transformOrigin: '50% 50%',
                transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="w-full h-full relative"
            >
              {/* Radar Sweep Animation */}
              <MotionRadarSweep />

              {/* Detailed Realistic Urban Layout SVG */}
              <svg
                viewBox="0 0 600 500"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Grid Feeder Pulse Gradient */}
                  <linearGradient id="cyberFeederGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                  </linearGradient>

                  {/* Water Canal Gradient */}
                  <linearGradient id="canalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0369a1" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.15" />
                  </linearGradient>
                </defs>

                {/* 1. Green Valley Natural Waterway / Canal */}
                <path
                  d="M 0 320 C 120 310, 180 380, 260 360 C 340 340, 420 440, 600 420 L 600 500 L 0 500 Z"
                  fill="url(#canalGrad)"
                  stroke="#0284c7"
                  strokeWidth="1.2"
                  strokeOpacity="0.4"
                />

                {/* 2. Realistic Street Grid & Arterial Road Network */}
                {showStreetGrid && (
                  <g opacity="0.45">
                    {/* Main Ring Expressway (Highway 44 Loop) */}
                    <path
                      d="M 60 40 C 220 20, 440 20, 540 80 C 620 140, 640 320, 520 420 C 420 500, 140 480, 60 400 C -10 320, -10 100, 60 40 Z"
                      stroke="#334155"
                      strokeWidth="6"
                      fill="none"
                    />
                    <path
                      d="M 60 40 C 220 20, 440 20, 540 80 C 620 140, 640 320, 520 420 C 420 500, 140 480, 60 400 C -10 320, -10 100, 60 40 Z"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      strokeDasharray="4,6"
                      fill="none"
                      opacity="0.6"
                    />

                    {/* Central Commercial Boulevard (Market Cross) */}
                    <line x1="40" y1="240" x2="560" y2="240" stroke="#334155" strokeWidth="4" />
                    <line x1="40" y1="240" x2="560" y2="240" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="6,4" opacity="0.5" />

                    {/* North-South Tech Corridor Avenue */}
                    <line x1="440" y1="30" x2="440" y2="450" stroke="#334155" strokeWidth="4" />
                    <line x1="440" y1="30" x2="440" y2="450" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="6,4" opacity="0.5" />

                    {/* Green Valley Feeder Street */}
                    <line x1="200" y1="50" x2="200" y2="450" stroke="#1e293b" strokeWidth="2.5" />
                    <line x1="100" y1="140" x2="500" y2="140" stroke="#1e293b" strokeWidth="2" />
                    <line x1="120" y1="340" x2="520" y2="340" stroke="#1e293b" strokeWidth="2" />

                    {/* Neighborhood Secondary Streets */}
                    <line x1="280" y1="70" x2="280" y2="300" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="2,2" />
                    <line x1="360" y1="180" x2="360" y2="420" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="2,2" />
                  </g>
                )}

                {/* 3. Solar Generation Heatmap Zones (Translucent yellow/gold clusters) */}
                {showSolarHeatmap && (
                  <g opacity="0.25">
                    {/* Solar Park Dense Cluster */}
                    <circle cx="52%" cy="86%" r="65" fill="#f59e0b" filter="blur(25px)" />
                    {/* Tech Park Rooftop Solar */}
                    <circle cx="78%" cy="70%" r="55" fill="#eab308" filter="blur(20px)" />
                    {/* North Hills Residential Solar */}
                    <circle cx="68%" cy="24%" r="45" fill="#f59e0b" filter="blur(20px)" />
                  </g>
                )}

                {/* 4. Power Grid High-Voltage Feeder Circuits with Reusable Motion Paths */}
                {showPowerLines && (
                  <g>
                    {/* Main Substation Circuit Feed with Motion animated dash flow */}
                    <MotionAnimatedPath
                      d="M 480 260 L 330 140 L 260 250 L 530 410"
                      strokeColor="#8b5cf6"
                      strokeWidth={2.5}
                      dashArray="8,6"
                      speedSeconds={1.8}
                    />
                    <MotionAnimatedPath
                      d="M 260 250 L 200 350 L 520 420"
                      strokeColor="#06b6d4"
                      strokeWidth={1.8}
                      dashArray="5,5"
                      speedSeconds={2.4}
                    />

                    {/* Active load wattage markers */}
                    <text x="375" y="195" fill="#c084fc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      ⚡ 472 kW [OVERLOAD]
                    </text>
                    <text x="350" y="340" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      ⚡ 272 kW [NORMAL]
                    </text>
                  </g>
                )}

                {/* 5. Dynamically Calculated SVG Paths for 'pickup_van' Nodes (Path-Following Effect) */}
                {showVanRoutes && (
                  <g id="dynamic-van-routes">
                    {vanNodes.map((van) => {
                      const { trailPathD, forwardPathD, destSvg } = calculateVanPaths(van);
                      const isSelected = selectedNode?.id === van.id;

                      return (
                        <g key={`van-dynamic-path-${van.id}`}>
                          {/* Trailed Path: Faded cyan line showing route already traversed */}
                          <path
                            d={trailPathD}
                            stroke={isSelected ? '#38bdf8' : '#0284c7'}
                            strokeWidth={isSelected ? 3 : 2}
                            strokeDasharray="4,4"
                            strokeOpacity={isSelected ? 0.8 : 0.45}
                            fill="none"
                            strokeLinecap="round"
                          />

                          {/* Dynamic Forward Guidance Path: Reusable Motion path with flowing dashes */}
                          <MotionAnimatedPath
                            d={forwardPathD}
                            strokeColor={isSelected ? '#38bdf8' : '#0ea5e9'}
                            strokeWidth={isSelected ? 3.5 : 2.5}
                            dashArray="6,4"
                            speedSeconds={1.4}
                            glow={isSelected}
                          />

                          {/* Pulsing Beacon at Target Destination Location */}
                          <MotionBeacon
                            cx={destSvg.x}
                            cy={destSvg.y}
                            color={isSelected ? '#38bdf8' : '#f59e0b'}
                          />
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* District Sector Watermark Typography */}
                <text x="14%" y="14%" fill="#475569" fontSize="9" fontWeight="bold" letterSpacing="1.5">NORTH RESIDENTIAL HILLS</text>
                <text x="68%" y="13%" fill="#475569" fontSize="9" fontWeight="bold" letterSpacing="1.5">COMMERCIAL MARKET SQUARE</text>
                <text x="12%" y="88%" fill="#475569" fontSize="9" fontWeight="bold" letterSpacing="1.5">GREEN VALLEY COMPOST PARK</text>
                <text x="64%" y="90%" fill="#475569" fontSize="9" fontWeight="bold" letterSpacing="1.5">TECH CORRIDOR & SOLAR CO-OP</text>
              </svg>

              {/* Dynamic Interactive Nodes */}
              {filteredNodes.map((node) => {
                const colors = getNodeColorClass(node.color);
                const isSelected = selectedNode?.id === node.id;
                const remainingMin = Math.max(0, (node.countdownMinutes || 0) - simulatedMinutes);

                // Use dynamic live position for vans
                const isVan = node.type === 'pickup_van';
                const vanTelemetry = isVan ? liveVanPositions[node.id] : null;
                const dynamicPos = vanTelemetry
                  ? { x: vanTelemetry.x, y: vanTelemetry.y }
                  : { x: node.x, y: node.y };

                return (
                  <div
                    key={node.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                    style={{ left: `${dynamicPos.x}%`, top: `${dynamicPos.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 transition-transform duration-300 ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                    }`}
                  >
                    {/* Fluid Bioluminescent Aura */}
                    <span
                      className={`absolute -inset-3 rounded-full opacity-60 animate-ping ${colors.bg}`}
                    />

                    {/* Node Icon Circle */}
                    <div
                      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${colors.bg} ${colors.glow} text-slate-950 flex items-center justify-center font-bold ring-4 ${
                        isSelected ? 'ring-white shadow-[0_0_25px_rgba(255,255,255,0.7)]' : colors.ring
                      } border border-white/60 transition-all duration-300`}
                    >
                      {node.type === 'food_alert' && <UtensilsCrossed className="w-4 h-4 text-slate-950 drop-shadow" />}
                      {node.type === 'recycling_hub' && <Recycle className="w-4 h-4 text-slate-950 drop-shadow" />}
                      {node.type === 'pickup_van' && <Truck className="w-4 h-4 text-slate-950 drop-shadow" />}
                      {node.type === 'transformer' && <Zap className="w-4 h-4 text-slate-950 drop-shadow" />}

                      {/* Directional Heading Arrow for Moving Vans */}
                      {isVan && vanTelemetry && (
                        <div
                          style={{ transform: `rotate(${vanTelemetry.bearing}deg)` }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border border-slate-950 flex items-center justify-center shadow-lg pointer-events-none"
                        >
                          <Navigation className="w-2.5 h-2.5 text-slate-950 fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Floating Hologram Label */}
                    <div
                      className={`absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[10px] shadow-2xl pointer-events-none transition-all duration-300 ${
                        isSelected
                          ? 'opacity-100 ring-1 ring-emerald-400 translate-y-0'
                          : 'opacity-80 group-hover:opacity-100 group-hover:translate-y-[-2px]'
                      }`}
                    >
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{node.name.length > 22 ? node.name.slice(0, 22) + '...' : node.name}</span>
                      </div>

                      {node.type === 'food_alert' && (
                        <div className="text-amber-400 font-mono text-[9px] font-bold flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{Math.floor(remainingMin / 60)}h {remainingMin % 60}m window</span>
                        </div>
                      )}

                      {node.type === 'transformer' && (
                        <div className={`font-mono text-[9px] font-bold flex items-center gap-1 mt-0.5 ${node.loadPercent && node.loadPercent > 100 ? 'text-rose-400 font-black' : 'text-emerald-400'}`}>
                          <Zap className="w-2.5 h-2.5" />
                          <span>{node.currentLoadKw} kW ({node.loadPercent}%)</span>
                        </div>
                      )}

                      {node.type === 'pickup_van' && (
                        <div className="text-cyan-400 font-mono text-[9px] font-bold flex items-center gap-1.5 mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <Gauge className="w-2.5 h-2.5" />
                            {vanTelemetry?.speed || node.speedKmH || 30} km/h
                          </span>
                          <span>•</span>
                          <span>ETA {Math.max(1, Math.ceil((1 - (vanTelemetry?.progress || 0.4)) * (node.etaMinutes || 6)))}m</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Hover Coordinate Readout HUD */}
            {hoveredCoord && (
              <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-blue-900/40 text-[10px] font-mono text-slate-300 flex items-center gap-2 shadow-xl">
                <Crosshair className="w-3 h-3 text-cyan-400" />
                <span>GPS: {hoveredCoord.lat}° N, {hoveredCoord.lng}° E</span>
                <span className="text-slate-600">|</span>
                <span className="text-amber-400">Solar: 340 W/m²</span>
              </div>
            )}

            {/* Map Canvas Floating HUD Controls (Zoom In, Zoom Out, Reset, Center Van) */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-xl">
              {selectedNode?.type === 'pickup_van' && (
                <button
                  onClick={() => handleCenterOnVan(selectedNode.id)}
                  title="Track Vehicle"
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-sky-200 bg-blue-950/80 border border-blue-500/50 hover:bg-blue-900/90 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Route className="w-3.5 h-3.5" />
                  <span>Follow Van</span>
                </button>
              )}
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetView}
                title="Reset Map Center"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono font-bold text-cyan-400 px-2">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>
          </div>
          )}

          {/* Map Footer Legend with Live Telemetry Tickers */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                <span className="font-medium">{t.legendAmber}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="font-medium">{t.legendGreen}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                <span className="font-medium">{t.legendBlue}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-400 to-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                <span className="font-medium">{t.legendPurple}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Solar: 340 W/m²</span>
              </span>
              <span>•</span>
              <span>Substation Grid: 50.1 Hz</span>
            </div>
          </div>
        </div>

        {/* Sidebar: Detailed Selected Node Diagnostics + Live Feed */}
        <div className="space-y-6">
          {/* Node Inspection Drawer with Full Telemetry */}
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 p-5 shadow-2xl transition-all">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">
                  {t.selectedNode}
                </h3>
              </div>
              {selectedNode && (
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getNodeColorClass(selectedNode.color).badge}`}>
                  {selectedNode.sector}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    {selectedNode.name}
                  </h4>
                  {selectedNode.address && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="truncate">{selectedNode.address}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {selectedNode.details}
                  </p>
                </div>

                {/* Real-time GPS & Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Coordinates</span>
                    <span className="text-white font-mono font-bold text-xs mt-1 block truncate">
                      {selectedNode.lat ? `${selectedNode.lat}°N, ${selectedNode.lng}°E` : '17.4418°N, 78.3812°E'}
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Operational Metric</span>
                    <span className="text-sky-300 font-mono font-bold text-xs mt-1 block truncate">
                      {selectedNode.itemsCount || `${selectedNode.currentLoadKw} kW / ${selectedNode.capacityKw} kW`}
                    </span>
                  </div>
                </div>

                {selectedNode.contactPhone && (
                  <div className="flex items-center justify-between bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      <span>Direct Hotline:</span>
                    </span>
                    <span className="font-mono text-slate-200 font-semibold">{selectedNode.contactPhone}</span>
                  </div>
                )}

                {/* Specific Node Type Controls */}
                {selectedNode.type === 'food_alert' && (
                  <div className="bg-gradient-to-br from-amber-950/40 to-orange-950/20 border border-amber-500/40 rounded-2xl p-4 text-xs shadow-lg">
                    <div className="flex items-center justify-between text-amber-300 font-bold mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Remaining Edible Window:
                      </span>
                      <span className="font-mono text-sm">
                        {Math.floor(Math.max(0, (selectedNode.countdownMinutes || 0) - simulatedMinutes) / 60)}h{' '}
                        {Math.max(0, (selectedNode.countdownMinutes || 0) - simulatedMinutes) % 60}m
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      Cold storage transfer required before ambient thermal degradation occurs.
                    </p>
                    <button
                      onClick={() => onDispatchVan(selectedNode.id)}
                      className="mt-3.5 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/60 transition-all duration-300 hover:scale-102 cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>{t.dispatchNow}</span>
                    </button>
                  </div>
                )}

                {selectedNode.type === 'transformer' && (
                  <div className="bg-gradient-to-br from-violet-950/40 to-purple-950/20 border border-violet-500/40 rounded-2xl p-4 text-xs shadow-lg">
                    <div className="flex items-center justify-between text-violet-300 font-bold mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-violet-400" />
                        Transformer Load Factor:
                      </span>
                      <span className="font-mono text-sm">{selectedNode.loadPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden my-2 border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          (selectedNode.loadPercent || 0) > 100 ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-violet-400 to-purple-500'
                        }`}
                        style={{ width: `${Math.min(100, selectedNode.loadPercent || 60)}%` }}
                      />
                    </div>
                    <button
                      onClick={onOpenGrid}
                      className="mt-3 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/60 transition-all duration-300 hover:scale-102 cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Open Peak Shaving Plan</span>
                    </button>
                  </div>
                )}

                {selectedNode.type === 'pickup_van' && (
                  <div className="bg-gradient-to-br from-blue-950/50 via-slate-900 to-cyan-950/40 border border-blue-500/40 rounded-2xl p-4 text-xs shadow-lg space-y-2.5">
                    <div className="flex items-center justify-between text-sky-300 font-bold">
                      <span>Assigned Driver:</span>
                      <span className="text-white font-semibold">{selectedNode.driverName || 'Ramesh K. (EV Unit)'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sky-300 font-bold">
                      <span>Destination:</span>
                      <span className="text-white font-semibold truncate max-w-[150px]">{selectedNode.destination || 'Grand Orchid Banquet'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800 text-[11px]">
                      <span className="flex items-center gap-1">
                        <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" />
                        Battery: {selectedNode.batteryLevel || 84}%
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Gauge className="w-3.5 h-3.5 text-sky-400" />
                        Speed: {liveVanPositions[selectedNode.id]?.speed || selectedNode.speedKmH || 30} km/h
                      </span>
                    </div>
                    <button
                      onClick={() => handleCenterOnVan(selectedNode.id)}
                      className="mt-2 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/60 transition-all duration-300 hover:scale-102 cursor-pointer"
                    >
                      <Route className="w-3.5 h-3.5" />
                      <span>Center Camera on Van Route</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-400" />
                Select any location on the map to inspect live GPS telemetry, remaining shelf life, or dispatch food rescue vans.
              </div>
            )}
          </div>

          {/* Live AI Dispatch Feed */}
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">
                  {t.liveFeed}
                </h3>
              </div>
              <span className="flex items-center text-[10px] text-sky-300 font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse mr-1.5" />
                REALTIME GPS STREAM
              </span>
            </div>

            <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {feed.map((event) => (
                <div
                  key={event.id}
                  className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all duration-300 text-xs shadow-md"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white flex items-center gap-2">
                      {event.type === 'pickup_dispatched' && <Truck className="w-3.5 h-3.5 text-cyan-400" />}
                      {event.type === 'food_rescued' && <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />}
                      {event.type === 'peak_alert' && <Zap className="w-3.5 h-3.5 text-violet-400" />}
                      {event.type === 'pledge_activated' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                      {event.type === 'milestone' && <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />}
                      <span className="truncate max-w-[170px]">{event.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{event.timestamp}</span>
                  </div>

                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {event.description}
                  </p>

                  <div className="mt-2.5 flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-mono border border-slate-800 font-semibold">
                      {event.badge}
                    </span>
                    {event.mealsCount && (
                      <span className="text-amber-400 font-mono font-bold">
                        +{event.mealsCount} meals
                      </span>
                    )}
                    {event.co2ImpactKg && (
                      <span className="text-emerald-400 font-mono font-bold">
                        -{event.co2ImpactKg} kg CO2e
                      </span>
                    )}
                    {event.kwImpact && (
                      <span className="text-violet-400 font-mono font-bold">
                        {event.kwImpact} kW impact
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Citizen Pin Drop Reporting Modal */}
      {pinDropModalCoord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Crosshair className="w-4 h-4 text-emerald-400" />
                <span>Drop Location Report</span>
              </div>
              <button
                onClick={() => setPinDropModalCoord(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-slate-400">
                Pinned at: {pinDropModalCoord.lat}° N, {pinDropModalCoord.lng}° E
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Alert Type:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPinReportCategory('surplus_food')}
                    className={`p-2 rounded-xl border text-center font-bold cursor-pointer ${
                      pinReportCategory === 'surplus_food'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    🍲 Surplus Food
                  </button>
                  <button
                    type="button"
                    onClick={() => setPinReportCategory('grid_spike')}
                    className={`p-2 rounded-xl border text-center font-bold cursor-pointer ${
                      pinReportCategory === 'grid_spike'
                        ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    ⚡ Transformer Load
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Location / Details:</label>
                <input
                  type="text"
                  placeholder="e.g. Banquet hall leftover trays or street feeder buzzing"
                  value={pinReportTitle}
                  onChange={(e) => setPinReportTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const title = pinReportTitle || (pinReportCategory === 'surplus_food' ? 'Community Food Surplus' : 'Transformer High Load');
                const newNode: MapNode = {
                  id: `node-report-${Date.now()}`,
                  name: title,
                  type: pinReportCategory === 'surplus_food' ? 'food_alert' : 'transformer',
                  sector: 'Market Square',
                  x: pinDropModalCoord.x,
                  y: pinDropModalCoord.y,
                  lat: pinDropModalCoord.lat,
                  lng: pinDropModalCoord.lng,
                  address: `Citizen Reported Coordinate (${pinDropModalCoord.lat}° N)`,
                  status: pinReportCategory === 'surplus_food' ? 'Food Rescue Window Active' : 'Load Imbalance Reported',
                  color: pinReportCategory === 'surplus_food' ? 'amber' : 'purple',
                  urgency: 'urgent',
                  countdownMinutes: 180,
                  details: `Citizen reported alert via EcoGrid GIS interactive map. Verified with neighborhood dispatcher.`,
                };
                setSelectedNode(newNode);
                setPinDropModalCoord(null);
                setPinReportTitle('');
                setIsDropPinMode(false);
              }}
              className="w-full py-2.5 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white flex items-center justify-center gap-1.5 shadow-lg shadow-blue-950/60 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Broadcast Node to EcoGrid Map</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
