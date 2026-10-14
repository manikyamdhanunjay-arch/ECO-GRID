import React, { useState } from 'react';
import {
  Upload,
  Camera,
  Sparkles,
  AlertTriangle,
  Clock,
  Scale,
  ShieldCheck,
  Building2,
  FileText,
  Truck,
  CheckCircle2,
  Zap,
  ArrowRight,
  ExternalLink,
  Info,
  RefreshCw,
  Compass,
  Star,
  MapPin,
  Scan,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  RecipientHub,
  SupportedLanguage,
  WasteCategory,
  WasteScanResult,
} from '../types';
import { RECIPIENT_HUBS, SAMPLE_PRESETS, UI_TRANSLATIONS } from '../data/mockData';
import { scanWasteWithGemini } from '../services/api';
import {
  MotionCard,
  MotionScanningLaser,
  StaggerContainer,
  StaggerItem,
  motion,
} from './motion/MotionTransitions';

interface WasteScannerTabProps {
  language: SupportedLanguage;
  onDispatchSuccess: (
    scanResult: WasteScanResult,
    recipient: RecipientHub,
    customTitle: string
  ) => void;
}

export const WasteScannerTab: React.FC<WasteScannerTabProps> = ({
  language,
  onDispatchSuccess,
}) => {
  const t = UI_TRANSLATIONS[language]?.scanner || UI_TRANSLATIONS.en.scanner;

  const [selectedPresetId, setSelectedPresetId] = useState<string>('catering_trays');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customMimeType, setCustomMimeType] = useState<string>('image/jpeg');
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<WasteScanResult | null>(null);
  const [scanSource, setScanSource] = useState<string>('');
  const [dispatchedHubId, setDispatchedHubId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Initialize with sample preset
  React.useEffect(() => {
    handleSelectPreset('catering_trays');
  }, []);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setCustomImage(null);
    setUploadError(null);
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setDescriptionInput(preset.description);
    }
  };

  // Secure client-side file upload validator
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Security check: validate size (max 8MB)
    const MAX_SIZE_BYTES = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError('Image size exceeds 8MB limit. Please select a smaller photo.');
      return;
    }

    // Security check: validate MIME type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setUploadError('Unsupported file type. Please upload a standard JPG, PNG, or WEBP image.');
      return;
    }

    setCustomMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setCustomImage(reader.result as string);
      setSelectedPresetId('');
      if (!descriptionInput) {
        setDescriptionInput(`Uploaded item: ${file.name.replace(/\.[^/.]+$/, '')}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setDispatchedHubId(null);

    // If the user uploaded an actual file, pass it as imageBase64
    // If it's a sample preset, pass the preset ID and prompt so Gemini evaluates the structured batch cleanly
    const imagePayload = customImage ? customImage : undefined;

    const res = await scanWasteWithGemini({
      imageBase64: imagePayload,
      mimeType: customImage ? customMimeType : undefined,
      description: descriptionInput,
      samplePresetId: selectedPresetId || undefined,
    });

    setScanResult(res.data);
    setScanSource(res.source);
    setIsScanning(false);
  };

  const getRankedRecipients = (category?: WasteCategory): RecipientHub[] => {
    if (!category) return RECIPIENT_HUBS.slice(0, 3);

    let matching = RECIPIENT_HUBS.filter((hub) => {
      if (category === 'surplus_food') return hub.type === 'ngo_food';
      if (category === 'recyclable') return hub.type === 'recycling';
      if (category === 'e_waste') return hub.type === 'ewaste';
      if (category === 'compostable') return hub.type === 'compost';
      return true;
    });

    if (matching.length < 3) {
      const rest = RECIPIENT_HUBS.filter((h) => !matching.includes(h));
      matching = [...matching, ...rest];
    }

    return matching.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3);
  };

  const handleDispatch = (hub: RecipientHub) => {
    if (!scanResult) return;
    setDispatchedHubId(hub.id);

    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6'],
      });
    } catch (e) {
      // safe fallback
    }

    const title =
      selectedPresetId === 'catering_trays'
        ? 'Catering Banquet Surplus'
        : selectedPresetId === 'ewaste'
        ? 'E-Waste Recovery Batch'
        : selectedPresetId === 'cardboard_pet'
        ? 'Cardboard & PET Materials'
        : 'Community Surplus Waste';

    onDispatchSuccess(scanResult, hub, title);
  };

  const currentPreviewImage =
    customImage ||
    SAMPLE_PRESETS.find((p) => p.id === selectedPresetId)?.mockImage ||
    SAMPLE_PRESETS[0].mockImage;

  const rankedHubs = getRankedRecipients(scanResult?.itemCategory);

  return (
    <div className="space-y-8">
      {/* Tab Header Banner with Aurora Gradient */}
      {/* Top Banner with Gemini Multimodal Branding */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900 p-6 sm:p-7 rounded-3xl border border-blue-500/35 shadow-[0_4px_30px_rgba(37,99,235,0.25)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-sky-300 text-xs font-medium mb-2.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Multimodal Gemini 3.8 Flash Circular Resource Classifier</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed font-normal">
              {t.subtitle}
            </p>
          </div>

          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-blue-950/80 transition-all duration-300 hover:scale-102 cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Auditing Stream...</span>
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 text-white" />
                <span>Scan & Classify with Gemini</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Quick Selectors with Fluid Gradients */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 font-mono">
            <Compass className="w-4 h-4 text-amber-400" />
            {t.samplePresetsTitle}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">1-Click Live Auditing</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {SAMPLE_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <MotionCard
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`cursor-pointer p-5 rounded-3xl border transition-all text-left ${
                  isSelected
                    ? 'bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/60 border-blue-400 ring-2 ring-blue-500/40 shadow-[0_0_25px_rgba(37,99,235,0.35)]'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-3xl filter drop-shadow">{preset.previewIcon}</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                      preset.badgeColor === 'amber'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : preset.badgeColor === 'blue'
                        ? 'bg-blue-500/20 text-sky-300 border-blue-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">{preset.name}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {preset.subtitle}
                </p>
              </MotionCard>
            );
          })}
        </div>
      </div>

      {/* Upload Dropzone & Visual Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Media Preview & File Picker with Motion Laser Scanner */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-white uppercase tracking-widest font-mono">
                Visual Inspection Feed
              </span>
            </div>
            {customImage && (
              <button
                onClick={() => setCustomImage(null)}
                className="text-xs text-rose-400 hover:underline cursor-pointer font-medium"
              >
                Reset Image
              </button>
            )}
          </div>

          {/* Visual Container with Motion Laser Animation */}
          <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group shadow-inner">
            {currentPreviewImage ? (
              <img
                src={currentPreviewImage}
                alt="Waste item scan"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="text-center text-slate-500 text-xs">
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                <span>Upload an image of surplus food, electronics, or cardboard</span>
              </div>
            )}

            {/* Fluid Motion-driven Laser Beam */}
            <MotionScanningLaser active={isScanning} />

            {/* AI HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none border border-emerald-500/20 rounded-2xl flex flex-col justify-between p-3.5">
              <div className="flex justify-between items-start text-[10px] font-mono text-emerald-300/90 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800">
                <span>GEMINI-3.8-FLASH</span>
                <span className="text-emerald-400 font-bold">{isScanning ? 'ANALYZING...' : 'SPECTRAL READY'}</span>
              </div>
              <div className="text-[10px] font-mono text-emerald-300/90 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800 w-fit">
                SPECTRAL: MULTIMODAL VISION
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* File Picker Actions */}
          <div className="mt-4 flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-bold cursor-pointer border border-slate-700 transition-all duration-300 shadow-md">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Upload Custom Image (Max 8MB)</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Right: Notes & Ingestion Context */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-white uppercase tracking-widest font-mono">
                Auditor Notes & Ingestion Context
              </span>
            </div>

            <textarea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="e.g. 8 trays of freshly prepared hot biryani, sealed warm in catering containers..."
              rows={5}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all leading-relaxed"
            />

            <div className="mt-3 p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/30 text-[11px] text-sky-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <span className="leading-relaxed">
                Gemini extracts estimated batch mass (kg), spoilage window (hours), contamination risk level, and assigns the optimal destination.
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Ready: {selectedPresetId ? `preset: ${selectedPresetId}` : 'custom item'}
            </span>
            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs shadow-lg shadow-blue-950/60 transition-all duration-300 hover:scale-105 cursor-pointer disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Run Live AI Audit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Structured JSON Result Cards */}
      {scanResult && (
        <div className="space-y-6 pt-2 animate-fluid-fade">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-black text-white tracking-wide">
                Audited Resource Assessment
              </h3>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-blue-500/20 text-sky-300 border border-blue-400/40 font-bold">
              Gemini JSON Response Verified
            </span>
          </div>

          {/* Cards Grid with Specular Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category */}
            <div className="bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
                {t.detectedCategory}
              </span>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full border uppercase tracking-wider ${
                    scanResult.itemCategory === 'surplus_food'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : scanResult.itemCategory === 'e_waste'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  }`}
                >
                  {scanResult.itemCategory.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Estimated Weight */}
            <div className="bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
                {t.estimatedWeight}
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <Scale className="w-4 h-4 text-emerald-400 mr-1" />
                <span className="text-2xl font-black text-white font-mono">
                  {scanResult.estimatedWeightKg}
                </span>
                <span className="text-xs text-slate-400 font-mono">kg batch</span>
              </div>
            </div>

            {/* Shelf Life Urgency */}
            <div className="bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
                {t.shelfLife}
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <Clock className="w-4 h-4 text-amber-400 mr-1" />
                <span className="text-2xl font-black text-amber-300 font-mono">
                  {scanResult.shelfLifeHours > 0
                    ? `${scanResult.shelfLifeHours} hrs`
                    : 'Non-perishable'}
                </span>
              </div>
            </div>

            {/* CO2e Avoidance */}
            <div className="bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
                {t.carbonOffset}
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <ShieldCheck className="w-4 h-4 text-teal-400 mr-1" />
                <span className="text-2xl font-black text-transparent bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text font-mono">
                  +{scanResult.co2SavedKg}
                </span>
                <span className="text-xs text-slate-400 font-mono">kg CO2e</span>
              </div>
            </div>
          </div>

          {/* Identified Items Pills & Safety Protocol */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
              <span className="text-xs font-black text-white uppercase tracking-widest font-mono block mb-3">
                {t.itemsDetected}
              </span>
              <div className="flex flex-wrap gap-2">
                {scanResult.detectedItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 text-xs font-semibold"
                  >
                    • {item}
                  </span>
                ))}
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Contamination Risk:</span>
                <span
                  className={`font-black uppercase px-2.5 py-0.5 rounded-md ${
                    scanResult.contaminationRisk === 'low'
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : scanResult.contaminationRisk === 'medium'
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-rose-400 bg-rose-500/10'
                  }`}
                >
                  {scanResult.contaminationRisk} Risk
                </span>
              </div>
            </div>

            <div className="bg-slate-900/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
              <span className="text-xs font-black text-white uppercase tracking-widest font-mono block mb-2.5">
                {t.handlingTips}
              </span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                {scanResult.handlingInstructions}
              </p>
              <div className="mt-3.5 text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Target Facility: {scanResult.recommendedRecipientType}</span>
              </div>
            </div>
          </div>

          {/* Top 3 Ranked NGO / Recycler Match Cards */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-white tracking-wide">
                  {t.rankedRecipients}
                </h4>
                <p className="text-xs text-slate-400">
                  Ranked by live transit distance, current available capacity, and acceptance criteria.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rankedHubs.map((hub, rankIdx) => {
                const isDispatched = dispatchedHubId === hub.id;
                return (
                  <MotionCard
                    key={hub.id}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                      isDispatched
                        ? 'bg-gradient-to-br from-blue-950/80 to-slate-900 border-blue-400 ring-2 ring-blue-500/40 shadow-[0_0_30px_rgba(37,99,235,0.35)]'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:shadow-xl'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20 text-sky-300 border border-blue-400/30">
                          #{rankIdx + 1} Best Match
                        </span>
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{hub.rating}</span>
                        </div>
                      </div>

                      <h5 className="font-bold text-sm text-white">{hub.name}</h5>
                      <span className="text-[10px] text-sky-400 font-semibold block mt-0.5">
                        {hub.badge}
                      </span>

                      <div className="mt-3.5 space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            Distance:
                          </span>
                          <span className="font-mono text-white font-bold">
                            {hub.distanceKm} km away
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Available Intake:</span>
                          <span className="font-mono text-cyan-400 font-bold">
                            {hub.capacityAvailableKg} kg
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Hours:</span>
                          <span className="text-slate-300 text-[11px] font-medium">{hub.operatingHours}</span>
                        </div>
                      </div>

                      <div className="mt-3.5 flex flex-wrap gap-1">
                        {hub.accepts.slice(0, 2).map((acc, aIdx) => (
                          <span
                            key={aIdx}
                            className="text-[9px] px-2 py-0.5 rounded-lg bg-slate-950 text-slate-400 border border-slate-800"
                          >
                            {acc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-slate-800">
                      {isDispatched ? (
                        <div className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs shadow-md">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Van Dispatched!</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDispatch(hub)}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs shadow-lg shadow-blue-950/80 transition-all duration-300 hover:scale-102 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5 text-white" />
                          <span>{t.dispatchPickup}</span>
                        </button>
                      )}
                    </div>
                  </MotionCard>
                );
              })}
            </div>

            {dispatchedHubId && (
              <div className="p-4 rounded-3xl bg-blue-950/40 border border-blue-500/40 text-sky-200 text-xs flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>
                    <strong>Pickup Successfully Dispatched!</strong> Added to the Live Neighborhood Map & AI Dispatch Feed.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
