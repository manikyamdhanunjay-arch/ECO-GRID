import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Sun,
  Moon,
  Sunset,
  Volume2,
  VolumeX,
  Gauge,
  BatteryCharging,
  Eye,
  EyeOff,
  CornerDownRight,
  Route,
  Activity,
  Key,
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

// Convert 0..100 canvas percentages to real GPS coordinates around EcoGrid central sector (Hyderabad Cyber / Green Valley)
export const percentToLatLng = (x: number, y: number): [number, number] => {
  const baseLatNorth = 17.4520;
  const baseLatSouth = 17.4220;
  const baseLngWest = 78.3640;
  const baseLngEast = 78.4060;

  const lat = +(baseLatNorth - (y / 100) * (baseLatNorth - baseLatSouth)).toFixed(5);
  const lng = +(baseLngWest + (x / 100) * (baseLngEast - baseLngWest)).toFixed(5);
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

// Calculate Haversine distance in meters
const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate geographic bearing in degrees (0..360)
const getBearingDegrees = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const θ = Math.atan2(y, x);
  return Math.round(((θ * 180) / Math.PI + 360) % 360);
};

// Realistic Street Networks with Waypoints and Street Names
interface StreetWaypoint {
  lat: number;
  lng: number;
  streetName: string;
  speedLimitKmH: number;
  instruction?: string;
}

const VAN_01_REALISTIC_CORRIDOR: StreetWaypoint[] = [
  { lat: 17.4395, lng: 78.3840, streetName: 'Civic Center Way', speedLimitKmH: 25, instruction: 'Departing Annapurna Food Bank' },
  { lat: 17.4402, lng: 78.3834, streetName: 'Civic Center North Gate', speedLimitKmH: 30, instruction: 'Turn left onto Central Arterial' },
  { lat: 17.4408, lng: 78.3827, streetName: 'Central Arterial Parkway', speedLimitKmH: 45, instruction: 'Continue on Central Arterial for 250m' },
  { lat: 17.4414, lng: 78.3820, streetName: 'Commercial Ring Road Jct', speedLimitKmH: 32, instruction: 'Bear right onto Commercial Ring' },
  { lat: 17.4418, lng: 78.3812, streetName: 'Grand Orchid Entry Court', speedLimitKmH: 20, instruction: 'Arriving at Grand Orchid Banquet Hall' },
  { lat: 17.4412, lng: 78.3804, streetName: 'Sector 3 West Bypass', speedLimitKmH: 38, instruction: 'Continuing pickup circuit' },
  { lat: 17.4402, lng: 78.3812, streetName: 'Market Green Promenade', speedLimitKmH: 35, instruction: 'Approaching South Sector Roundabout' },
  { lat: 17.4394, lng: 78.3826, streetName: 'Civic Hub Access Lane', speedLimitKmH: 28, instruction: 'Return route to Central Hub' },
];

const VAN_02_REALISTIC_CORRIDOR: StreetWaypoint[] = [
  { lat: 17.4475, lng: 78.3910, streetName: 'Hill View Interchange Approach', speedLimitKmH: 35, instruction: 'Departing North Sector Junction' },
  { lat: 17.4486, lng: 78.3926, streetName: 'North Hills Parkway', speedLimitKmH: 48, instruction: 'Accelerate on North Hills Parkway' },
  { lat: 17.4501, lng: 78.3942, streetName: 'Cyber Gateway Flyover Underpass', speedLimitKmH: 42, instruction: 'Merge right past Gateway Flyover' },
  { lat: 17.4514, lng: 78.3958, streetName: 'Metro Logistics Boulevard', speedLimitKmH: 30, instruction: 'Prepare to turn into Supermart loading bay' },
  { lat: 17.4521, lng: 78.3965, streetName: 'Metro Wholesale Supermart Bay', speedLimitKmH: 18, instruction: 'Docked at Wholesale Supermart' },
  { lat: 17.4510, lng: 78.3980, streetName: 'East Freight Corridor', speedLimitKmH: 40, instruction: 'Looping onto Outer Beltway' },
  { lat: 17.4490, lng: 78.3952, streetName: 'Valley Link Overpass', speedLimitKmH: 44, instruction: 'Passing Tech Substation Sector' },
  { lat: 17.4478, lng: 78.3922, streetName: 'South Ramp to Hill View', speedLimitKmH: 34, instruction: 'Returning to Sector 9 Depot' },
];

// Realistic 3D Landmark Building Outlines
interface LandmarkFootprint {
  id: string;
  name: string;
  category: string;
  solarKw: number;
  polygon: [number, number][];
  center: [number, number];
}

const LANDMARK_BUILDINGS: LandmarkFootprint[] = [
  {
    id: 'bldg-orchid',
    name: 'Grand Orchid Banquet Hall',
    category: 'Commercial Hospitality',
    solarKw: 42.5,
    center: [17.4418, 78.3812],
    polygon: [
      [17.4421, 78.3808],
      [17.4422, 78.3816],
      [17.4415, 78.3817],
      [17.4414, 78.3809],
    ],
  },
  {
    id: 'bldg-annapurna',
    name: 'Annapurna NGO Central Food Bank',
    category: 'Community Logistics Hub',
    solarKw: 58.0,
    center: [17.4395, 78.3840],
    polygon: [
      [17.4398, 78.3836],
      [17.4399, 78.3845],
      [17.4391, 78.3846],
      [17.4390, 78.3837],
    ],
  },
  {
    id: 'bldg-metro',
    name: 'Metro Wholesale Supermart',
    category: 'Supercenter & Cold Storage',
    solarKw: 110.2,
    center: [17.4521, 78.3965],
    polygon: [
      [17.4525, 78.3959],
      [17.4526, 78.3972],
      [17.4516, 78.3973],
      [17.4515, 78.3960],
    ],
  },
  {
    id: 'bldg-techcampus',
    name: 'Tech Campus Cafeteria 2',
    category: 'Corporate Enterprise',
    solarKw: 85.0,
    center: [17.4332, 78.4089],
    polygon: [
      [17.4336, 78.4083],
      [17.4337, 78.4095],
      [17.4327, 78.4096],
      [17.4326, 78.4084],
    ],
  },
  {
    id: 'bldg-substation',
    name: 'Substation Yard T-04',
    category: 'Power Grid Infrastructure',
    solarKw: 16.0,
    center: [17.4380, 78.3865],
    polygon: [
      [17.4383, 78.3861],
      [17.4384, 78.3870],
      [17.4376, 78.3871],
      [17.4375, 78.3862],
    ],
  },
];

