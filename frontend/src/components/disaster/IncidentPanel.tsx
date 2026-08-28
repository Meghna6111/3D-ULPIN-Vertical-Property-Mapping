import { AlertOctagon, ShieldAlert, Users, CheckCircle2, Clock, MapPin, Radio } from 'lucide-react';
import type { IncidentSummary } from '@/types/disaster';

interface IncidentPanelProps {
  incident: IncidentSummary;
}

export function IncidentPanel({ incident }: IncidentPanelProps) {
  return (
    <div className="p-3.5 bg-base-900/80 border border-danger-500/30 rounded-xl space-y-3 shadow-panel-lg relative overflow-hidden">
      {/* Red ambient indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-danger-500 via-rose-500 to-amber-500 animate-pulse" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-danger-500/20 border border-danger-500/40 flex items-center justify-center">
            <AlertOctagon className="h-4 w-4 text-danger-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100 uppercase tracking-tight">
                Active Incident
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-danger-500/20 text-danger-300 border border-danger-500/40">
                {incident.severity}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{incident.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-mono text-danger-400 bg-danger-500/10 px-2 py-0.5 rounded border border-danger-500/30 animate-pulse-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-danger-500" />
          <span>{incident.status}</span>
        </div>
      </div>

      {/* Incident Title & Type */}
      <div className="space-y-1">
        <h3 className="text-xs font-semibold text-slate-200 leading-snug">
          {incident.title}
        </h3>
        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          <ShieldAlert className="h-3 w-3 text-amber-400 shrink-0" />
          <span>{incident.disasterType}</span>
        </p>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="bg-base-800/60 p-2 rounded-lg border border-white/[0.04]">
          <span className="text-[9px] text-slate-500 block uppercase font-mono">At Risk</span>
          <span className="text-sm font-bold text-danger-400 font-mono">
            {incident.totalOccupantsAtRisk}
          </span>
          <span className="text-[8px] text-slate-500 block">persons</span>
        </div>
        <div className="bg-base-800/60 p-2 rounded-lg border border-white/[0.04]">
          <span className="text-[9px] text-slate-500 block uppercase font-mono">Evacuated</span>
          <span className="text-sm font-bold text-success-400 font-mono">
            {incident.evacuatedCount}
          </span>
          <span className="text-[8px] text-slate-500 block">cleared</span>
        </div>
        <div className="bg-base-800/60 p-2 rounded-lg border border-white/[0.04]">
          <span className="text-[9px] text-slate-500 block uppercase font-mono">Teams</span>
          <span className="text-sm font-bold text-accent-400 font-mono">
            {incident.activeTeamsCount}
          </span>
          <span className="text-[8px] text-slate-500 block">on scene</span>
        </div>
      </div>

      {/* Incident Metadata */}
      <div className="pt-2 border-t border-white/[0.06] space-y-1.5 text-[10px] text-slate-400">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-500">
            <Clock className="h-3 w-3" /> Detected Time
          </span>
          <span className="text-slate-300 font-mono">{incident.detectedAt}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-500">
            <MapPin className="h-3 w-3" /> Affected Sector
          </span>
          <span className="text-slate-300 font-medium truncate max-w-[150px]">
            {incident.affectedArea}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-500">
            <Radio className="h-3 w-3" /> Unified Command
          </span>
          <span className="text-slate-300 font-medium truncate max-w-[150px]">
            {incident.commandAgency}
          </span>
        </div>
      </div>
    </div>
  );
}
