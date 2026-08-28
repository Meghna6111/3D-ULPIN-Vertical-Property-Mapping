import { Users, AlertCircle, HeartPulse, CheckCircle2, Clock, FileText } from 'lucide-react';
import type { FloorEmergencyData } from '@/types/disaster';

interface OccupantPanelProps {
  floorData?: FloorEmergencyData;
}

export function OccupantPanel({ floorData }: OccupantPanelProps) {
  if (!floorData) return null;

  return (
    <div className="p-3.5 bg-base-900/80 border border-white/[0.08] rounded-xl space-y-3 shadow-panel-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-tight">
            Floor Census & Vulnerability ({floorData.floorLabel})
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          ULPIN: {floorData.ulpinCode}
        </span>
      </div>

      {/* Numerical Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 bg-base-800/60 rounded-lg border border-white/[0.04] text-center">
          <span className="text-[9px] text-slate-500 block uppercase font-mono">Present Est.</span>
          <span className="text-sm font-bold text-slate-100 font-mono">
            {floorData.estimatedOccupants}
          </span>
        </div>
        <div className="p-2 bg-base-800/60 rounded-lg border border-white/[0.04] text-center">
          <span className="text-[9px] text-slate-500 block uppercase font-mono">Registered</span>
          <span className="text-sm font-bold text-slate-400 font-mono">
            {floorData.registeredOccupants}
          </span>
        </div>
        <div className="p-2 bg-base-800/60 rounded-lg border border-white/[0.04] text-center">
          <span className="text-[9px] text-rose-400 block uppercase font-mono">Vulnerable</span>
          <span className={`text-sm font-bold font-mono ${floorData.vulnerableOccupants > 0 ? 'text-rose-400 font-extrabold' : 'text-slate-500'}`}>
            {floorData.vulnerableOccupants}
          </span>
        </div>
      </div>

      {/* Field Notes & Verification */}
      <div className="p-2.5 rounded-lg bg-base-800/60 border border-white/[0.04] space-y-1 text-[10.5px] text-slate-300">
        <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
          <FileText className="h-3 w-3 text-slate-400" /> Sector Marshal Notes
        </div>
        <p className="leading-snug text-slate-300">
          {floorData.notes}
        </p>
      </div>

      {/* Verification footer */}
      <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono border-t border-white/[0.04] pt-2">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {floorData.lastVerification}
        </span>
        <span className="text-accent-400 font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> IoT Ground Verified
        </span>
      </div>
    </div>
  );
}
