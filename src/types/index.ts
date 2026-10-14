export type WasteCategory = 'surplus_food' | 'recyclable' | 'e_waste' | 'compostable' | 'hazardous';

export interface WasteScanResult {
  itemCategory: WasteCategory;
  detectedItems: string[];
  estimatedWeightKg: number;
  shelfLifeHours: number;
  contaminationRisk: 'low' | 'medium' | 'high';
  recommendedRecipientType: string;
  handlingInstructions: string;
  co2SavedKg: number;
}

export interface RecipientHub {
  id: string;
  name: string;
  type: 'ngo_food' | 'recycling' | 'ewaste' | 'compost';
  distanceKm: number;
  capacityAvailableKg: number;
  rating: number;
  operatingHours: string;
  verified: boolean;
  address: string;
  phone: string;
  accepts: string[];
  badge: string;
}

export interface MapNode {
  id: string;
  name: string;
  type: 'food_alert' | 'recycling_hub' | 'pickup_van' | 'transformer';
  sector: 'North Hills' | 'Green Valley' | 'Market Square' | 'Solar Park' | 'Tech Corridor';
  x: number; // 0 - 100% canvas coordinates
  y: number; // 0 - 100% canvas coordinates
  lat?: number; // Real GPS Latitude
  lng?: number; // Real GPS Longitude
  status: string;
  color: 'amber' | 'emerald' | 'blue' | 'purple';
  urgency: 'urgent' | 'normal' | 'optimal';
  details: string;
  address?: string;
  countdownMinutes?: number;
  loadPercent?: number;
  currentLoadKw?: number;
  capacityKw?: number;
  driverName?: string;
  destination?: string;
  etaMinutes?: number;
  itemsCount?: string;
  batteryLevel?: number;
  speedKmH?: number;
  bearing?: number;
  routeWaypoints?: { x: number; y: number }[];
  contactPhone?: string;
}

export interface DispatchEvent {
  id: string;
  timestamp: string;
  type: 'pickup_dispatched' | 'food_rescued' | 'peak_alert' | 'pledge_activated' | 'milestone';
  title: string;
  description: string;
  co2ImpactKg?: number;
  mealsCount?: number;
  kwImpact?: number;
  badge: string;
}

export interface EnergyHourlyData {
  hour: string;
  hourNumber: number;
  demandKw: number;
  solarKw: number;
  safeThresholdKw: number;
  optimizedDemandKw: number;
  isPeak: boolean;
}

export interface PeakPledge {
  id: string;
  title: string;
  description: string;
  kwReduction: number;
  ecoCredits: number;
  active: boolean;
  category: 'ev' | 'hvac' | 'appliances' | 'battery' | 'lighting';
  participantsCount: number;
}

export interface GridAlertPlan {
  alertTitle: string;
  severity: 'critical' | 'warning' | 'advisory';
  currentOverloadKw: number;
  targetShedKw: number;
  steps: {
    title: string;
    detail: string;
    estimatedReductionKw: number;
  }[];
  citizenBroadcast: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  role: string;
  avatar: string;
  wasteDivertedKg: number;
  peakShavedKw: number;
  ecoCredits: number;
  badge: string;
  pockets: string;
}

export type SupportedLanguage = 'en' | 'hi' | 'te';
