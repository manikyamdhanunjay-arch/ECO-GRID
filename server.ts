import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security: Disable express header fingerprinting
app.disable('x-powered-by');

// Security: Strict standard security headers middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Security: Enforce tight body parsing limit (15MB for image analysis)
app.use(express.json({ limit: '15mb' }));

// Shared Gemini AI client with telemetry user agent
const apiKey = process.env.GEMINI_API_KEY || '';
const isRealApiKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 15;
let aiClient: GoogleGenAI | null = null;
if (isRealApiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Timeout helper to prevent requests from hanging if API is unreachable
function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('AI inference timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

// Allowed MIME types for uploaded image audits
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
]);

// Allowed preset identifiers
const ALLOWED_PRESET_IDS = new Set([
  'catering_trays',
  'ewaste',
  'cardboard_pet',
]);

// Helper to sanitize arbitrary user strings
function sanitizeText(input: any, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(/[<>]/g, '').trim();
}

// 1. Multimodal Waste & Surplus Scanning Route
app.post('/api/gemini/scan-waste', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, description, samplePresetId } = req.body;

    // Validate inputs
    const sanitizedDesc = sanitizeText(description, 1500);
    const validPresetId = typeof samplePresetId === 'string' && ALLOWED_PRESET_IDS.has(samplePresetId)
      ? samplePresetId
      : undefined;

    let validMime = 'image/jpeg';
    if (typeof mimeType === 'string' && ALLOWED_MIME_TYPES.has(mimeType)) {
      validMime = mimeType;
    }

    // Fallback if AI client is unconfigured
    if (!aiClient) {
      const fallbackResult = getFallbackScanResult(validPresetId, sanitizedDesc);
      return res.json({ success: true, data: fallbackResult, source: 'simulated' });
    }

    const contents: any[] = [];

    // Robust base64 image validator (only raster images, explicitly disallows SVGs and malformed strings)
    if (typeof imageBase64 === 'string' && imageBase64.length > 100) {
      const isSvg = imageBase64.includes('image/svg') || imageBase64.includes('<svg') || imageBase64.includes('xml');
      if (!isSvg) {
        let cleanBase64 = '';
        let detectedMime = ALLOWED_MIME_TYPES.has(mimeType) ? mimeType : 'image/jpeg';

        if (imageBase64.startsWith('data:')) {
          const commaIndex = imageBase64.indexOf(',');
          if (commaIndex !== -1) {
            const header = imageBase64.slice(0, commaIndex);
            if (header.includes(';base64')) {
              const mimeMatch = header.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64/);
              if (mimeMatch && ALLOWED_MIME_TYPES.has(mimeMatch[1])) {
                detectedMime = mimeMatch[1];
              }
              cleanBase64 = imageBase64.slice(commaIndex + 1).replace(/\s+/g, '');
            }
          }
        } else if (/^[A-Za-z0-9+/=]+$/.test(imageBase64.trim())) {
          cleanBase64 = imageBase64.trim().replace(/\s+/g, '');
        }

        // Only attach if pure base64 string and at least 100 characters
        if (cleanBase64.length >= 100 && /^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
          contents.push({
            inlineData: {
              mimeType: detectedMime,
              data: cleanBase64,
            },
          });
        }
      }
    }

    const presetContext = validPresetId === 'catering_trays'
      ? 'Preset: Surplus Catering Trays (Steam table basmati rice, paneer butter masala, yellow dal tadka, fresh rotis in stainless banquet containers).'
      : validPresetId === 'ewaste'
      ? 'Preset: Mixed Household E-Waste (Old smartphones, lithium-ion battery packs, laptop AC adapters, copper heatsinks).'
      : validPresetId === 'cardboard_pet'
      ? 'Preset: Clean Cardboard & PET Bottles (Baled corrugated shipping cartons and clean clear PET drinking water bottles).'
      : '';

    const textPrompt = `You are EcoGrid AI, an expert multimodal waste auditor, food rescue coordinator, and circular economy specialist.
Analyze this waste or surplus item:
${presetContext ? `${presetContext}\n` : ''}${sanitizedDesc ? `User notes: "${sanitizedDesc}"` : ''}

Provide an accurate, realistic assessment and return strictly a structured JSON object according to the schema.
Estimate realistic weight in kilograms, remaining shelf life in hours (for food) or usable lifespan, contamination risk level, recommended recipient type (e.g. "Community Food Bank", "E-Waste Processing Center", "Commercial Composting Facility", "PET & Plastic Recycler"), practical handling instructions, and estimated kg of CO2e avoided if properly diverted from landfill.`;

    contents.push({ text: textPrompt });

    const response = await withTimeout(
      aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: contents },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              itemCategory: {
                type: Type.STRING,
                description: 'Must be one of: surplus_food, recyclable, e_waste, compostable, hazardous',
              },
              detectedItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of specific items detected or identified',
              },
              estimatedWeightKg: {
                type: Type.NUMBER,
                description: 'Estimated weight in kilograms',
              },
              shelfLifeHours: {
                type: Type.NUMBER,
                description: 'Remaining shelf life in hours before spoilage (or 0 for non-perishables)',
              },
              contaminationRisk: {
                type: Type.STRING,
                description: 'Must be one of: low, medium, high',
              },
              recommendedRecipientType: {
                type: Type.STRING,
                description: 'Recommended recipient facility or organization type',
              },
              handlingInstructions: {
                type: Type.STRING,
                description: 'Crucial storage, hygiene, or safe transport guidelines',
              },
              co2SavedKg: {
                type: Type.NUMBER,
                description: 'Estimated kg of CO2 equivalent avoided by diversion',
              },
            },
            required: [
              'itemCategory',
              'detectedItems',
              'estimatedWeightKg',
              'shelfLifeHours',
              'contaminationRisk',
              'recommendedRecipientType',
              'handlingInstructions',
              'co2SavedKg',
            ],
          },
        },
      }),
      4500
    );

    const jsonText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(jsonText);
    return res.json({ success: true, data: parsedData, source: 'gemini' });
  } catch (error: any) {
    // Log server-side securely without returning internal errors to client
    console.error('Audit operation error:', error?.message || 'Unknown error');
    const fallbackResult = getFallbackScanResult(req.body.samplePresetId, req.body.description);
    return res.json({ success: true, data: fallbackResult, source: 'fallback' });
  }
});

