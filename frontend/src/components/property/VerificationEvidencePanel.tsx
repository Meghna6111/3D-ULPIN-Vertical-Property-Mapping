import { useState } from 'react';
import {
  ShieldCheck,
  Scale,
  FileText,
  Box,
  Layers,
  MapPin,
  Clock,
  AlertTriangle,
  Radio,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  Server,
  WifiOff,
} from 'lucide-react';
import type { FloorEvidenceRecord, EvidenceSource, ConfidenceLevel } from '@/types/evidence';

interface VerificationEvidencePanelProps {
  evidence: FloorEvidenceRecord;
  onFocusFloorInCesium?: () => void;
}

const SOURCE_META: Record<
  EvidenceSource,
  { label: string; icon: typeof FileText; color: string; bg: string }
> = {
  CADASTRAL_RECORD: {
    label: 'Cadastral Deed Record',
    icon: Database,
    color: 'text-sky-400',
    bg: 'bg-sky-500/15 border-sky-500/30',
  },
  '3D_MODEL': {
    label: '3D Model Extrusion',
    icon: Box,
    color: 'text-accent-400',
    bg: 'bg-accent-500/15 border-accent-500/30',
  },
  LIDAR: {
    label: 'Terrestrial LiDAR Scan',
    icon: Radio,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15 border-purple-500/30',
  },
  PHOTOGRAMMETRY: {
    label: 'Drone Photogrammetry',
    icon: Layers,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/15 border-indigo-500/30',
  },
  FIELD_SURVEY: {
    label: 'ETS Field Survey',
    icon: MapPin,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/30',
  },
  SATELLITE: {
    label: 'High-Res Satellite Imagery',
    icon: Cpu,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15 border-emerald-500/30',
  },
  IOT: {
    label: 'IoT Structural Sensors',
    icon: Radio,
    color: 'text-rose-400',
    bg: 'bg-rose-500/15 border-rose-500/30',
  },
};

