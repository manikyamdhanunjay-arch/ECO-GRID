import { GridAlertPlan, WasteScanResult } from '../types';

export async function scanWasteWithGemini(payload: {
  imageBase64?: string;
  mimeType?: string;
  description?: string;
  samplePresetId?: string;
}): Promise<{ data: WasteScanResult; source: string }> {
  try {
    const res = await fetch('/api/gemini/scan-waste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    return { data: json.data, source: json.source || 'gemini' };
  } catch (err: any) {
    console.warn('API error, falling back locally:', err);
    // Local fallback in case network error
    if (payload.samplePresetId === 'ewaste') {
      return {
        data: {
          itemCategory: 'e_waste',
          detectedItems: ['Lithium-Ion Battery Packs', 'Legacy Android Handsets', 'Switched-Mode AC Adapters', 'Copper Heat Sinks'],
          estimatedWeightKg: 14.2,
          shelfLifeHours: 0,
          contaminationRisk: 'medium',
          recommendedRecipientType: 'Certified E-Waste Recycling Hub',
          handlingInstructions: 'Insulate exposed battery terminals with non-conductive tape. Store in dry, flame-retardant bin away from moisture.',
          co2SavedKg: 49.7,
        },
        source: 'local-fallback',
      };
    }
    if (payload.samplePresetId === 'cardboard_pet') {
      return {
        data: {
          itemCategory: 'recyclable',
          detectedItems: ['Double-wall Corrugated Cardboard Bales', 'Clear PET #1 Beverage Bottles', 'HDPE Jugs'],
          estimatedWeightKg: 34.0,
          shelfLifeHours: 0,
          contaminationRisk: 'low',
          recommendedRecipientType: 'Municipal Material Recovery Facility (MRF)',
          handlingInstructions: 'Flatten boxes to maximize van load density. Ensure bottles are rinsed and caps separated if required by local MRF.',
          co2SavedKg: 54.4,
        },
        source: 'local-fallback',
      };
    }
    return {
      data: {
        itemCategory: 'surplus_food',
        detectedItems: ['Steam Table Basmati Rice', 'Yellow Tadka Dal', 'Paneer Tikka Curry', 'Unopened Tandoori Roti Packs'],
        estimatedWeightKg: 28.5,
        shelfLifeHours: 5.5,
        contaminationRisk: 'low',
        recommendedRecipientType: 'Community Food Bank / Night Shelter Kitchen',
        handlingInstructions: 'Maintain temperature above 60°C or chill rapidly under 4°C. Seal containers in insulated food-grade bins for pickup.',
        co2SavedKg: 71.25,
      },
      source: 'local-fallback',
    };
  }
}

export async function fetchGridPeakPlan(payload: {
  currentPeakKw: number;
  thresholdKw: number;
  solarKw: number;
  hourTime: string;
  criticalSubstation?: string;
}): Promise<{ data: GridAlertPlan; source: string }> {
  try {
    const res = await fetch('/api/gemini/grid-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    return { data: json.data, source: json.source || 'gemini' };
  } catch (err: any) {
    console.warn('Grid alert API error, fallback locally:', err);
    const overload = Math.max(15, payload.currentPeakKw - payload.thresholdKw);
    return {
      data: {
        alertTitle: `Level 2 Peak Demand Surcharge Warning (+${overload} kW Overload)`,
        severity: 'critical',
        currentOverloadKw: overload,
        targetShedKw: Math.round(overload * 1.15),
        steps: [
          {
            title: 'Pause High-Capacity EV Charging Stations',
            detail: 'Signal residential Level-2 chargers to throttle back until 22:00, preventing substation breaker trip.',
            estimatedReductionKw: 24,
          },
          {
            title: 'Pre-Cooling Thermostat Drift (+1.5°C)',
            detail: 'Shift connected community thermostats from 21.5°C to 23°C for a 90-minute window.',
            estimatedReductionKw: 28,
          },
          {
            title: 'Trigger Battery Storage Fast-Discharge',
            detail: 'Dispatch Solar Co-op 50 kWh stationary backup to feed 20 kW directly into local feeder bus.',
            estimatedReductionKw: 20,
          },
        ],
        citizenBroadcast: `Grid alert: Neighborhood power demand is +${overload} kW above safe threshold. Delay laundry and EV charging until 10 PM to earn 150 bonus EcoCredits!`,
      },
      source: 'local-fallback',
    };
  }
}

export async function translateTextsWithGemini(
  targetLanguage: string,
  texts: string[]
): Promise<string[]> {
  if (targetLanguage === 'en' || !texts || texts.length === 0) {
    return texts;
  }
  try {
    const res = await fetch('/api/gemini/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetLanguage, texts }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.translatedTexts || texts;
  } catch (err) {
    console.warn('Translation API error, keeping original text:', err);
    return texts;
  }
}