// 2. Grid Peak Shaving Advisory Route
app.post('/api/gemini/grid-alert', async (req: Request, res: Response) => {
  try {
    const rawPeak = Number(req.body.currentPeakKw);
    const rawThreshold = Number(req.body.thresholdKw);
    const rawSolar = Number(req.body.solarKw);

    const currentPeakKw = !isNaN(rawPeak) && rawPeak > 0 && rawPeak < 5000 ? rawPeak : 485;
    const thresholdKw = !isNaN(rawThreshold) && rawThreshold > 0 && rawThreshold < 5000 ? rawThreshold : 420;
    const solarKw = !isNaN(rawSolar) && rawSolar >= 0 && rawSolar < 2000 ? rawSolar : 15;
    const hourTime = sanitizeText(req.body.hourTime, 10) || '19:00';
    const criticalSubstation = sanitizeText(req.body.criticalSubstation, 100) || 'Substation Transformer T-04 (Market West)';

    if (!aiClient) {
      const fallbackAlert = getFallbackGridPlan(currentPeakKw, thresholdKw);
      return res.json({ success: true, data: fallbackAlert, source: 'simulated' });
    }

    const prompt = `You are EcoGrid AI Energy Dispatcher.
The neighborhood transformer substation (${criticalSubstation}) is experiencing an evening peak load spike.
Current Demand: ${currentPeakKw} kW.
Safe Grid Capacity Threshold: ${thresholdKw} kW (Overload: +${Math.max(0, currentPeakKw - thresholdKw)} kW).
Current Solar Output: ${solarKw} kW (sunset phase, ${hourTime}).

Generate an urgent, actionable community peak-shaving directive.
Return strictly a JSON object with:
1. alertTitle: Short urgent headline
2. severity: "critical" | "warning" | "advisory"
3. currentOverloadKw: number
4. targetShedKw: number
5. steps: an array of 3 distinct, immediately actionable community load-shifting steps (each with title, detail, estimatedReductionKw)
6. citizenBroadcast: a concise 2-sentence push notification broadcast to send to neighborhood phone apps.`;

    const response = await withTimeout(
      aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              alertTitle: { type: Type.STRING },
              severity: { type: Type.STRING },
              currentOverloadKw: { type: Type.NUMBER },
              targetShedKw: { type: Type.NUMBER },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    detail: { type: Type.STRING },
                    estimatedReductionKw: { type: Type.NUMBER },
                  },
                  required: ['title', 'detail', 'estimatedReductionKw'],
                },
              },
              citizenBroadcast: { type: Type.STRING },
            },
            required: ['alertTitle', 'severity', 'currentOverloadKw', 'targetShedKw', 'steps', 'citizenBroadcast'],
          },
        },
      }),
      4500
    );

    const parsedData = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, data: parsedData, source: 'gemini' });
  } catch (error: any) {
    console.error('Grid alert advisory error:', error?.message || 'Unknown error');
    const fallbackAlert = getFallbackGridPlan(req.body.currentPeakKw, req.body.thresholdKw);
    return res.json({ success: true, data: fallbackAlert, source: 'fallback' });
  }
});