const CONFIDENCE_BADGES: Record<ConfidenceLevel, { label: string; style: string }> = {
  GROUND_TRUTH: { label: 'GROUND TRUTH', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-black' },
  HIGH: { label: 'HIGH CONFIDENCE', style: 'bg-accent-500/20 text-accent-300 border-accent-500/40 font-bold' },
  MEDIUM: { label: 'MEDIUM', style: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  LOW: { label: 'LOW', style: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  UNVERIFIED: { label: 'UNVERIFIED / PENDING', style: 'bg-slate-500/20 text-slate-400 border-slate-500/30 font-mono' },
};

export function VerificationEvidencePanel({
  evidence,
  onFocusFloorInCesium,
}: VerificationEvidencePanelProps) {
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [showProvenanceDetails, setShowProvenanceDetails] = useState(false);

  const isMismatch = evidence.groundTruthStatus === 'DISCREPANCY_DETECTED';
  const isPending = evidence.groundTruthStatus === 'UNVERIFIED_PENDING';
  const prov = evidence.cadastralProvenance;
  const geom = evidence.geometryVerification;

  return (
    <div className="p-3.5 bg-base-900/80 border border-white/[0.08] rounded-xl space-y-3 shadow-panel-lg">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-accent-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-tight">
            Ground-Truth Evidence Layer
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border ${
            isMismatch
              ? 'bg-danger-500/20 text-danger-300 border-danger-500/40 animate-pulse-soft'
              : isPending
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-success-500/20 text-success-300 border-success-500/40'
          }`}
        >
          {isMismatch ? 'DISCREPANCY DETECTED' : isPending ? 'PENDING VERIFICATION' : 'CONGRUENT'}
        </span>
      </div>

      {/* Identity & Coordinates Row */}
      <div className="p-2 rounded-lg bg-base-800/60 border border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div>
          <span className="text-slate-500">ULPIN:</span>{' '}
          <span className="text-slate-200 font-bold">{evidence.ulpin}</span>
        </div>
        <div>
          <span className="text-slate-500">Elev:</span>{' '}
          <span className="text-accent-300">+{evidence.coordinates.elevationM.toFixed(1)}m</span>
        </div>
      </div>

      {/* Side-by-Side Area Evidence Comparison */}
      <div className="grid grid-cols-2 gap-2">
        {/* Left: Registered Cadastral Data */}
        <div className="p-2.5 rounded-lg bg-base-800/70 border border-white/[0.06] space-y-1.5">
          <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">
            <FileText className="h-3 w-3 text-sky-400" /> Registered Cadastre
          </div>
          <div>
            <div className="text-lg font-black font-mono text-slate-100">
              {evidence.registeredCadastralAreaSqft.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">sq.ft</span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              {(evidence.registeredCadastralAreaSqft / 10.7639).toFixed(1)} m² deed baseline
            </div>
          </div>
          <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-mono bg-sky-500/10 border border-sky-500/20 text-sky-300">
            Source: CADASTRAL_RECORD
          </span>
        </div>

        {/* Right: 3D Model-Derived Spatial Data */}
        <div
          className={`p-2.5 rounded-lg border space-y-1.5 ${
            isMismatch
              ? 'bg-danger-950/30 border-danger-500/30'
              : 'bg-base-800/70 border-white/[0.06]'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">
            <Box className="h-3 w-3 text-accent-400" /> 3D Spatial Derived
          </div>
          <div>
            <div
              className={`text-lg font-black font-mono ${
                isMismatch ? 'text-danger-300' : 'text-slate-100'
              }`}
            >
              {evidence.spatialDerivedAreaSqft.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">sq.ft</span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              {(evidence.spatialDerivedAreaSqft / 10.7639).toFixed(1)} m² physical volume
            </div>
          </div>
          <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-mono bg-accent-500/10 border border-accent-500/20 text-accent-300">
            Source: 3D_MODEL (Prototype)
          </span>
        </div>
      </div>

      {/* Compact GEOMETRY VERIFICATION Section */}
      <div className="p-2.5 rounded-lg bg-base-800/80 border border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-slate-300 uppercase tracking-wider">
            <Box className="h-3.5 w-3.5 text-accent-400" /> Geometry Verification
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${
              geom?.classification === 'MATCH'
                ? 'bg-success-500/15 text-success-300 border-success-500/30'
                : geom?.classification === 'MINOR_DEVIATION'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-danger-500/15 text-danger-300 border-danger-500/30'
            }`}
          >
            {geom?.classification?.replace(/_/g, ' ') || 'AREA MISMATCH'}
          </span>
        </div>

        <div className="space-y-1 text-[9.5px] font-mono">
          <div className="flex justify-between py-0.5 border-b border-white/[0.03]">
            <span className="text-slate-400">Registered Area</span>
            <span className="text-slate-200 font-bold">{evidence.registeredCadastralAreaSqft.toLocaleString()} sq.ft</span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-white/[0.03]">
            <span className="text-slate-400">3D Model Area</span>
            <span className="text-slate-200 font-bold">{evidence.spatialDerivedAreaSqft.toLocaleString()} sq.ft</span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-white/[0.03]">
            <span className="text-slate-400">Area Difference</span>
            <span className={`font-bold ${evidence.absoluteDifferenceSqft !== 0 ? 'text-danger-300' : 'text-success-300'}`}>
              {evidence.absoluteDifferenceSqft > 0 ? '+' : ''}{evidence.absoluteDifferenceSqft.toLocaleString()} sq.ft
            </span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-white/[0.03]">
            <span className="text-slate-400">Area Variance</span>
            <span className={`font-bold ${evidence.percentageVariance !== 0 ? 'text-danger-300' : 'text-success-300'}`}>
              {evidence.percentageVariance > 0 ? '+' : ''}{evidence.percentageVariance}%
            </span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-white/[0.03]">
            <span className="text-slate-400">Geometry Overlap</span>
            <span className="text-slate-400">
              {geom?.availability.geometryOverlapAvailable && geom.geometryOverlapPercentage !== null
                ? `${geom.geometryOverlapPercentage}%`
                : 'Not Available'}
            </span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-white/[0.03]">
            <span className="text-slate-400">Boundary Comparison</span>
            <span className="text-slate-400">
              {geom?.availability.boundaryComparisonAvailable && geom.boundaryDeviationMeters !== null
                ? `±${geom.boundaryDeviationMeters}m deviation`
                : 'Not Available'}
            </span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-white/[0.03]">
            <span className="text-slate-400">Classification</span>
            <span className={`font-bold ${isMismatch ? 'text-danger-400' : 'text-success-400'}`}>
              {geom?.classification?.replace(/_/g, ' ') || 'AREA MISMATCH'}
            </span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-slate-400">Evidence</span>
            <span className="text-accent-300 font-semibold">3D MODEL / PROTOTYPE</span>
          </div>
        </div>

        {(!geom?.availability.geometryOverlapAvailable || !geom?.availability.boundaryComparisonAvailable) && (
          <div className="p-1.5 rounded bg-base-900/60 border border-white/[0.04] text-[8px] text-slate-500 font-mono italic">
            * 2D cadastral polygon boundary coordinates are not recorded in this registry entry — geometric polygon intersection and boundary deviation analysis are unavailable.
          </div>
        )}
      </div>

      {/* Cadastral Adapter & Data Provenance Card */}
      {prov && (
        <div className="p-2.5 rounded-lg bg-base-800/60 border border-sky-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-sky-300 uppercase tracking-wider">
              <Server className="h-3.5 w-3.5 text-sky-400" /> Cadastral Adapter Architecture
            </div>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {prov.providerStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
            <div className="p-1.5 rounded bg-base-900/60 border border-white/[0.04]">
              <span className="text-slate-500 block">PROVIDER</span>
              <span className="text-slate-200 font-bold truncate block">{prov.provider}</span>
            </div>
            <div className="p-1.5 rounded bg-base-900/60 border border-white/[0.04]">
              <span className="text-slate-500 block">LIVE CONNECTION</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <WifiOff className="h-2.5 w-2.5" /> {prov.liveConnectionStatus}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowProvenanceDetails((prev) => !prev)}
            className="w-full pt-1 flex items-center justify-between text-[9px] text-slate-400 hover:text-slate-200 font-mono transition-colors"
          >
            <span>Adapter Provenance Metadata</span>
            {showProvenanceDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showProvenanceDetails && (
            <div className="pt-1.5 border-t border-white/[0.04] space-y-1 text-[8.5px] font-mono text-slate-400">
              <div className="flex justify-between">
                <span className="text-slate-500">Record ID:</span>
                <span className="text-slate-300">{prov.recordId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Confidence:</span>
                <span className="text-amber-300">{prov.confidence}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ground Truth:</span>
                <span className="text-slate-300">{prov.groundTruthAvailability}</span>
              </div>
              <p className="text-[8px] text-slate-500 italic pt-1 border-t border-white/[0.02]">
                {prov.provenanceStatus}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Variance & Discrepancy Metric Banner */}
      <div
        onClick={onFocusFloorInCesium}
        className={`p-2.5 rounded-lg border cursor-pointer hover:border-white/20 transition-all ${
          isMismatch
            ? 'bg-danger-500/10 border-danger-500/30'
            : 'bg-success-500/10 border-success-500/30'
        }`}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            {isMismatch ? (
              <AlertTriangle className="h-3.5 w-3.5 text-danger-400" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-success-400" />
            )}
            <span>Area Variance</span>
          </span>
          <div className="text-right">
            <span
              className={`text-xs font-black font-mono ${
                isMismatch ? 'text-danger-300' : 'text-success-300'
              }`}
            >
              {evidence.percentageVariance > 0 ? '+' : ''}
              {evidence.percentageVariance}% ({evidence.absoluteDifferenceSqft > 0 ? '+' : ''}
              {evidence.absoluteDifferenceSqft.toLocaleString()} sq.ft)
            </span>
          </div>
        </div>
        <div className="text-[9.5px] text-slate-400 mt-1 font-mono leading-tight">
          {evidence.verificationDecision}
        </div>
      </div>

      {/* Key Findings List */}
      <div className="p-2.5 rounded-lg bg-base-800/80 border border-white/[0.06] space-y-1.5 text-[10.5px]">
        <div className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-accent-400" /> Verification Findings
        </div>
        <ul className="space-y-1 font-mono text-slate-300 text-[10px]">
          {evidence.findings.map((finding, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-accent-400 font-bold">•</span>
              <span className="leading-snug">{finding}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Audit Trail & Integration Pipeline Accordion */}
      <div className="border border-white/[0.06] rounded-lg overflow-hidden bg-base-800/40">
        <button
          type="button"
          onClick={() => setShowAuditTrail((prev) => !prev)}
          className="w-full p-2 text-left flex items-center justify-between text-[10px] font-semibold text-slate-300 hover:bg-base-800/70 transition-colors font-mono"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-slate-400" /> Ground-Truth Audit Trail ({evidence.auditTrail.length} Sources)
          </span>
          {showAuditTrail ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {showAuditTrail && (
          <div className="p-2 border-t border-white/[0.04] space-y-1.5">
            {evidence.auditTrail.map((entry) => {
              const meta = SOURCE_META[entry.source] || SOURCE_META.CADASTRAL_RECORD;
              const conf = CONFIDENCE_BADGES[entry.confidence] || CONFIDENCE_BADGES.UNVERIFIED;
              const Icon = meta.icon;

              return (
                <div
                  key={entry.id}
                  className="p-2 rounded bg-base-900/60 border border-white/[0.04] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3 w-3 ${meta.color}`} />
                      <span className="text-[10px] font-bold text-slate-200">{meta.label}</span>
                    </div>
                    <span className={`px-1.5 py-0.2 rounded text-[8px] border ${conf.style}`}>
                      {conf.label}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 font-mono leading-tight">
                    {entry.finding}
                  </p>
                  <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-mono pt-0.5 border-t border-white/[0.02]">
                    <span>Verified: {entry.verifiedBy}</span>
                    <span
                      className={`px-1 py-0.2 rounded text-[7.5px] ${
                        entry.isOperationalInPrototype
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      {entry.isOperationalInPrototype ? 'OPERATIONAL' : 'FUTURE INTEGRATION'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
