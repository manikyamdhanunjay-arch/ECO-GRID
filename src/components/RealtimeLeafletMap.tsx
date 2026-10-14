import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapNode } from '../types';
import {
  Truck,
  Zap,
  UtensilsCrossed,
  Recycle,
  Navigation,
  Compass,
  Maximize2,
  Minimize2,
  Crosshair,
  Settings,
  Layers,
  Sparkles,
  RotateCcw,
  ShieldAlert,
  Radio,
  Check,
} from 'lucide-react';

export interface RealtimeLeafletMapProps {
  nodes: MapNode[];
  selectedNode: MapNode | null;
  onSelectNode: (node: MapNode | null) => void;
  filterType: string;
  selectedSector: string;
  searchQuery: string;
  showPowerLines: boolean;
  showVanRoutes: boolean;
  showSolarHeatmap: boolean;
  isDropPinMode: boolean;
  onDropPinAtCoord: (coord: { lat: number; lng: number; x: number; y: number; address: string }) => void;
  onCenterOnVan?: (vanId: string) => void;
  activeFollowVanId: string | null;
  setActiveFollowVanId: (vanId: string | null) => void;
}

// Convert 0..100 canvas percentages to real GPS coordinates around EcoGrid central sector
export const percentToLatLng = (x: number, y: number): [number, number] => {
  // Center: 17.4380, 78.3840 (Hyderabad Cyber / EcoGrid Green Valley)
  const baseLatNorth = 17.4520;
  const baseLatSouth = 17.4220;
  const baseLngWest = 17.3640; // wait, 78.3640
  const baseLngEast = 78.4060;

  const lat = +(baseLatNorth - (y / 100) * (baseLatNorth - baseLatSouth)).toFixed(5);
  const lng = +(78.3640 + (x / 100) * (baseLngEast - 78.3640)).toFixed(5);
  return [lat, lng];
};

export const latLngToPercent = (lat: number, lng: number): { x: number; y: number } => {
  const baseLatNorth = 17.4520;
  const baseLatSouth = 17.4220;
  const baseLngWest = 78.3640;
  const baseLngEast = 78.4060;

  const x = Math.max(0, Math.min(100, +(((lng - baseLngWest) / (baseLngEast - baseLngWest)) * 100).toFixed(1)));
  const y = Math.max(0, Math.min(100, +(((baseLatNorth - lat) / (baseLatNorth - baseLatSouth)) * 100).toFixed(1)));
  return { x, y };
};