// Live Traffic Segments
const TRAFFIC_CORRIDORS: {
  points: [number, number][];
  status: 'free' | 'moderate' | 'congested';
  speedKmH: number;
  label: string;
}[] = [
  {
    points: [
      [17.4501, 78.3942],
      [17.4514, 78.3958],
      [17.4521, 78.3965],
      [17.4530, 78.3980],
    ],
    status: 'free',
    speedKmH: 48,
    label: 'Cyber Gateway Flyover (Express)',
  },
  {
    points: [
      [17.4402, 78.3834],
      [17.4408, 78.3827],
      [17.4414, 78.3820],
    ],
    status: 'moderate',
    speedKmH: 28,
    label: 'Central Arterial Parkway',
  },
  {
    points: [
      [17.4414, 78.3820],
      [17.4418, 78.3812],
      [17.4412, 78.3804],
    ],
    status: 'congested',
    speedKmH: 15,
    label: 'Market Square Commercial Ring (Slow)',
  },
  {
    points: [
      [17.4395, 78.3840],
      [17.4380, 78.3865],
      [17.4350, 78.3890],
    ],
    status: 'free',
    speedKmH: 42,
    label: 'Knowledge Corridor Boulevard',
  },
];

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
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer Groups
  const nodeMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const vanRoutesLayerRef = useRef<L.LayerGroup | null>(null);
  const powerLinesLayerRef = useRef<L.LayerGroup | null>(null);
  const solarHeatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const trafficLayerRef = useRef<L.LayerGroup | null>(null);
  const landmarkBuildingsLayerRef = useRef<L.LayerGroup | null>(null);
  const dropPinMarkerRef = useRef<L.Marker | null>(null);

  // Basemap style & API Key state
  // Supports voyager, dark, positron, and realistic satellite hybrid
  const [tileStyle, setTileStyle] = useState<'voyager' | 'dark' | 'positron' | 'satellite'>('voyager');
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('ecogrid_carto_api_key') || '';
  });
  const [retinaResolution, setRetinaResolution] = useState<boolean>(true);
  const [showApiModal, setShowApiModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [is3DTilt, setIs3DTilt] = useState<boolean>(false);
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);
  const [audioFeedback, setAudioFeedback] = useState<boolean>(false);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'golden' | 'night'>('day');
  const [currentGpsReadout, setCurrentGpsReadout] = useState<{ lat: number; lng: number } | null>(null);

  // Audio cue synthesizer via Web Audio API
  const playTacticalBeep = useCallback((freq = 880, duration = 0.08) => {
    if (!audioFeedback) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext policy handled gracefully
    }
  }, [audioFeedback]);

  // Real-time precise vehicle telemetry
  const [realtimeTelemetry, setRealtimeTelemetry] = useState<{
    [vanId: string]: {
      curLat: number;
      curLng: number;
      bearing: number;
      speed: number;
      currentStreet: string;
      nextInstruction: string;
      distanceToNextMeters: number;
      isBlinkingLeft: boolean;
      isBlinkingRight: boolean;
      isDecelerating: boolean;
      batteryPercent: number;
      cargoTempC: number;
      regenKw: number;
      trailHistory: [number, number][];
    };
  }>({});

  // 1. CARTO Voyager Tile URL Generator:
  // https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=YOUR_KEY
  const getCartoTileUrl = useCallback(
    (style: 'voyager' | 'dark' | 'positron', retina: boolean, key: string) => {
      const ext = retina ? '@2x.png' : '.png';
      let path = 'voyager';
      if (style === 'dark') path = 'dark_all';
      if (style === 'positron') path = 'light_all';

      const base = `https://basemaps.cartocdn.com/rastertiles/${path}/{z}/{x}/{y}${ext}`;
      if (key && key.trim()) {
        return `${base}?key=${encodeURIComponent(key.trim())}`;
      }
      return base;
    },
    []
  );

  const getCartoLabelsOnlyUrl = useCallback(
    (retina: boolean, key: string) => {
      const ext = retina ? '@2x.png' : '.png';
      const base = `https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}${ext}`;
      if (key && key.trim()) {
        return `${base}?key=${encodeURIComponent(key.trim())}`;
      }
      return base;
    },
    []
  );

  // Initialize Map
  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = [17.4395, 78.3840];
    const map = L.map(mapElementRef.current, {
      center: initialCenter,
      zoom: 15,
      minZoom: 12,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
    });

    // Base Layer: CARTO Voyager
    const initialUrl = getCartoTileUrl('voyager', retinaResolution, apiKey);
    const baseLayer = L.tileLayer(initialUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
      detectRetina: retinaResolution,
      attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
    }).addTo(map);

    baseTileLayerRef.current = baseLayer;

    // Optional Labels Overlay Layer (used in satellite hybrid mode)
    const labelsLayer = L.tileLayer(getCartoLabelsOnlyUrl(retinaResolution, apiKey), {
      maxZoom: 19,
      subdomains: 'abcd',
      opacity: 0,
    }).addTo(map);

    labelsTileLayerRef.current = labelsLayer;

    // Register Dynamic Leaflet Layers
    const nodeLayer = L.layerGroup().addTo(map);
    const routesLayer = L.layerGroup().addTo(map);
    const gridLayer = L.layerGroup().addTo(map);
    const heatLayer = L.layerGroup().addTo(map);
    const trafficLayer = L.layerGroup().addTo(map);
    const landmarkLayer = L.layerGroup().addTo(map);

    nodeMarkersLayerRef.current = nodeLayer;
    vanRoutesLayerRef.current = routesLayer;
    powerLinesLayerRef.current = gridLayer;
    solarHeatmapLayerRef.current = heatLayer;
    trafficLayerRef.current = trafficLayer;
    landmarkBuildingsLayerRef.current = landmarkLayer;

    mapInstanceRef.current = map;

    // Real-time GPS Mouse Coordinate Readout
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCurrentGpsReadout({
        lat: +e.latlng.lat.toFixed(5),
        lng: +e.latlng.lng.toFixed(5),
      });
    });

    // Interactive Pin Drop Mode
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const { x, y } = latLngToPercent(lat, lng);

      playTacticalBeep(1200, 0.06);

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

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when Style, Retina, or API Key changes
  useEffect(() => {
    if (!baseTileLayerRef.current || !labelsTileLayerRef.current) return;

    if (tileStyle === 'satellite') {
      // Photorealistic Satellite Base + CARTO Voyager Labels Overlay
      baseTileLayerRef.current.setUrl(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      );
      labelsTileLayerRef.current.setUrl(getCartoLabelsOnlyUrl(retinaResolution, apiKey));
      labelsTileLayerRef.current.setOpacity(0.95);
    } else {
      const url = getCartoTileUrl(tileStyle, retinaResolution, apiKey);
      baseTileLayerRef.current.setUrl(url);
      labelsTileLayerRef.current.setOpacity(0);
    }
  }, [tileStyle, retinaResolution, apiKey, getCartoTileUrl, getCartoLabelsOnlyUrl]);

  // Persist API Key in LocalStorage
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('ecogrid_carto_api_key', key.trim());
    setShowApiModal(false);
    playTacticalBeep(980, 0.1);
  };

  // HIGH-REALISM VEHICLE SIMULATION ENGINE
  // Uses authentic street-snapped waypoints, smooth micro-interpolation, turn blinkers, speed profiles, and braking
  useEffect(() => {
    let animFrame: number;
    let lastTimestamp = performance.now();
    let vanProgressState = {
      'van-01': { waypointIndex: 0, subProgress: 0.1, distanceCovered: 0 },
      'van-02': { waypointIndex: 2, subProgress: 0.4, distanceCovered: 0 },
    };

    const updateVehicleSimulation = (timestamp: number) => {
      const dt = Math.min(0.1, (timestamp - lastTimestamp) / 1000); // delta seconds
      lastTimestamp = timestamp;

      setRealtimeTelemetry((prev) => {
        const next = { ...prev };

        // Process Van-01 (Robin Hood Army EV-42)
        {
          const corridor = VAN_01_REALISTIC_CORRIDOR;
          const st = vanProgressState['van-01'];
          const p1 = corridor[st.waypointIndex];
          const nextIndex = (st.waypointIndex + 1) % corridor.length;
          const p2 = corridor[nextIndex];
          const segDistMeters = Math.max(10, getDistanceMeters(p1.lat, p1.lng, p2.lat, p2.lng));

          // Target speed based on segment speed limit
          const isApproachingTurn = 1 - st.subProgress < 0.25;
          const targetSpeed = isApproachingTurn ? Math.min(22, p1.speedLimitKmH) : p1.speedLimitKmH;

          // Progress delta based on actual real-world speed (scaled for realistic command-center observation)
          const speedFactor = 2.4; // Simulation time scale
          const progressInc = ((targetSpeed * 1000) / 3600 / segDistMeters) * dt * speedFactor;

          st.subProgress += progressInc;
          if (st.subProgress >= 1) {
            st.subProgress = 0;
            st.waypointIndex = nextIndex;
          }

          // Smooth coordinate interpolation along the street
          const curLat = p1.lat + (p2.lat - p1.lat) * st.subProgress;
          const curLng = p1.lng + (p2.lng - p1.lng) * st.subProgress;
          const bearing = getBearingDegrees(p1.lat, p1.lng, p2.lat, p2.lng);

          // Calculate turn indicator
          const nextNextIndex = (nextIndex + 1) % corridor.length;
          const p3 = corridor[nextNextIndex];
          const nextBearing = getBearingDegrees(p2.lat, p2.lng, p3.lat, p3.lng);
          const bearingDiff = ((nextBearing - bearing + 540) % 360) - 180;

          const isTurningLeft = isApproachingTurn && bearingDiff < -25;
          const isTurningRight = isApproachingTurn && bearingDiff > 25;

          const distToTurn = Math.round(segDistMeters * (1 - st.subProgress));

          // Past trail breadcrumbs
          const prevTrail = prev['van-01']?.trailHistory || [];
          const newTrail = [...prevTrail, [curLat, curLng] as [number, number]];
          if (newTrail.length > 20) newTrail.shift();

          next['van-01'] = {
            curLat: +curLat.toFixed(5),
            curLng: +curLng.toFixed(5),
            bearing,
            speed: Math.round(targetSpeed + Math.sin(timestamp / 800) * 2),
            currentStreet: p1.streetName,
            nextInstruction: p2.instruction || `Turn ahead onto ${p2.streetName}`,
            distanceToNextMeters: distToTurn,
            isBlinkingLeft: isTurningLeft,
            isBlinkingRight: isTurningRight,
            isDecelerating: isApproachingTurn,
            batteryPercent: 82,
            cargoTempC: 4.2,
            regenKw: isApproachingTurn ? 3.4 : 0.8,
            trailHistory: newTrail,
          };
        }

        // Process Van-02 (CleanHaul Circular Fleet #11)
        {
          const corridor = VAN_02_REALISTIC_CORRIDOR;
          const st = vanProgressState['van-02'];
          const p1 = corridor[st.waypointIndex];
          const nextIndex = (st.waypointIndex + 1) % corridor.length;
          const p2 = corridor[nextIndex];
          const segDistMeters = Math.max(10, getDistanceMeters(p1.lat, p1.lng, p2.lat, p2.lng));

          const isApproachingTurn = 1 - st.subProgress < 0.28;
          const targetSpeed = isApproachingTurn ? Math.min(24, p1.speedLimitKmH) : p1.speedLimitKmH;

          const speedFactor = 2.1;
          const progressInc = ((targetSpeed * 1000) / 3600 / segDistMeters) * dt * speedFactor;

          st.subProgress += progressInc;
          if (st.subProgress >= 1) {
            st.subProgress = 0;
            st.waypointIndex = nextIndex;
          }

          const curLat = p1.lat + (p2.lat - p1.lat) * st.subProgress;
          const curLng = p1.lng + (p2.lng - p1.lng) * st.subProgress;
          const bearing = getBearingDegrees(p1.lat, p1.lng, p2.lat, p2.lng);

          const nextNextIndex = (nextIndex + 1) % corridor.length;
          const p3 = corridor[nextNextIndex];
          const nextBearing = getBearingDegrees(p2.lat, p2.lng, p3.lat, p3.lng);
          const bearingDiff = ((nextBearing - bearing + 540) % 360) - 180;

          const isTurningLeft = isApproachingTurn && bearingDiff < -25;
          const isTurningRight = isApproachingTurn && bearingDiff > 25;
          const distToTurn = Math.round(segDistMeters * (1 - st.subProgress));

          const prevTrail = prev['van-02']?.trailHistory || [];
          const newTrail = [...prevTrail, [curLat, curLng] as [number, number]];
          if (newTrail.length > 20) newTrail.shift();

          next['van-02'] = {
            curLat: +curLat.toFixed(5),
            curLng: +curLng.toFixed(5),
            bearing,
            speed: Math.round(targetSpeed + Math.sin(timestamp / 700) * 1.5),
            currentStreet: p1.streetName,
            nextInstruction: p2.instruction || `Turn ahead onto ${p2.streetName}`,
            distanceToNextMeters: distToTurn,
            isBlinkingLeft: isTurningLeft,
            isBlinkingRight: isTurningRight,
            isDecelerating: isApproachingTurn,
            batteryPercent: 68,
            cargoTempC: 18.5,
            regenKw: isApproachingTurn ? 2.8 : 0.6,
            trailHistory: newTrail,
          };
        }

        // Camera Chase Mode: Follow smoothly
        if (activeFollowVanId && next[activeFollowVanId] && mapInstanceRef.current) {
          const follow = next[activeFollowVanId];
          mapInstanceRef.current.panTo([follow.curLat, follow.curLng], {
            animate: true,
            duration: 0.2,
            noMoveStart: true,
          });
        }

        return next;
      });

      animFrame = requestAnimationFrame(updateVehicleSimulation);
    };

    animFrame = requestAnimationFrame(updateVehicleSimulation);
    return () => cancelAnimationFrame(animFrame);
  }, [activeFollowVanId]);

  // Render Real-Time Map Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (
      !map ||
      !nodeMarkersLayerRef.current ||
      !vanRoutesLayerRef.current ||
      !powerLinesLayerRef.current ||
      !solarHeatmapLayerRef.current ||
      !trafficLayerRef.current ||
      !landmarkBuildingsLayerRef.current
    )
      return;

    // Clear dynamic layers
    nodeMarkersLayerRef.current.clearLayers();
    vanRoutesLayerRef.current.clearLayers();
    powerLinesLayerRef.current.clearLayers();
    solarHeatmapLayerRef.current.clearLayers();
    trafficLayerRef.current.clearLayers();
    landmarkBuildingsLayerRef.current.clearLayers();

    // 1. Realistic 3D Landmark Buildings with Rooftop Solar
    if (showLandmarks) {
      LANDMARK_BUILDINGS.forEach((bldg) => {
        const polygon = L.polygon(bldg.polygon, {
          color: '#10b981',
          weight: 1.5,
          opacity: 0.8,
          fillColor: '#064e3b',
          fillOpacity: 0.35,
          className: 'shadow-lg',
        });

        polygon.bindTooltip(
          `
          <div class="p-1 font-sans text-xs">
            <div class="font-black text-emerald-300">${bldg.name}</div>
            <div class="text-[10px] text-slate-300">${bldg.category}</div>
            <div class="text-[10px] font-mono text-amber-400 mt-1 flex items-center gap-1">
              <span>☀ Rooftop Solar Array: ${bldg.solarKw} kW</span>
            </div>
          </div>
        `,
          { direction: 'top', className: 'custom-leaflet-tooltip' }
        );

        landmarkBuildingsLayerRef.current?.addLayer(polygon);
      });
    }

    // 2. Realistic Live Traffic Overlay
    if (showTraffic) {
      TRAFFIC_CORRIDORS.forEach((traffic) => {
        const color =
          traffic.status === 'free'
            ? '#10b981'
            : traffic.status === 'moderate'
            ? '#f59e0b'
            : '#ef4444';

        const trafficLine = L.polyline(traffic.points, {
          color,
          weight: 4.5,
          opacity: 0.75,
          lineCap: 'round',
          dashArray: traffic.status === 'free' ? '8, 8' : '6, 6',
          className: 'animate-traffic-flow',
        });

        trafficLine.bindTooltip(
          `
          <div class="p-1 font-sans text-xs">
            <div class="font-bold text-white">${traffic.label}</div>
            <div class="text-[10px] text-slate-300 font-mono mt-0.5">
              Avg Speed: <span class="font-bold text-emerald-400">${traffic.speedKmH} km/h</span> • Status: <span class="uppercase font-bold">${traffic.status}</span>
            </div>
          </div>
        `,
          { direction: 'top', className: 'custom-leaflet-tooltip' }
        );

        trafficLayerRef.current?.addLayer(trafficLine);
      });
    }

    // 3. Filtered Nodes
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

    // 4. Render Markers with Realistic Visuals
    filteredNodes.forEach((node) => {
      let [lat, lng] = node.lat && node.lng ? [node.lat, node.lng] : percentToLatLng(node.x, node.y);

      // Moving pickup van uses real-time GPS telemetry
      if (node.type === 'pickup_van' && realtimeTelemetry[node.id]) {
        lat = realtimeTelemetry[node.id].curLat;
        lng = realtimeTelemetry[node.id].curLng;
      }

      const isSelected = selectedNode?.id === node.id;
      let iconHtml = '';
      let markerAnchor: [number, number] = [24, 24];

      if (node.type === 'pickup_van') {
        const tel = realtimeTelemetry[node.id] || {
          bearing: node.bearing || 0,
          speed: node.speedKmH || 30,
          isBlinkingLeft: false,
          isBlinkingRight: false,
          isDecelerating: false,
          currentStreet: 'Main Arterial',
          batteryPercent: 80,
        };

        const isNight = timeOfDay === 'night' || tileStyle === 'dark';

        iconHtml = `
          <div class="relative group cursor-pointer flex items-center justify-center select-none ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <!-- Conical Headlight Beam (Sweeping forward on asphalt) -->
            <div style="transform: rotate(${tel.bearing}deg); width: 60px; height: 90px;" class="absolute bottom-1/2 left-1/2 -translate-x-1/2 origin-bottom pointer-events-none z-0">
              <div class="w-full h-full" style="
                background: linear-gradient(to top, rgba(254, 240, 138, ${isNight ? '0.75' : '0.45'}) 0%, rgba(254, 240, 138, 0.25) 40%, rgba(254, 240, 138, 0.05) 75%, transparent 100%);
                clip-path: polygon(42% 100%, 58% 100%, 100% 0%, 0% 0%);
                filter: blur(1.5px);
              "></div>
            </div>

            <!-- Pulsing Radar Halo -->
            <span class="absolute -inset-2.5 rounded-full bg-cyan-400/35 animate-ping"></span>

            <!-- High-Fidelity Van Body -->
            <div class="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-950 border-2 ${
              isSelected ? 'border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.9)] ring-4 ring-cyan-500/30' : 'border-cyan-500 shadow-xl'
            } text-cyan-400 transition-all z-10">
              
              <!-- Directional Rotating Chassis -->
              <div style="transform: rotate(${tel.bearing}deg); transition: transform 0.15s ease-out;" class="relative w-8 h-8 flex items-center justify-center">
                <!-- Vehicle Silhouette & Solar Roof Panel -->
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                  <path d="M15 18H9"/>
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                  <circle cx="17" cy="18" r="2" fill="#0891b2"/>
                  <circle cx="7" cy="18" r="2" fill="#0891b2"/>
                </svg>

                <!-- Flashing Left Turn Signal -->
                ${
                  tel.isBlinkingLeft
                    ? '<span class="absolute -left-1 top-1 w-2 h-2 rounded-full bg-amber-400 animate-turn-signal shadow-[0_0_8px_#f59e0b]"></span>'
                    : ''
                }

                <!-- Flashing Right Turn Signal -->
                ${
                  tel.isBlinkingRight
                    ? '<span class="absolute -right-1 top-1 w-2 h-2 rounded-full bg-amber-400 animate-turn-signal shadow-[0_0_8px_#f59e0b]"></span>'
                    : ''
                }

                <!-- Glowing Brake Light -->
                ${
                  tel.isDecelerating
                    ? '<span class="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 rounded bg-rose-500 shadow-[0_0_8px_#f43f5e]"></span>'
                    : ''
                }
              </div>

              <!-- Top Heading Pointer Arrow -->
              <div class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-cyan-400 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-black shadow-md" style="transform: rotate(${tel.bearing}deg)">
                ▲
              </div>
            </div>

            <!-- Realistic Floating Live Speed & Battery Pill -->
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 border border-cyan-500/50 text-[10px] font-mono font-bold text-cyan-300 px-2 py-0.5 rounded-full shadow-2xl pointer-events-none flex items-center gap-1.5 z-20">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>${tel.speed} km/h</span>
              <span class="text-slate-500">•</span>
              <span class="text-emerald-400">${tel.batteryPercent}%</span>
            </div>
          </div>
        `;
        markerAnchor = [24, 24];
      } else if (node.type === 'food_alert') {
        const isUrgent = node.urgency === 'urgent';
        iconHtml = `
          <div class="relative group cursor-pointer flex items-center justify-center transition-transform ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <span class="absolute -inset-3 rounded-full ${
              isUrgent ? 'bg-rose-500/35 animate-ping' : 'bg-amber-500/25 animate-pulse'
            }"></span>
            <div class="relative flex items-center justify-center w-10 h-10 rounded-2xl ${
              isUrgent ? 'bg-rose-950 border-2 border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)]' : 'bg-amber-950 border-2 border-amber-500 text-amber-400'
            } shadow-2xl">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 2v2"/>
                <path d="M7 2v2"/>
                <path d="M21 15V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v7a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 15z"/>
                <path d="m3.3 7 8.7 5 8.7-5"/>
                <path d="M12 22V12"/>
              </svg>
            </div>
            ${
              node.countdownMinutes !== undefined
                ? `<div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-950/95 border ${
                    isUrgent ? 'border-rose-500/80 text-rose-300' : 'border-amber-500/80 text-amber-300'
                  } text-[9px] font-bold px-2 py-0.2 rounded-full whitespace-nowrap shadow-lg">
                    ${node.countdownMinutes}m left
                   </div>`
                : ''
            }
          </div>
        `;
        markerAnchor = [20, 20];
      } else if (node.type === 'recycling_hub') {
        iconHtml = `
          <div class="relative group cursor-pointer flex items-center justify-center transition-transform ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <span class="absolute -inset-2 rounded-full bg-emerald-500/20 animate-pulse"></span>
            <div class="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-950 border-2 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
                <path d="M11 19h8.2a1.8 1.8 0 0 0 1.784-1.564 1.8 1.8 0 0 0-.74-1.776L16.2 12"/>
                <path d="m3.67 10 3.53 6h7.6"/>
                <path d="m14 5 3.8 6.5"/>
                <path d="M9.8 12.5 12.3 8l2.5 4.5"/>
              </svg>
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-emerald-500/50 text-[9px] font-black text-emerald-300 px-2 py-0.2 rounded-full whitespace-nowrap shadow-lg">
              CENTRAL HUB
            </div>
          </div>
        `;
        markerAnchor = [20, 20];
      } else {
        // transformer
        const isSpiking = (node.loadPercent || 0) > 85;
        iconHtml = `
          <div class="relative group cursor-pointer flex items-center justify-center transition-transform ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <div class="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-purple-950 border-2 ${
              isSpiking
                ? 'border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.7)] animate-pulse'
                : 'border-purple-500 text-purple-400'
            } shadow-xl">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-purple-500/50 text-[9px] font-mono font-bold ${
              isSpiking ? 'text-amber-300' : 'text-purple-300'
            } px-2 py-0.2 rounded-full whitespace-nowrap shadow-lg">
              ${node.loadPercent}% LOAD
            </div>
          </div>
        `;
        markerAnchor = [18, 18];
      }

      const customDivIcon = L.divIcon({
        className: 'leaflet-custom-node',
        html: iconHtml,
        iconSize: [48, 48],
        iconAnchor: markerAnchor,
      });

      const marker = L.marker([lat, lng], { icon: customDivIcon });
      marker.on('click', () => {
        playTacticalBeep(780, 0.08);
        onSelectNode(node);
      });

      marker.bindTooltip(
        `
        <div class="p-1.5 text-slate-100 font-sans">
          <div class="font-black text-xs text-white flex items-center gap-1.5">
            <span>${node.name}</span>
          </div>
          <div class="text-[10px] text-slate-300 mt-0.5">${node.sector} • ${node.status}</div>
          <div class="text-[10px] font-mono text-emerald-400 mt-1">GPS: ${lat.toFixed(5)}°, ${lng.toFixed(5)}°</div>
        </div>
      `,
        { direction: 'top', offset: [0, -22], className: 'custom-leaflet-tooltip' }
      );

      nodeMarkersLayerRef.current?.addLayer(marker);
    });

    // 5. Dynamic Van Trajectory Paths & Breadcrumbs
    if (showVanRoutes) {
      filteredNodes
        .filter((n) => n.type === 'pickup_van')
        .forEach((van) => {
          const tel = realtimeTelemetry[van.id];
          const isSelected = selectedNode?.id === van.id;

          // A. Glowing breadcrumb trail
          if (tel?.trailHistory && tel.trailHistory.length > 1) {
            const trail = L.polyline(tel.trailHistory, {
              color: isSelected ? '#06b6d4' : '#0891b2',
              weight: isSelected ? 4.5 : 3.5,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            });
            vanRoutesLayerRef.current?.addLayer(trail);
          }

          // B. Forward Route along Street Corridor
          const corridor = van.id === 'van-01' ? VAN_01_REALISTIC_CORRIDOR : VAN_02_REALISTIC_CORRIDOR;
          const routePoints: [number, number][] = corridor.map((p) => [p.lat, p.lng]);

          const fwdRoute = L.polyline(routePoints, {
            color: isSelected ? '#38bdf8' : '#0284c7',
            weight: isSelected ? 3.5 : 2.5,
            opacity: 0.9,
            dashArray: '8, 8',
            className: 'animate-route-flow',
          });
          vanRoutesLayerRef.current?.addLayer(fwdRoute);

          // C. Destination Beacon
          const destPoint = routePoints[Math.floor(routePoints.length / 2)];
          const destBeaconIcon = L.divIcon({
            className: 'custom-dest-beacon',
            html: `
              <div class="relative flex items-center justify-center">
                <span class="absolute w-8 h-8 rounded-full bg-cyan-400/40 animate-ping"></span>
                <div class="w-3.5 h-3.5 rounded-full bg-cyan-300 border-2 border-white shadow-xl"></div>
                <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-cyan-500/60 text-[9px] font-mono font-bold text-cyan-300 px-2 py-0.2 rounded-full whitespace-nowrap shadow-xl">
                  ETA: ${van.etaMinutes || 5}m
                </div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const destMarker = L.marker(destPoint, { icon: destBeaconIcon });
          destMarker.bindTooltip(`Next Stop: ${van.destination || 'Commercial Facility'}`, {
            direction: 'top',
            offset: [0, -10],
          });
          vanRoutesLayerRef.current?.addLayer(destMarker);
        });
    }

    // 6. Power Grid Feeder Circuits
    if (showPowerLines) {
      const transformers = nodes.filter((n) => n.type === 'transformer');
      if (transformers.length >= 2) {
        for (let i = 0; i < transformers.length - 1; i++) {
          const t1 = transformers[i];
          const t2 = transformers[i + 1];
          const pt1: [number, number] =
            t1.lat !== undefined && t1.lng !== undefined ? [t1.lat, t1.lng] : percentToLatLng(t1.x, t1.y);
          const pt2: [number, number] =
            t2.lat !== undefined && t2.lng !== undefined ? [t2.lat, t2.lng] : percentToLatLng(t2.x, t2.y);

          const feederPolyline = L.polyline([pt1, pt2], {
            color: '#c084fc',
            weight: 2.5,
            opacity: 0.65,
            dashArray: '6, 12',
            className: 'animate-grid-pulse',
          });
          powerLinesLayerRef.current?.addLayer(feederPolyline);
        }
      }
    }

    // 7. Rooftop Solar Heatmap Overlay Zones
    if (showSolarHeatmap) {
      const solarCenters: [number, number, number][] = [
        [17.432, 78.374, 260],
        [17.444, 78.396, 300],
        [17.426, 78.388, 200],
      ];

      solarCenters.forEach(([lat, lng, radius]) => {
        const circle = L.circle([lat, lng], {
          radius: radius,
          fillColor: '#f59e0b',
          fillOpacity: 0.16,
          stroke: true,
          color: '#fbbf24',
          weight: 1.5,
          opacity: 0.5,
          dashArray: '5, 5',
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
    showTraffic,
    showLandmarks,
    timeOfDay,
    tileStyle,
    realtimeTelemetry,
    playTacticalBeep,
    onSelectNode,
  ]);

  // Center on Selected Node
  useEffect(() => {
    if (!selectedNode || !mapInstanceRef.current) return;
    const [lat, lng] =
      selectedNode.lat && selectedNode.lng
        ? [selectedNode.lat, selectedNode.lng]
        : percentToLatLng(selectedNode.x, selectedNode.y);

    mapInstanceRef.current.setView([lat, lng], 16, { animate: true, duration: 0.6 });
  }, [selectedNode]);

  // Map Controls
  const handleZoomIn = () => {
    playTacticalBeep(1100, 0.05);
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    playTacticalBeep(900, 0.05);
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetView = () => {
    playTacticalBeep(1000, 0.08);
    setActiveFollowVanId(null);
    mapInstanceRef.current?.setView([17.4395, 78.384], 15, { animate: true });
  };

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
  const activeFollowTelemetry = activeFollowVanId ? realtimeTelemetry[activeFollowVanId] : null;

  return (
    <div className="relative w-full h-full min-h-[480px] sm:min-h-[540px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col bg-slate-950 map-perspective-container">
      {/* Top Floating Telemetry & Basemap API Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: CARTO Voyager API & Live Telemetry Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-slate-950/92 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-white tracking-wider font-mono">
                  CARTO VOYAGER API
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  REAL-TIME GPS
                </span>
                {retinaResolution && (
                  <span className="text-[9px] font-mono px-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    2X RETINA
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                {currentGpsReadout
                  ? `Lat: ${currentGpsReadout.lat}° • Lng: ${currentGpsReadout.lng}° (WGS84)`
                  : 'Lat: 17.4395° • Lng: 78.3840° (Cyber District)'}
              </span>
            </div>
          </div>

          {/* Active Follow Van Chase-Cam Pill */}
          {activeFollowVan && (
            <div className="bg-cyan-950/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-cyan-500/50 shadow-xl flex items-center gap-2 text-cyan-300 text-[11px] font-bold animate-pulse">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chase-Cam: {activeFollowVan.name}</span>
              <button
                onClick={() => setActiveFollowVanId(null)}
                className="text-cyan-400 hover:text-white ml-1 text-xs cursor-pointer font-black"
                title="Exit Chase Cam"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Right: Basemap Styles, Time Simulation & API Settings */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Basemap Styles Toggle */}
          <div className="bg-slate-950/92 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-1 text-[11px]">
            <button
              onClick={() => {
                setTileStyle('voyager');
                playTacticalBeep(920, 0.05);
              }}
              title="CARTO Voyager: Urban Street Cartography with rich landuse"
              className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                tileStyle === 'voyager'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/40 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Voyager
            </button>
            <button
              onClick={() => {
                setTileStyle('satellite');
                playTacticalBeep(980, 0.05);
              }}
              title="Photorealistic Satellite Hybrid with CARTO Voyager transparent labels"
              className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                tileStyle === 'satellite'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => {
                setTileStyle('dark');
                playTacticalBeep(850, 0.05);
              }}
              title="CARTO Dark Matter: Tactical Command Center"
              className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                tileStyle === 'dark'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => {
                setTileStyle('positron');
                playTacticalBeep(880, 0.05);
              }}
              title="CARTO Positron: High-Contrast Blueprint"
              className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                tileStyle === 'positron'
                  ? 'bg-slate-200 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Positron
            </button>
          </div>

          {/* Time of Day Lighting Simulator */}
          <div className="bg-slate-950/92 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-1">
            <button
              onClick={() => setTimeOfDay('day')}
              title="Solar Peak Daylight (840 W/m²)"
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                timeOfDay === 'day' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTimeOfDay('golden')}
              title="Golden Hour / Sunset Dusk"
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                timeOfDay === 'golden' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTimeOfDay('night')}
              title="Night Operations (Vehicle Headlights Active)"
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                timeOfDay === 'night' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3D Aerial Orbit Tilt Toggle */}
          <button
            onClick={() => {
              setIs3DTilt(!is3DTilt);
              playTacticalBeep(is3DTilt ? 800 : 1200, 0.08);
            }}
            title={is3DTilt ? 'Reset to Flat 2D View' : 'Engage 3D Aerial Orbit View (25° Tilt)'}
            className={`px-2.5 py-1.5 rounded-2xl border text-xs font-bold transition-all shadow-2xl flex items-center gap-1 cursor-pointer ${
              is3DTilt
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 font-black shadow-blue-500/30'
                : 'bg-slate-950/92 backdrop-blur-md text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${is3DTilt ? 'animate-spin-slow' : ''}`} />
            <span>3D Tilt</span>
          </button>

          {/* Traffic Overlay Toggle */}
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            title="Toggle Live Traffic Speeds"
            className={`p-2 rounded-2xl border transition-all shadow-2xl cursor-pointer ${
              showTraffic
                ? 'bg-blue-500/20 border-blue-400/40 text-sky-300'
                : 'bg-slate-950/92 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          {/* Audio Feedback Toggle */}
          <button
            onClick={() => setAudioFeedback(!audioFeedback)}
            title={audioFeedback ? 'Mute Tactical Audio' : 'Enable Tactical Radio Beeps'}
            className={`p-2 rounded-2xl border transition-all shadow-2xl cursor-pointer ${
              audioFeedback
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-950/92 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {audioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Carto API Key Modal Button */}
          <button
            onClick={() => setShowApiModal(!showApiModal)}
            title="Configure CARTO Voyager API Key"
            className="p-2 bg-slate-950/92 backdrop-blur-md text-slate-300 hover:text-blue-400 rounded-2xl border border-slate-800 hover:border-blue-500/40 shadow-2xl transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Leaflet Map Container with 3D Tilt transformation */}
      <div
        className={`w-full h-full flex-1 z-0 relative transition-all duration-700 ${
          is3DTilt ? 'map-tilt-3d' : 'map-tilt-flat'
        }`}
      >
        <div ref={mapElementRef} className="w-full h-full" />

        {/* Ambient Lighting Overlay for Day/Sunset/Night realism */}
        {timeOfDay === 'golden' && (
          <div className="absolute inset-0 pointer-events-none z-[400] bg-gradient-to-tr from-amber-900/20 via-orange-500/10 to-transparent mix-blend-color-burn" />
        )}
        {timeOfDay === 'night' && (
          <div className="absolute inset-0 pointer-events-none z-[400] bg-slate-950/30 mix-blend-multiply" />
        )}
      </div>

      {/* Driver Cockpit HUD: Pops up when a van is being tracked or selected */}
      {activeFollowVan && activeFollowTelemetry && (
        <div className="absolute left-3 bottom-14 z-[1000] max-w-sm w-full bg-slate-950/95 backdrop-blur-xl p-4 rounded-3xl border border-cyan-500/40 shadow-2xl space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">{activeFollowVan.name}</h4>
                <div className="text-[10px] text-cyan-400 font-mono">
                  {activeFollowTelemetry.currentStreet}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveFollowVanId(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Turn-by-turn Navigation Prompt */}
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 text-xs">
            <CornerDownRight className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <div className="text-[11px] font-bold text-white leading-tight">
                {activeFollowTelemetry.nextInstruction}
              </div>
              <div className="text-[10px] font-mono text-cyan-300">
                In {activeFollowTelemetry.distanceToNextMeters} meters
              </div>
            </div>
          </div>

          {/* Telemetry Gauge Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
            <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[9px] text-slate-400 uppercase">Speed</div>
              <div className="text-sm font-black text-cyan-300">
                {activeFollowTelemetry.speed}{' '}
                <span className="text-[9px] font-normal text-slate-400">km/h</span>
              </div>
            </div>
            <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[9px] text-slate-400 uppercase">EV Battery</div>
              <div className="text-sm font-black text-emerald-400">
                {activeFollowTelemetry.batteryPercent}%
              </div>
            </div>
            <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[9px] text-slate-400 uppercase">Cargo Temp</div>
              <div className="text-sm font-black text-amber-300">
                {activeFollowTelemetry.cargoTempC}°C
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right Floating Map Controls */}
      <div className="absolute right-3 bottom-14 z-[1000] flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="w-9 h-9 bg-slate-950/92 backdrop-blur-md text-slate-200 hover:text-white rounded-xl border border-slate-800 shadow-2xl flex items-center justify-center font-bold text-lg hover:border-slate-700 transition-all cursor-pointer"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="w-9 h-9 bg-slate-950/92 backdrop-blur-md text-slate-200 hover:text-white rounded-xl border border-slate-800 shadow-2xl flex items-center justify-center font-bold text-lg hover:border-slate-700 transition-all cursor-pointer"
        >
          −
        </button>
        <button
          onClick={handleResetView}
          title="Reset to Central District View"
          className="w-9 h-9 bg-slate-950/92 backdrop-blur-md text-slate-200 hover:text-blue-400 rounded-xl border border-slate-800 shadow-2xl flex items-center justify-center hover:border-slate-700 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          className="w-9 h-9 bg-slate-950/92 backdrop-blur-md text-slate-200 hover:text-cyan-400 rounded-xl border border-slate-800 shadow-2xl flex items-center justify-center hover:border-slate-700 transition-all cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Floating Status Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[11px]">
        {/* Left: Active Vehicles & Live Route Telemetry pill */}
        <div className="bg-slate-950/92 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-800 shadow-2xl pointer-events-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Truck className="w-3.5 h-3.5" />
            <span>{activeVanCount} EV Vans in Motion</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Street-Snapped Follower: Active</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-amber-400 font-mono">
            <Sun className="w-3 h-3" />
            <span>Solar: 840 W/m²</span>
          </div>
        </div>

        {/* Right: Map Provider Attribution */}
        <div className="bg-slate-950/92 backdrop-blur-md px-3 py-1 rounded-2xl border border-slate-800/80 shadow text-slate-400 font-mono text-[10px] pointer-events-auto flex items-center gap-1.5">
          <span>Basemap:</span>
          <span className="text-sky-400 font-bold">CARTO Voyager</span>
          <span>© OpenStreetMap</span>
        </div>
      </div>

      {/* CARTO Voyager API Key Modal Popup */}
      {showApiModal && (
        <div className="absolute inset-0 z-[1100] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
                <Key className="w-4 h-4 text-sky-400" />
                <span>CARTO Voyager Raster Tile API</span>
              </h4>
              <button
                onClick={() => setShowApiModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Configured endpoint format:
              <code className="block mt-1.5 p-2.5 bg-slate-950 rounded-xl text-sky-300 font-mono text-[11px] break-all border border-slate-800">
                https://basemaps.cartocdn.com/rastertiles/voyager/&#123;z&#125;/&#123;x&#125;/&#123;y&#125;.png?key=YOUR_KEY
              </code>
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Enter CARTO API Key:</span>
                <span className="text-sky-400 font-mono text-[11px]">
                  {apiKey.trim() ? 'Key Active' : 'Default Demo Mode'}
                </span>
              </label>
              <input
                type="text"
                placeholder="Paste CARTO API Key (e.g. carto_live_...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 font-mono shadow-inner"
              />
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={retinaResolution}
                    onChange={(e) => setRetinaResolution(e.target.checked)}
                    className="accent-blue-500 rounded"
                  />
                  <span>Enable 2x High-DPI Retina Tiles (@2x.png)</span>
                </label>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal pt-1">
                The map automatically requests high-definition CARTO Voyager raster tiles with your API key parameter. If left blank, public CARTO Voyager tiles are loaded.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  handleSaveApiKey('');
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Reset to Default
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowApiModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveApiKey(apiKey)}
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
