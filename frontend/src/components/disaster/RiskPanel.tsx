import {
  ShieldAlert,
  Flame,
  DoorOpen,
  Footprints,
  AlertTriangle,
  Zap,
  Clock,
  CheckCircle2,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import type { FloorEmergencyData, FloorPriorityResult } from '@/types/disaster';

interface RiskPanelProps {
  floorData?: FloorEmergencyData;
  priorityResult?: FloorPriorityResult;
}

const PRIORITY_THEMES: Record<
  string,
  { label: string; badge: string; border: string; accent: string; bgGlow: string }
> = {
  P1: {
    label: 'P1 — IMMEDIATE RESCUE',
    badge: 'bg-danger-500/25 text-danger-300 border-danger-500/50',
    border: 'border-danger-500/40',
    accent: 'text-danger-400',
    bgGlow: 'bg-gradient-to-r from-danger-950/60 to-base-900/80',
  },
  P2: {
    label: 'P2 — HIGH PRIORITY',
    badge: 'bg-orange-500/25 text-orange-300 border-orange-500/50',
    border: 'border-orange-500/40',
    accent: 'text-orange-400',
    bgGlow: 'bg-gradient-to-r from-orange-950/40 to-base-900/80',
  },
  P3: {
    label: 'P3 — MONITOR & ASSIST',
    badge: 'bg-amber-500/25 text-amber-300 border-amber-500/50',
    border: 'border-amber-500/40',
    accent: 'text-amber-400',
    bgGlow: 'bg-gradient-to-r from-amber-950/30 to-base-900/80',
  },
  P4: {
    label: 'P4 — LOW PRIORITY',
    badge: 'bg-success-500/25 text-success-300 border-success-500/50',
    border: 'border-success-500/40',
    accent: 'text-success-400',
    bgGlow: 'bg-gradient-to-r from-emerald-950/30 to-base-900/80',
  },
};

export function RiskPanel({ floorData, priorityResult }: RiskPanelProps) {
  if (!floorData) {
    return (
      <div className="p-4 bg-base-900/60 border border-white/[0.06] rounded-xl text-center text-xs text-slate-500">
        Select a floor strata slab to view volumetric risk assessment
      </div>
    );
  }

  const priority = priorityResult?.priority || floorData.priority;
  const theme = PRIORITY_THEMES[priority] || PRIORITY_THEMES.P4;
  const score = priorityResult?.score ?? (priority === 'P1' ? 92 : priority === 'P2' ? 68 : priority === 'P3' ? 44 : 12);
  const reasons = priorityResult?.reasons || [floorData.priorityReason];

  return (
    <div className="p-3.5 bg-base-900/80 border border-white/[0.08] rounded-xl space-y-3 shadow-panel-lg">
      {/* Top Banner: Calculated Priority & Score */}
      <div className={`p-3 rounded-xl border ${theme.border} ${theme.bgGlow} space-y-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`h-4 w-4 ${theme.accent}`} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Rescue Priority Calculation
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${theme.badge}`}>
            {theme.label}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-black font-mono text-slate-100 flex items-baseline gap-1">
              <span>{score}</span>
              <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono">
              Confidence: {Math.round((priorityResult?.confidence ?? 0.94) * 100)}% • Deterministic Model v1.0
            </div>
          </div>

          {/* Mini Score Bar */}
          <div className="w-28 space-y-1 text-right">
            <div className="h-2 w-full bg-base-950 rounded-full overflow-hidden border border-white/10">
              <div
                className={`h-full rounded-full transition-all ${
                  score >= 80 ? 'bg-danger-500' : score >= 60 ? 'bg-orange-500' : score >= 35 ? 'bg-amber-500' : 'bg-success-500'
                }`}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
            <span className="text-[8.5px] text-slate-500 font-mono">
              {score >= 80 ? 'Critical Life Safety Risk' : score >= 60 ? 'High Response Urgency' : score >= 35 ? 'Moderate Intervention' : 'Routine Monitoring'}
            </span>
          </div>
        </div>
      </div>

      {/* Recommended Team & Response Time */}
      <div className="p-2.5 rounded-lg bg-base-800/60 border border-white/[0.06] flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <div className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Zap className="h-3 w-3 text-accent-400" /> Recommended Unit
          </div>
          <div className="font-bold text-slate-200">
            {priorityResult?.recommendedTeamName || 'NDRF Quick Response Team Alpha'}
          </div>
        </div>
        <div className="text-right space-y-0.5">
          <div className="text-[9.5px] text-slate-500 font-mono flex items-center gap-1 justify-end">
            <Clock className="h-3 w-3 text-slate-400" /> Est. Response
          </div>
          <span className="px-1.5 py-0.5 rounded bg-accent-500/15 border border-accent-500/30 text-[10px] font-mono font-bold text-accent-300">
            {priorityResult?.estimatedResponseTime || 'On Scene'}
          </span>
        </div>
      </div>

      {/* Why this priority? (Top Reasons) */}
      <div className="p-2.5 rounded-lg bg-base-800/80 border border-white/[0.06] text-[11px] text-slate-300 space-y-1.5">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1">
            <HelpCircle className="h-3 w-3 text-amber-400" /> Why this priority?
          </span>
          <span className="text-[8.5px] text-slate-500 font-mono">{reasons.length} Factors</span>
        </div>
        <ul className="space-y-1">
          {reasons.slice(0, 4).map((r, idx) => (
            <li key={idx} className="flex items-start gap-1.5 text-[10.5px] text-slate-300 font-mono">
              <span className="text-amber-400 font-bold mt-0.5">•</span>
              <span className="leading-snug">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4-Corner Risk Matrix */}
      <div className="grid grid-cols-2 gap-2">
        {/* Structural Risk */}
        <div className="p-2 bg-base-800/50 rounded-lg border border-white/[0.04] space-y-1">
          <span className="text-[9px] text-slate-500 flex items-center gap-1 uppercase font-mono">
            <ShieldAlert className="h-3 w-3 text-slate-400" /> Structural Stress (25%)
          </span>
          <span
            className={`text-xs font-bold font-mono ${
              floorData.structuralRisk === 'CRITICAL'
                ? 'text-danger-400'
                : floorData.structuralRisk === 'HIGH'
                ? 'text-orange-400'
                : floorData.structuralRisk === 'MEDIUM'
                ? 'text-amber-400'
                : 'text-success-400'
            }`}
          >
            {floorData.structuralRisk}
          </span>
        </div>

        {/* Fire / Thermal Risk */}
        <div className="p-2 bg-base-800/50 rounded-lg border border-white/[0.04] space-y-1">
          <span className="text-[9px] text-slate-500 flex items-center gap-1 uppercase font-mono">
            <Flame className="h-3 w-3 text-slate-400" /> Fire & Smoke (20%)
          </span>
          <span
            className={`text-xs font-bold font-mono ${
              floorData.fireRisk === 'CRITICAL'
                ? 'text-danger-400'
                : floorData.fireRisk === 'HIGH'
                ? 'text-orange-400'
                : floorData.fireRisk === 'MEDIUM'
                ? 'text-amber-400'
                : 'text-success-400'
            }`}
          >
            {floorData.fireRisk}
          </span>
        </div>

        {/* Egress Access */}
        <div className="p-2 bg-base-800/50 rounded-lg border border-white/[0.04] space-y-1">
          <span className="text-[9px] text-slate-500 flex items-center gap-1 uppercase font-mono">
            <DoorOpen className="h-3 w-3 text-slate-400" /> Stairwell Access (10%)
          </span>
          <span
            className={`text-xs font-bold font-mono ${
              floorData.accessStatus === 'BLOCKED'
                ? 'text-danger-400'
                : floorData.accessStatus === 'LIMITED'
                ? 'text-amber-400'
                : 'text-success-400'
            }`}
          >
            {floorData.accessStatus}
          </span>
        </div>

        {/* Evacuation Route Status */}
        <div className="p-2 bg-base-800/50 rounded-lg border border-white/[0.04] space-y-1">
          <span className="text-[9px] text-slate-500 flex items-center gap-1 uppercase font-mono">
            <Footprints className="h-3 w-3 text-slate-400" /> Evac Status (10%)
          </span>
          <span
            className={`text-xs font-bold font-mono ${
              floorData.evacuationStatus === 'BLOCKED'
                ? 'text-danger-400'
                : floorData.evacuationStatus === 'IN_PROGRESS'
                ? 'text-amber-400'
                : floorData.evacuationStatus === 'COMPLETED'
                ? 'text-success-400'
                : 'text-accent-400'
            }`}
          >
            {floorData.evacuationStatus.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
}
