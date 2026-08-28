import { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Layers,
  Building,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileImage,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Ruler,
} from 'lucide-react';
import { defaultDetector } from '@/services/footprint/Detector';
import { generatePropertyFromFloorplan } from '@/services/generator/PropertyGenerator';
import { FootprintOverlayCanvas } from './FootprintOverlayCanvas';
import type {
  DetectedFootprint,
  BuildingParameters,
  FloorplanImageSource,
  ConfirmedDimensions,
} from '@/types/floorplan';
import type { Parcel } from '@/types/property';

interface CreatePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateProperty: (parcel: Parcel) => void;
}

type Step = 'upload' | 'review' | 'parameters' | 'generating';

// Reference Architectural Blueprint SVG (18.00m × 14.50m = 261.00 sq.m ≈ 2,809 sq.ft)
const SAMPLE_FLOORPLAN_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="650" viewBox="0 0 800 650" fill="%230f172a">
  <rect width="800" height="650" fill="%230b1120" />
  
  <!-- Subtle Blueprint Grid -->
  <defs>
    <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="%231e293b" stroke-width="0.8"/>
    </pattern>
  </defs>
  <rect width="800" height="650" fill="url(%23grid)" />

  <!-- Outer Dimension Line: Top (18.00 m) -->
  <line x1="130" y1="55" x2="670" y2="55" stroke="%2338bdf8" stroke-width="1.5" />
  <line x1="130" y1="45" x2="130" y2="85" stroke="%2338bdf8" stroke-width="1" stroke-dasharray="2 2" />
  <line x1="670" y1="45" x2="670" y2="85" stroke="%2338bdf8" stroke-width="1" stroke-dasharray="2 2" />
  <polygon points="130,55 140,51 140,59" fill="%2338bdf8" />
  <polygon points="670,55 660,51 660,59" fill="%2338bdf8" />
  <text x="400" y="48" fill="%2338bdf8" font-size="13" font-family="monospace" text-anchor="middle" font-weight="bold">18.00 m</text>

  <!-- Outer Dimension Line: Right (14.50 m) -->
  <line x1="720" y1="100" x2="720" y2="535" stroke="%2338bdf8" stroke-width="1.5" />
  <line x1="685" y1="100" x2="735" y2="100" stroke="%2338bdf8" stroke-width="1" stroke-dasharray="2 2" />
  <line x1="685" y1="535" x2="735" y2="535" stroke="%2338bdf8" stroke-width="1" stroke-dasharray="2 2" />
  <polygon points="720,100 716,110 724,110" fill="%2338bdf8" />
  <polygon points="720,535 716,525 724,525" fill="%2338bdf8" />
  <text x="755" y="325" fill="%2338bdf8" font-size="13" font-family="monospace" text-anchor="middle" transform="rotate(90 755 325)" font-weight="bold">14.50 m</text>

  <!-- North Arrow Compass (Top-Right) -->
  <circle cx="740" cy="50" r="20" fill="%231e293b" stroke="%230284c7" stroke-width="1.5" />
  <polygon points="740,35 735,50 740,46" fill="%2338bdf8" />
  <polygon points="740,35 745,50 740,46" fill="%230284c7" />
  <text x="740" y="30" fill="%2338bdf8" font-size="10" font-family="sans-serif" text-anchor="middle" font-weight="bold">N</text>

  <!-- MAIN EXTERIOR STRUCTURAL BUILDING WALLS (18.00m x 14.50m / 540px x 435px) -->
  <rect x="130" y="100" width="540" height="435" fill="%231e293b" stroke="%230284c7" stroke-width="12" rx="2" />

  <!-- Internal Partition Walls -->
  <line x1="130" y1="317" x2="670" y2="317" stroke="%230284c7" stroke-width="6" />
  <line x1="400" y1="100" x2="400" y2="535" stroke="%230284c7" stroke-width="6" />
  <!-- Central Structural Core / Elevator Shaft -->
  <rect x="330" y="247" width="140" height="140" fill="%230f172a" stroke="%2322d3ee" stroke-width="4" stroke-dasharray="4 4" />
  <text x="400" y="322" fill="%2338bdf8" font-size="12" font-family="sans-serif" text-anchor="middle" font-weight="bold">CORE / LIFT</text>
  
  <text x="265" y="210" fill="%2394a3b8" font-size="15" font-family="sans-serif" text-anchor="middle">SUITE 01</text>
  <text x="535" y="210" fill="%2394a3b8" font-size="15" font-family="sans-serif" text-anchor="middle">SUITE 02</text>
  <text x="265" y="430" fill="%2394a3b8" font-size="15" font-family="sans-serif" text-anchor="middle">SUITE 03</text>
  <text x="535" y="430" fill="%2394a3b8" font-size="15" font-family="sans-serif" text-anchor="middle">SUITE 04</text>