export const RealtimeLeafletMap: React.FC<RealtimeLeafletMapProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
  filterType,
  selectedSector,
  searchQuery,
  showPowerLines,
  showVanRoutes,
  showSolarHeatmap,
  isDropPinMode,
  onDropPinAtCoord,
  activeFollowVanId,
  setActiveFollowVanId,
}) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layers for markers and polylines
  const nodeMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const vanRoutesLayerRef = useRef<L.LayerGroup | null>(null);
  const powerLinesLayerRef = useRef<L.LayerGroup | null>(null);
  const solarHeatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const dropPinMarkerRef = useRef<L.Marker | null>(null);

  // Basemap style and API key state
  const [tileStyle, setTileStyle] = useState<'voyager' | 'dark' | 'positron'>('voyager');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiModal, setShowApiModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentGpsReadout, setCurrentGpsReadout] = useState<{ lat: number; lng: number } | null>(null);

  // Real-time van animation state
  const [realtimeTelemetry, setRealtimeTelemetry] = useState<{
    [vanId: string]: {
      curLat: number;
      curLng: number;
      bearing: number;
      speed: number;
      progress: number;
      trailHistory: [number, number][];
    };
  }>({});

  // 1. Build the Carto Voyager Tile URL as requested:
  // https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=YOUR_KEY
  const getTileUrl = (style: 'voyager' | 'dark' | 'positron', key: string) => {
    let base = '';
    if (style === 'voyager') {
      base = 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
    } else if (style === 'dark') {
      base = 'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png';
    } else {
      base = 'https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png';
    }

    if (key && key.trim()) {
      return `${base}?key=${encodeURIComponent(key.trim())}`;
    }
    return base;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = [17.4385, 78.3845];
    const map = L.map(mapElementRef.current, {
      center: initialCenter,
      zoom: 14,
      minZoom: 12,
      maxZoom: 18,
      zoomControl: false, // Custom styled zoom controls
      attributionControl: false,
    });

    // Add Carto Voyager Raster Tiles
    const currentUrl = getTileUrl('voyager', apiKey);
    const tileLayer = L.tileLayer(currentUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Create Layer Groups for dynamic real-time management
    const nodeLayer = L.layerGroup().addTo(map);
    const routesLayer = L.layerGroup().addTo(map);
    const gridLayer = L.layerGroup().addTo(map);
    const heatLayer = L.layerGroup().addTo(map);

    nodeMarkersLayerRef.current = nodeLayer;
    vanRoutesLayerRef.current = routesLayer;
    powerLinesLayerRef.current = gridLayer;
    solarHeatmapLayerRef.current = heatLayer;
    mapInstanceRef.current = map;

    // Map mousemove tracking for real-time GPS coordinates
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCurrentGpsReadout({
        lat: +e.latlng.lat.toFixed(5),
        lng: +e.latlng.lng.toFixed(5),
      });
    });

    // Handle Click for Drop-Pin Mode
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const { x, y } = latLngToPercent(lat, lng);

      // If in drop pin mode, trigger handler
      if (dropPinMarkerRef.current) {
        dropPinMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const pinIcon = L.divIcon({
          className: 'custom-drop-pin-marker',
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
              <span class="absolute w-8 h-8 rounded-full bg-rose-500/40 animate-ping"></span>
              <div class="p-2 bg-rose-600 text-white rounded-full shadow-2xl border-2 border-white ring-4 ring-rose-500/50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });
        dropPinMarkerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
      }

      onDropPinAtCoord({
        lat: +lat.toFixed(5),
        lng: +lng.toFixed(5),
        x,
        y,
        address: `Geospatial Sector Pt. [${lat.toFixed(4)}, ${lng.toFixed(4)}]`,
      });
    });

    // Invalidate map size after mount for perfect rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer if Style or API Key changes
  useEffect(() => {
    if (!tileLayerRef.current || !mapInstanceRef.current) return;
    const newUrl = getTileUrl(tileStyle, apiKey);
    tileLayerRef.current.setUrl(newUrl);
  }, [tileStyle, apiKey]);

  // Real-Time Vehicle GPS Simulation Engine
  // Continuously runs every 1000ms, recalculating road trajectory and moving vans smoothly
  useEffect(() => {
    const vanNodes = nodes.filter((n) => n.type === 'pickup_van');
    if (vanNodes.length === 0) return;

    const interval = setInterval(() => {
      setRealtimeTelemetry((prev) => {
        const next = { ...prev };

        vanNodes.forEach((van) => {
          const defaultLatLng: [number, number] =
            van.lat !== undefined && van.lng !== undefined
              ? [van.lat, van.lng]
              : percentToLatLng(van.x, van.y);
          let record = next[van.id];

          // Find target destination node
          const destNode = nodes.find(
            (n) =>
              n.name === van.destination ||
              (van.details && van.details.includes(n.name)) ||
              (n.type === 'food_alert' && n.id !== van.id)
          );
          const destLatLng: [number, number] = destNode
            ? destNode.lat !== undefined && destNode.lng !== undefined
              ? [destNode.lat, destNode.lng]
              : percentToLatLng(destNode.x, destNode.y)
            : percentToLatLng(van.x > 50 ? 32 : 68, van.y > 50 ? 28 : 22);

          const origLatLng: [number, number] = [
            defaultLatLng[0] + (van.id === 'van-01' ? -0.005 : 0.004),
            defaultLatLng[1] + (van.id === 'van-01' ? 0.006 : -0.005),
          ];

          if (!record) {
            record = {
              curLat: defaultLatLng[0],
              curLng: defaultLatLng[1],
              bearing: van.bearing || 45,
              speed: van.speedKmH || 32,
              progress: 0.2,
              trailHistory: [origLatLng, defaultLatLng],
            };
          }

          // Advance progress along route
          const newProgress = (record.progress + 0.018) % 1;

          // Road curve inflection point to mimic actual street grid
          const midLat = (origLatLng[0] + destLatLng[0]) / 2 + (van.id === 'van-01' ? 0.0018 : -0.0015);
          const midLng = (origLatLng[1] + destLatLng[1]) / 2 + (van.id === 'van-01' ? -0.0022 : 0.0018);

          // Quadratic Bezier interpolation on GPS space
          const t = newProgress;
          const oneMinusT = 1 - t;
          const curLat =
            oneMinusT * oneMinusT * origLatLng[0] +
            2 * oneMinusT * t * midLat +
            t * t * destLatLng[0];
          const curLng =
            oneMinusT * oneMinusT * origLatLng[1] +
            2 * oneMinusT * t * midLng +
            t * t * destLatLng[1];

          // Compute instantaneous bearing
          const dLat = 2 * oneMinusT * (midLat - origLatLng[0]) + 2 * t * (destLatLng[0] - midLat);
          const dLng = 2 * oneMinusT * (midLng - origLatLng[1]) + 2 * t * (destLatLng[1] - midLng);
          // Bearing in degrees from North
          const bearingRad = Math.atan2(dLng, dLat);
          const bearingDeg = Math.round((bearingRad * (180 / Math.PI) + 360) % 360);

          // Dynamic speed variance
          const speedVariance = Math.floor(Math.sin(Date.now() / 2000 + curLat * 100) * 4);
          const curSpeed = Math.max(20, Math.min(48, (van.speedKmH || 32) + speedVariance));

          // Append to breadcrumb trail history (keep last 12 points)
          const newTrail = [...record.trailHistory, [curLat, curLng] as [number, number]];
          if (newTrail.length > 12) newTrail.shift();

          next[van.id] = {
            curLat: +curLat.toFixed(5),
            curLng: +curLng.toFixed(5),
            bearing: bearingDeg,
            speed: curSpeed,
            progress: newProgress,
            trailHistory: newTrail,
          };

          // If camera is set to follow this van, pan smoothly
          if (activeFollowVanId === van.id && mapInstanceRef.current) {
            mapInstanceRef.current.panTo([curLat, curLng], { animate: true, duration: 0.8 });
          }
        });

        return next;
      });
    }, 1100);

    return () => clearInterval(interval);
  }, [nodes, activeFollowVanId]);

  // Render Real-time Map Layers: Markers, Dynamic Paths, Feeder Lines, Solar Heat
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !nodeMarkersLayerRef.current || !vanRoutesLayerRef.current || !powerLinesLayerRef.current || !solarHeatmapLayerRef.current) return;

    // Clear prior dynamic layers
    nodeMarkersLayerRef.current.clearLayers();
    vanRoutesLayerRef.current.clearLayers();
    powerLinesLayerRef.current.clearLayers();
    solarHeatmapLayerRef.current.clearLayers();

    // 1. Filtered Nodes
    const filteredNodes = nodes.filter((node) => {
      if (filterType === 'food' && node.type !== 'food_alert') return false;
      if (filterType === 'hubs' && node.type !== 'recycling_hub') return false;
      if (filterType === 'vans' && node.type !== 'pickup_van') return false;
      if (filterType === 'grid' && node.type !== 'transformer') return false;
      if (selectedSector !== 'all' && node.sector !== selectedSector) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          node.name.toLowerCase().includes(q) ||
          node.details.toLowerCase().includes(q) ||
          (node.address && node.address.toLowerCase().includes(q))
        );
      }
      return true;
    });

    // 2. Render Static / Hub / Alert / Transformer Markers
    filteredNodes.forEach((node) => {
      // Determine node coordinates
      let [lat, lng] = node.lat && node.lng ? [node.lat, node.lng] : percentToLatLng(node.x, node.y);

      // If it's a moving pickup van, use its simulated real-time GPS position
      if (node.type === 'pickup_van' && realtimeTelemetry[node.id]) {
        lat = realtimeTelemetry[node.id].curLat;
        lng = realtimeTelemetry[node.id].curLng;
      }

      const isSelected = selectedNode?.id === node.id;

      // Custom HTML Marker based on Node Type
      let iconHtml = '';
      let markerAnchor: [number, number] = [20, 20];

      if (node.type === 'pickup_van') {
        const tel = realtimeTelemetry[node.id] || { bearing: node.bearing || 0, speed: node.speedKmH || 30 };
        iconHtml = `
          <div class="relative group cursor-pointer flex items-center justify-center transition-transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
            <!-- Pulsing Ring -->
            <span class="absolute -inset-2 rounded-full bg-cyan-400/30 animate-ping"></span>
            
            <!-- Van Badge with Direction Heading -->
            <div class="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-900 border-2 ${isSelected ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)]' : 'border-cyan-500/80 shadow-lg'} text-cyan-400 transition-all">
              <div style="transform: rotate(${tel.bearing}deg); transition: transform 0.5s ease-out;" class="flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                  <path d="M15 18H9"/>
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                  <circle cx="17" cy="18" r="2"/>
                  <circle cx="7" cy="18" r="2"/>
                </svg>
              </div>
              
              <!-- Directional Compass Arrow Pointing Forward -->
              <div class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-cyan-400 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-black shadow" style="transform: rotate(${tel.bearing}deg)">
                ▲
              </div>
            </div>

            <!-- Driver & Speed Tooltip Badge -->
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 px-2 py-0.5 rounded-full shadow-lg pointer-events-none flex items-center gap-1">
              <span>${tel.speed} km/h</span>
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            </div>
          </div>
        `;
        markerAnchor = [20, 20];
      } else if (node.type === 'food_alert') {
        const isUrgent = node.urgency === 'urgent';
        iconHtml = `
          <div class="relative group cursor-pointer flex items-center justify-center transition-transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
            <span class="absolute -inset-2.5 rounded-full ${isUrgent ? 'bg-rose-500/35 animate-ping' : 'bg-amber-500/25 animate-pulse'}"></span>
            <div class="relative flex items-center justify-center w-9 h-9 rounded-2xl ${isUrgent ? 'bg-rose-950 border-2 border-rose-500 text-rose-400' : 'bg-amber-950 border-2 border-amber-500 text-amber-400'} shadow-xl">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 2v2"/>
                <path d="M7 2v2"/>
                <path d="M21 15V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v7a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 15z"/>
                <path d="m3.3 7 8.7 5 8.7-5"/>
                <path d="M12 22V12"/>
              </svg>
            </div>
            <!-- Expiry countdown pill -->
            ${
              node.countdownMinutes !== undefined
                ? `<div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-950/95 border ${isUrgent ? 'border-rose-500/60 text-rose-300' : 'border-amber-500/60 text-amber-300'} text-[9px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow">
                    ${node.countdownMinutes}m left
                   </div>`
                : ''
            }
          </div>
        `;
        markerAnchor = [18, 18];
      } else if (node.type === 'recycling_hub') {
        iconHtml = `
          <div class="relative group cursor-pointer flex items-center justify-center transition-transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
            <div class="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-emerald-950 border-2 border-emerald-500 text-emerald-400 shadow-xl">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
                <path d="M11 19h8.2a1.8 1.8 0 0 0 1.784-1.564 1.8 1.8 0 0 0-.74-1.776L16.2 12"/>
                <path d="m3.67 10 3.53 6h7.6"/>
                <path d="m14 5 3.8 6.5"/>
                <path d="M9.8 12.5 12.3 8l2.5 4.5"/>
              </svg>
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-emerald-500/40 text-[9px] font-bold text-emerald-300 px-1.5 py-0.2 rounded-full whitespace-nowrap shadow">
              HUB
            </div>
          </div>
        `;
        markerAnchor = [18, 18];
      } else {
        // transformer
        const isSpiking = (node.loadPercent || 0) > 85;
        iconHtml = `
          <div class="relative group cursor-pointer flex items-center justify-center transition-transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
            <div class="relative flex items-center justify-center w-8 h-8 rounded-2xl bg-purple-950 border-2 ${isSpiking ? 'border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'border-purple-500 text-purple-400'} shadow-xl">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-purple-500/40 text-[9px] font-mono font-bold ${isSpiking ? 'text-amber-300' : 'text-purple-300'} px-1.5 py-0.2 rounded-full whitespace-nowrap shadow">
              ${node.loadPercent}%
            </div>
          </div>
        `;
        markerAnchor = [16, 16];
      }

      const customDivIcon = L.divIcon({
        className: 'leaflet-custom-node',
        html: iconHtml,
        iconSize: [40, 40],
        iconAnchor: markerAnchor,
      });

      const marker = L.marker([lat, lng], { icon: customDivIcon });
      marker.on('click', () => {
        onSelectNode(node);
      });

      // Quick hover tooltip
      marker.bindTooltip(
        `
        <div class="p-1 text-slate-100 font-sans">
          <div class="font-bold text-xs text-white">${node.name}</div>
          <div class="text-[10px] text-slate-400">${node.sector} • ${node.status}</div>
          <div class="text-[10px] font-mono text-emerald-400 mt-0.5">GPS: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°</div>
        </div>
      `,
        { direction: 'top', offset: [0, -20], className: 'custom-leaflet-tooltip' }
      );

      nodeMarkersLayerRef.current?.addLayer(marker);
    });

    // 3. Dynamic Van Trajectory Paths & Destination Beacons (Real-time path following)
    if (showVanRoutes) {
      filteredNodes
        .filter((n) => n.type === 'pickup_van')
        .forEach((van) => {
          const tel = realtimeTelemetry[van.id];
          const isSelected = selectedNode?.id === van.id;

          // Target destination coordinates
          const destNode = nodes.find(
            (n) =>
              n.name === van.destination ||
              (van.details && van.details.includes(n.name)) ||
              (n.type === 'food_alert' && n.id !== van.id)
          );
          const destLatLng: [number, number] = destNode
            ? destNode.lat !== undefined && destNode.lng !== undefined
              ? [destNode.lat, destNode.lng]
              : percentToLatLng(destNode.x, destNode.y)
            : percentToLatLng(van.x > 50 ? 32 : 68, van.y > 50 ? 28 : 22);

          const curLatLng: [number, number] = tel
            ? [tel.curLat, tel.curLng]
            : (van.lat !== undefined && van.lng !== undefined ? [van.lat, van.lng] : percentToLatLng(van.x, van.y));

          // A. Trajectory Trail (Past coordinates history with glowing cyan trail)
          if (tel?.trailHistory && tel.trailHistory.length > 1) {
            const trailPolyline = L.polyline(tel.trailHistory, {
              color: isSelected ? '#06b6d4' : '#0891b2',
              weight: isSelected ? 4 : 3,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            });
            vanRoutesLayerRef.current?.addLayer(trailPolyline);
          }

          // B. Forward Navigation Path (From current vehicle to destination)
          // Interpolate smooth path through intermediate street waypoint
          const midLat = (curLatLng[0] + destLatLng[0]) / 2 + (van.id === 'van-01' ? 0.0012 : -0.001);
          const midLng = (curLatLng[1] + destLatLng[1]) / 2 + (van.id === 'van-01' ? -0.0015 : 0.0012);

          const forwardWaypoints: [number, number][] = [
            curLatLng,
            [midLat, midLng],
            destLatLng,
          ];

          // Flowing Dashed Route Line
          const fwdPolyline = L.polyline(forwardWaypoints, {
            color: isSelected ? '#38bdf8' : '#0ea5e9',
            weight: isSelected ? 3.5 : 2.5,
            opacity: 0.9,
            dashArray: '8, 8',
            className: 'animate-route-flow',
          });
          vanRoutesLayerRef.current?.addLayer(fwdPolyline);

          // C. Destination Beacon Marker
          const destBeaconIcon = L.divIcon({
            className: 'custom-dest-beacon',
            html: `
              <div class="relative flex items-center justify-center">
                <span class="absolute w-8 h-8 rounded-full bg-cyan-400/40 animate-ping"></span>
                <span class="absolute w-5 h-5 rounded-full bg-cyan-500/60 animate-pulse"></span>
                <div class="w-3 h-3 rounded-full bg-cyan-300 border-2 border-white shadow-lg"></div>
                <div class="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-cyan-500/50 text-[9px] font-mono font-bold text-cyan-300 px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-lg">
                  ETA: ${van.etaMinutes || 6}m
                </div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const destMarker = L.marker(destLatLng, { icon: destBeaconIcon });
          destMarker.bindTooltip(`Target: ${van.destination || 'Pickup Site'}`, { direction: 'top', offset: [0, -10] });
          vanRoutesLayerRef.current?.addLayer(destMarker);
        });
    }

    // 4. Power Grid Feeder Circuits (Substation interconnects)
    if (showPowerLines) {
      const transformers = nodes.filter((n) => n.type === 'transformer');
      if (transformers.length >= 2) {
        for (let i = 0; i < transformers.length - 1; i++) {
          const t1 = transformers[i];
          const t2 = transformers[i + 1];
          const pt1: [number, number] =
            t1.lat !== undefined && t1.lng !== undefined
              ? [t1.lat, t1.lng]
              : percentToLatLng(t1.x, t1.y);
          const pt2: [number, number] =
            t2.lat !== undefined && t2.lng !== undefined
              ? [t2.lat, t2.lng]
              : percentToLatLng(t2.x, t2.y);

          const feederPolyline = L.polyline([pt1, pt2], {
            color: '#a855f7',
            weight: 2,
            opacity: 0.5,
            dashArray: '5, 10',
            className: 'animate-grid-pulse',
          });
          powerLinesLayerRef.current?.addLayer(feederPolyline);
        }
      }
    }

    // 5. Rooftop Solar Heatmap Overlay Zones
    if (showSolarHeatmap) {
      const solarCenters: [number, number, number][] = [
        [17.4320, 78.3740, 220],
        [17.4440, 78.3960, 260],
        [17.4260, 78.3880, 180],
      ];

      solarCenters.forEach(([lat, lng, radius]) => {
        const circle = L.circle([lat, lng], {
          radius: radius,
          fillColor: '#f59e0b',
          fillOpacity: 0.16,
          stroke: true,
          color: '#fbbf24',
          weight: 1,
          opacity: 0.4,
          dashArray: '4, 4',
        });
        solarHeatmapLayerRef.current?.addLayer(circle);
      });
    }
  }, [
    nodes,
    selectedNode,
    filterType,
    selectedSector,
    searchQuery,
    showPowerLines,
    showVanRoutes,
    showSolarHeatmap,
    realtimeTelemetry,
  ]);

  // Center on Selected Node
  useEffect(() => {
    if (!selectedNode || !mapInstanceRef.current) return;
    const [lat, lng] =
      selectedNode.lat && selectedNode.lng
        ? [selectedNode.lat, selectedNode.lng]
        : percentToLatLng(selectedNode.x, selectedNode.y);

    mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
  }, [selectedNode]);

  // Handle Zoom controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    setActiveFollowVanId(null);
    mapInstanceRef.current?.setView([17.4385, 78.3845], 14, { animate: true });
  };

  // Toggle Fullscreen on Map Container
  const handleToggleFullscreen = () => {
    if (!mapElementRef.current) return;
    if (!document.fullscreenElement) {
      mapElementRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const activeVanCount = nodes.filter((n) => n.type === 'pickup_van').length;
  const activeFollowVan = nodes.find((n) => n.id === activeFollowVanId);

  return (
    <div className="relative w-full h-full min-h-[460px] sm:min-h-[520px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col bg-slate-950">
      {/* Top Floating Telemetry & Basemap API Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Live Satellite GPS & Carto Voyager API Indicator */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white tracking-wide flex items-center gap-1.5">
                <span>CARTO VOYAGER API</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REAL-TIME GPS
                </span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {currentGpsReadout
                  ? `Lat: ${currentGpsReadout.lat}° • Lng: ${currentGpsReadout.lng}°`
                  : 'Lat: 17.4385° • Lng: 78.3845° (EcoGrid District)'}
              </span>
            </div>
          </div>

          {/* Active Follow Van Indicator */}
          {activeFollowVan && (
            <div className="bg-cyan-950/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-cyan-500/40 shadow-xl flex items-center gap-2 text-cyan-300 text-[11px] font-bold">
              <Navigation className="w-3.5 h-3.5 animate-spin-slow text-cyan-400" />
              <span>Tracking: {activeFollowVan.name}</span>
              <button
                onClick={() => setActiveFollowVanId(null)}
                className="text-cyan-400 hover:text-white ml-1 text-xs cursor-pointer"
                title="Stop Following"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Right: Basemap Switcher & API Settings */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Basemap Style Toggle */}
          <div className="bg-slate-950/90 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-1 text-[11px]">
            <button
              onClick={() => setTileStyle('voyager')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                tileStyle === 'voyager'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Voyager
            </button>
            <button
              onClick={() => setTileStyle('dark')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                tileStyle === 'dark'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark Matter
            </button>
            <button
              onClick={() => setTileStyle('positron')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                tileStyle === 'positron'
                  ? 'bg-slate-200 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Positron
            </button>
          </div>

          {/* Carto API Key Modal Button */}
          <button
            onClick={() => setShowApiModal(!showApiModal)}
            title="Configure Carto Tile API Key"
            className="p-2 bg-slate-950/90 backdrop-blur-md text-slate-300 hover:text-emerald-400 rounded-2xl border border-slate-800 hover:border-slate-700 shadow-xl transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <div ref={mapElementRef} className="w-full h-full flex-1 z-0" />

      {/* Right Floating Map Navigation Controls */}
      <div className="absolute right-3 bottom-14 z-[1000] flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="w-9 h-9 bg-slate-950/90 backdrop-blur-md text-slate-200 hover:text-white rounded-xl border border-slate-800 shadow-xl flex items-center justify-center font-bold text-lg hover:border-slate-700 transition-all cursor-pointer"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="w-9 h-9 bg-slate-950/90 backdrop-blur-md text-slate-200 hover:text-white rounded-xl border border-slate-800 shadow-xl flex items-center justify-center font-bold text-lg hover:border-slate-700 transition-all cursor-pointer"
        >
          −
        </button>
        <button
          onClick={handleResetView}
          title="Reset to EcoGrid Center View"
          className="w-9 h-9 bg-slate-950/90 backdrop-blur-md text-slate-200 hover:text-emerald-400 rounded-xl border border-slate-800 shadow-xl flex items-center justify-center hover:border-slate-700 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          className="w-9 h-9 bg-slate-950/90 backdrop-blur-md text-slate-200 hover:text-cyan-400 rounded-xl border border-slate-800 shadow-xl flex items-center justify-center hover:border-slate-700 transition-all cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Floating Status Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[11px]">
        {/* Left: Active Vehicles & Live Route Telemetry pill */}
        <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 shadow-xl pointer-events-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Truck className="w-3.5 h-3.5" />
            <span>{activeVanCount} Vans in Motion</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dynamic Path Follower: Active</span>
          </div>
        </div>

        {/* Right: Map Provider Attribution */}
        <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-2xl border border-slate-800/80 shadow text-slate-400 font-mono text-[10px] pointer-events-auto">
          Basemap: <span className="text-emerald-400 font-bold">CARTO Voyager</span> © OpenStreetMap
        </div>
      </div>

      {/* API Key Modal Popup */}
      {showApiModal && (
        <div className="absolute inset-0 z-[1100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>CARTO Voyager Tile API Settings</span>
              </h4>
              <button
                onClick={() => setShowApiModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Configured endpoint:
              <code className="block mt-1 p-2 bg-slate-950 rounded-xl text-emerald-300 font-mono text-[11px] break-all border border-slate-800">
                https://basemaps.cartocdn.com/rastertiles/voyager/&#123;z&#125;/&#123;x&#125;/&#123;y&#125;.png?key=YOUR_KEY
              </code>
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Carto API Key <span className="text-slate-500 font-normal">(Optional for public demo)</span>
              </label>
              <input
                type="text"
                placeholder="Enter CARTO API Key if required"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-500">
                Default public Carto Voyager tiles are served with zero configuration. You can supply an official key if rate-limited.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setApiKey('');
                  setShowApiModal(false);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Reset Default
              </button>
              <button
                onClick={() => setShowApiModal(false)}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Apply & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