// 3. Multilingual Alert Translation Route
app.post('/api/gemini/translate', async (req: Request, res: Response) => {
  try {
    const { targetLanguage, texts } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Valid texts array required' });
    }

    // Restrict languages securely
    if (targetLanguage !== 'hi' && targetLanguage !== 'te') {
      return res.json({ success: true, translatedTexts: texts });
    }

    // Limit array size & text lengths to prevent denial of service
    const safeTexts = texts.slice(0, 25).map((t: any) => sanitizeText(t, 400));

    if (!aiClient) {
      return res.json({ success: true, translatedTexts: safeTexts });
    }

    const langName = targetLanguage === 'hi' ? 'Hindi' : 'Telugu';

    const prompt = `Translate the following micro-waste and energy alert messages into natural, culturally resonant ${langName}.
Keep terms like "EcoGrid", "EcoCredits", "kW", "kg" recognizable.
Return strictly a JSON object with a single key "translations" containing an array of strings in the exact same order.

Texts to translate:
${JSON.stringify(safeTexts)}`;

    const response = await withTimeout(
      aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['translations'],
          },
        },
      }),
      4500
    );

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, translatedTexts: parsed.translations || safeTexts });
  } catch (error: any) {
    console.error('Translation service error:', error?.message || 'Unknown error');
    return res.json({ success: true, translatedTexts: req.body.texts || [] });
  }
});

// Fallback generators for uninterrupted uptime
function getFallbackScanResult(presetId?: string, description?: string) {
  if (presetId === 'catering_trays' || (description && description.toLowerCase().includes('food'))) {
    return {
      itemCategory: 'surplus_food',
      detectedItems: ['Steam Table Basmati Rice', 'Yellow Tadka Dal', 'Paneer Tikka Curry', 'Unopened Tandoori Roti Packs'],
      estimatedWeightKg: 28.5,
      shelfLifeHours: 5.5,
      contaminationRisk: 'low',
      recommendedRecipientType: 'Community Food Bank / Night Shelter Kitchen',
      handlingInstructions: 'Maintain temperature above 60°C or chill rapidly under 4°C. Seal containers in insulated food-grade bins for pickup.',
      co2SavedKg: 71.25,
    };
  }

  if (presetId === 'ewaste' || (description && (description.toLowerCase().includes('phone') || description.toLowerCase().includes('electronic')))) {
    return {
      itemCategory: 'e_waste',
      detectedItems: ['Lithium-Ion Battery Packs', 'Legacy Android Handsets', 'Switched-Mode AC Adapters', 'Copper Heat Sinks'],
      estimatedWeightKg: 14.2,
      shelfLifeHours: 0,
      contaminationRisk: 'medium',
      recommendedRecipientType: 'Certified E-Waste Recycling Hub',
      handlingInstructions: 'Insulate exposed battery terminals with non-conductive tape. Store in dry, flame-retardant bin away from moisture.',
      co2SavedKg: 49.7,
    };
  }

  return {
    itemCategory: 'recyclable',
    detectedItems: ['Double-wall Corrugated Cardboard Bales', 'Clear PET #1 Beverage Bottles', 'HDPE Jugs'],
    estimatedWeightKg: 34.0,
    shelfLifeHours: 0,
    contaminationRisk: 'low',
    recommendedRecipientType: 'Municipal Material Recovery Facility (MRF)',
    handlingInstructions: 'Flatten boxes to maximize van load density. Ensure bottles are rinsed and caps separated if required by local MRF.',
    co2SavedKg: 54.4,
  };
}

function getFallbackGridPlan(currentPeakKw = 485, thresholdKw = 420) {
  const overload = Math.max(15, currentPeakKw - thresholdKw);
  return {
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
  };
}

// Global safe error handling middleware (prevents unhandled exceptions from leaking traces)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server exception:', err?.message || 'Internal error');
  res.status(500).json({ success: false, error: 'A service error occurred. Please try again.' });
});

// Setup Vite for development or static serving for production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EcoGrid] Secure full-stack server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handlers for container/git deployment
  const shutdown = () => {
    console.log('[EcoGrid] Shutting down gracefully...');
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