</svg>`;

export function CreatePropertyModal({
  isOpen,
  onClose,
  onGenerateProperty,
}: CreatePropertyModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [imageSource, setImageSource] = useState<FloorplanImageSource | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedFootprint, setDetectedFootprint] = useState<DetectedFootprint | null>(null);

  // Authoritative physical dimensions confirmed by user (Single Source of Truth)
  const [confirmedDimensions, setConfirmedDimensions] = useState<ConfirmedDimensions>({
    widthMeters: 18.0,
    depthMeters: 14.5,
  });

  // Vertical and identity parameters
  const [params, setParams] = useState<BuildingParameters>({
    floorsAbove: 4,
    basements: 1,
    floorHeight: 3.0,
    slabThickness: 0.2,
    propertyName: 'Apex Horizon — Cadastre Twin',
    parcelId: 'KA-BLR-GEN-002',
    buildingLabel: 'Tower 01',
    ownerName: 'Apex Properties Ltd.',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep('upload');
      setImageSource(null);
      setDetectedFootprint(null);
      setErrorMsg(null);
      setIsProcessing(false);
      setConfirmedDimensions({ widthMeters: 18.0, depthMeters: 14.5 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Process image for footprint
  const runDetection = (imgSrc: FloorplanImageSource) => {
    setIsProcessing(true);
    setErrorMsg(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        const result = await defaultDetector.detectFootprint(img);
        setDetectedFootprint(result);

        if (imgSrc.isPreset) {
          // Reference blueprint is explicitly 18.00m x 14.50m (261.00 sq.m = 2,809 sq.ft)
          setConfirmedDimensions({
            widthMeters: 18.0,
            depthMeters: 14.5,
          });
        } else if (result.aspectRatio > 0) {
          const isNearRef = Math.abs(result.aspectRatio - 18.0 / 14.5) < 0.25;
          const initialWidth = 18.0;
          const initialDepth = isNearRef
            ? 14.5
            : Number((initialWidth / result.aspectRatio).toFixed(1));
          setConfirmedDimensions({
            widthMeters: initialWidth,
            depthMeters: initialDepth,
          });
        }

        setIsProcessing(false);
        setStep('review');
      } catch (err) {
        setIsProcessing(false);
        setErrorMsg('Error processing floorplan image. Please try another image.');
      }
    };
    img.onerror = () => {
      setIsProcessing(false);
      setErrorMsg('Failed to load image for footprint analysis.');
    };
    img.src = imgSrc.imageUrl;
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.match(/^image\/(png|jpe?g)$/i)) {
      setErrorMsg('Invalid file format. Please upload a PNG, JPG, or JPEG image.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File exceeds 15MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const source: FloorplanImageSource = {
        imageUrl: url,
        filename: file.name,
        filesize: file.size,
      };
      setImageSource(source);
      runDetection(source);
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = () => {
    const source: FloorplanImageSource = {
      imageUrl: SAMPLE_FLOORPLAN_SVG,
      filename: 'reference_floorplan_18x14.5m.svg',
      filesize: 14200,
      isPreset: true,
    };
    setImageSource(source);
    runDetection(source);
  };

  const handleConfirmFootprint = () => {
    console.log('[CONFIRMED DIMENSIONS]', {
      width: confirmedDimensions.widthMeters,
      depth: confirmedDimensions.depthMeters,
      area: confirmedDimensions.widthMeters * confirmedDimensions.depthMeters,
    });
    setStep('parameters');
  };

  const handleGenerate = () => {
    if (!detectedFootprint || detectedFootprint.quality === 'FAILED') return;

    console.log('[CONFIRMED DIMENSIONS BEFORE GENERATION]', {
      width: confirmedDimensions.widthMeters,
      depth: confirmedDimensions.depthMeters,
      area: confirmedDimensions.widthMeters * confirmedDimensions.depthMeters,
    });

    setStep('generating');

    setTimeout(() => {
      const generatedParcel = generatePropertyFromFloorplan(
        detectedFootprint,
        confirmedDimensions,
        params,
      );
      onGenerateProperty(generatedParcel);
      onClose();
    }, 400);
  };

  // Authoritative calculated area in sq.m and sq.ft from confirmed dimensions
  const areaSqM = Number(
    (confirmedDimensions.widthMeters * confirmedDimensions.depthMeters).toFixed(2),
  );
  const areaSqFt = Math.round(areaSqM * 10.7639);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl glass-panel border border-white/[0.08] shadow-panel-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-base-900/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-accent-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Create 3D Property from Floorplan
              </h2>
              <p className="text-[10px] text-slate-500">
                Architectural Wall Boundary Detection → Parametric 3D Cadastre (18.00m × 14.50m)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md bg-base-800/60 border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-2.5 bg-base-900/30 border-b border-white/[0.04] flex items-center justify-between text-[11px]">
          <StepBadge num={1} label="Upload" active={step === 'upload'} done={step !== 'upload'} />
          <div className="h-px flex-1 bg-white/[0.06] mx-3" />
          <StepBadge num={2} label="Review Footprint" active={step === 'review'} done={step === 'parameters' || step === 'generating'} />
          <div className="h-px flex-1 bg-white/[0.06] mx-3" />
          <StepBadge num={3} label="Building Parameters" active={step === 'parameters'} done={step === 'generating'} />
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto scrollbar-thin flex-1">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-danger-500/10 border border-danger-500/25 flex items-center gap-2 text-xs text-danger-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-white/[0.12] hover:border-accent-500/40 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all bg-base-900/30 hover:bg-accent-500/[0.02] group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />
                <div className="h-12 w-12 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="h-6 w-6 text-accent-400" />
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  Click to select or drag and drop a floorplan blueprint
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Supports PNG, JPG, JPEG (Max 15MB)
                </div>
              </div>

              {/* Sample Preset Button for quick testing */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-base-900/60 border border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <FileImage className="h-4 w-4 text-accent-400" />
                  <div>
                    <div className="text-xs font-medium text-slate-200">
                      Reference Floorplan Blueprint (18.00m × 14.50m)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Standard CAD blueprint with outer dimensions, north arrow, and title legend
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePresetSelect}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-md bg-accent-500/15 border border-accent-500/25 text-xs text-accent-300 font-medium hover:bg-accent-500/25 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isProcessing ? 'Analyzing...' : 'Load Reference Floorplan'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW FOOTPRINT */}
          {step === 'review' && imageSource && (
            <div className="space-y-4">
              <FootprintOverlayCanvas
                imageUrl={imageSource.imageUrl}
                footprint={detectedFootprint}
                footprintWidthM={confirmedDimensions.widthMeters}
                footprintDepthM={confirmedDimensions.depthMeters}
              />

              {/* Quality & Detection Summary */}
              {detectedFootprint && (
                <div className="p-3.5 rounded-lg bg-base-900/70 border border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Footprint Detection Quality
                    </span>
                    <QualityBadge quality={detectedFootprint.quality} />
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {detectedFootprint.qualityReason}
                  </p>
                  
                  {/* Verified Area Metrics */}
                  <div className="pt-2 border-t border-white/[0.04] grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-300 bg-base-800/40 p-2 rounded">
                    <div>
                      <span className="text-slate-500 block text-[9px]">VERTICES</span>
                      <span className="text-slate-200 font-semibold">{detectedFootprint.polygon.length} corners</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">FOOTPRINT AREA</span>
                      <span className="text-accent-300 font-semibold">{areaSqM} sq.m</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">BUILT-UP AREA</span>
                      <span className="text-accent-300 font-semibold">≈ {areaSqFt.toLocaleString()} sq.ft</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Dimensions Inputs */}
              <div className="p-3.5 rounded-lg bg-base-900/60 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Ruler className="h-3.5 w-3.5 text-accent-400" />
                    <span>Physical Dimensions (User-Confirmed Authority)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {areaSqM} m² / {areaSqFt} sq.ft
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Width (East-West)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="100"
                        value={confirmedDimensions.widthMeters}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setConfirmedDimensions((prev) => ({
                            ...prev,
                            widthMeters: isNaN(val) ? 18.0 : val,
                          }));
                        }}
                        className="w-full bg-base-800/80 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent-500/40 font-mono"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                        meters
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Depth (North-South)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="100"
                        value={confirmedDimensions.depthMeters}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setConfirmedDimensions((prev) => ({
                            ...prev,
                            depthMeters: isNaN(val) ? 14.5 : val,
                          }));
                        }}
                        className="w-full bg-base-800/80 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent-500/40 font-mono"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                        meters
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VERTICAL PARAMETERS */}
          {step === 'parameters' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-base-900/60 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Building className="h-3.5 w-3.5 text-accent-400" />
                    <span>Vertical Stacking Parameters</span>
                  </div>
                  <span className="text-[10px] text-accent-300 font-mono">
                    Footprint: {confirmedDimensions.widthMeters}m × {confirmedDimensions.depthMeters}m (≈ {areaSqFt.toLocaleString()} sq.ft / slab)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Floors Above Ground
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={params.floorsAbove}
                      onChange={(e) =>
                        setParams({
                          ...params,
                          floorsAbove: Math.max(1, parseInt(e.target.value) || 4),
                        })
                      }
                      className="w-full bg-base-800/80 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Basement Floors (Below Ground)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={params.basements}
                      onChange={(e) =>
                        setParams({
                          ...params,
                          basements: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-full bg-base-800/80 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Floor Height (Floor-to-Floor)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="2.5"
                        max="6.0"
                        value={params.floorHeight}
                        onChange={(e) =>
                          setParams({
                            ...params,
                            floorHeight: Math.max(2, parseFloat(e.target.value) || 3.0),
                          })
                        }
                        className="w-full bg-base-800/80 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent-500/40"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                        meters
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Slab Thickness
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="1.0"
                        value={params.slabThickness}
                        onChange={(e) =>
                          setParams({
                            ...params,
                            slabThickness: Math.max(0.1, parseFloat(e.target.value) || 0.2),
                          })
                        }
                        className="w-full bg-base-800/80 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent-500/40"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                        meters
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cadastral Property Identity Metadata */}
              <div className="p-3.5 rounded-lg bg-base-900/60 border border-white/[0.06] space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Layers className="h-3.5 w-3.5 text-accent-400" />
                  <span>Cadastral Property Identity</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Property Name
                    </label>
                    <input
                      type="text"
                      value={params.propertyName}
                      onChange={(e) => setParams({ ...params, propertyName: e.target.value })}
                      className="w-full bg-base-800/80 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Parcel ID
                    </label>
                    <input
                      type="text"
                      value={params.parcelId}
                      onChange={(e) => setParams({ ...params, parcelId: e.target.value })}
                      className="w-full bg-base-800/80 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent-500/40 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/[0.04]">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Latitude (-90 to 90) (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      placeholder="e.g. 12.9716"
                      value={params.latitude !== undefined ? params.latitude : ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setParams({ ...params, latitude: isNaN(val) ? undefined : val });
                      }}
                      className="w-full bg-base-800/80 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent-500/40 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Longitude (-180 to 180) (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      placeholder="e.g. 77.5946"
                      value={params.longitude !== undefined ? params.longitude : ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setParams({ ...params, longitude: isNaN(val) ? undefined : val });
                      }}
                      className="w-full bg-base-800/80 border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent-500/40 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: GENERATING */}
          {step === 'generating' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="h-12 w-12 rounded-xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center animate-pulse">
                <Sparkles className="h-6 w-6 text-accent-400" />
              </div>
              <div className="text-sm font-semibold text-slate-200">
                Generating 3D Property Geometry ({confirmedDimensions.widthMeters}m × {confirmedDimensions.depthMeters}m)
              </div>
              <div className="text-xs text-slate-500">
                Extruding {params.floorsAbove} floors above ground + {params.basements} basement ({areaSqFt.toLocaleString()} sq.ft per floor)...
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3.5 border-t border-white/[0.06] bg-base-900/80 flex items-center justify-between">
          {step === 'upload' && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          )}

          {step === 'review' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change Image
              </button>
              <button
                onClick={handleConfirmFootprint}
                disabled={detectedFootprint?.quality === 'FAILED'}
                className={`px-4 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  detectedFootprint?.quality === 'FAILED'
                    ? 'bg-base-800 text-slate-600 border border-white/[0.04] cursor-not-allowed'
                    : 'bg-accent-500/20 border border-accent-500/30 text-accent-300 hover:bg-accent-500/30 shadow-glow'
                }`}
              >
                <span>Confirm Footprint & Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {step === 'parameters' && (
            <>
              <button
                onClick={() => setStep('review')}
                className="px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Footprint
              </button>
              <button
                onClick={handleGenerate}
                className="px-4 py-1.5 rounded-md bg-accent-500/20 border border-accent-500/30 text-xs text-accent-300 font-medium hover:bg-accent-500/30 transition-all flex items-center gap-1.5 shadow-glow"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate 3D Building in Cesium</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StepBadge({
  num,
  label,
  active,
  done,
}: {
  num: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
          done
            ? 'bg-success-500/20 border border-success-500/30 text-success-400'
            : active
              ? 'bg-accent-500/20 border border-accent-500/40 text-accent-300 shadow-glow'
              : 'bg-base-800 text-slate-600 border border-white/[0.04]'
        }`}
      >
        {done ? <CheckCircle2 className="h-3 w-3" /> : num}
      </div>
      <span
        className={`text-[11px] font-medium ${
          active ? 'text-slate-200' : done ? 'text-slate-400' : 'text-slate-600'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function QualityBadge({ quality }: { quality: string }) {
  if (quality === 'GOOD') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-500/15 border border-success-500/30 text-success-400">
        <CheckCircle2 className="h-3 w-3" />
        GOOD QUALITY
      </span>
    );
  }
  if (quality === 'REVIEW_REQUIRED') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warn-500/15 border border-warn-500/30 text-warn-400">
        <AlertTriangle className="h-3 w-3" />
        REVIEW REQUIRED
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger-500/15 border border-danger-500/30 text-danger-400">
      <XCircle className="h-3 w-3" />
      DETECTION FAILED
    </span>
  );
}
