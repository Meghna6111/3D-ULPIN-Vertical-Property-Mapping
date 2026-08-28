import { useState } from 'react';
import {
  Radio,
  Megaphone,
  Siren,
  HeartPulse,
  CheckCircle2,
  ShieldPlus,
  Send,
} from 'lucide-react';
import type { FloorEmergencyData, FloorPriorityResult } from '@/types/disaster';

interface CommunicationPanelProps {
  onTriggerEvent: (
    title: string,
    description: string,
    severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS',
  ) => void;
  floorData?: FloorEmergencyData;
  priorityResult?: FloorPriorityResult;
}

export function CommunicationPanel({
  onTriggerEvent,
  floorData,
  priorityResult,
}: CommunicationPanelProps) {
  const [lastAction, setLastAction] = useState<string | null>(null);

  const floorLabel = floorData?.floorLabel || 'Floor 03';
  const recommendedTeam =
    priorityResult?.recommendedTeamCallSign ||
    priorityResult?.recommendedTeamName ||
    'NDRF Eagle-1';
  const vulnerableCount = floorData?.vulnerableOccupants ?? 2;
  const occupants = floorData?.estimatedOccupants ?? 6;

  const handleAction = (
    title: string,
    description: string,
    severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS',
    actionName: string,
  ) => {
    onTriggerEvent(title, description, severity);
    setLastAction(actionName);
    setTimeout(() => setLastAction(null), 3000);
  };

  return (
    <div className="p-3.5 bg-base-900/80 border border-white/[0.08] rounded-xl space-y-3 shadow-panel-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-accent-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-tight">
            Emergency Field Directives ({floorLabel})
          </span>
        </div>
        {lastAction && (
          <span className="text-[9px] text-success-400 font-mono flex items-center gap-1 animate-fade-in">
            <CheckCircle2 className="h-3 w-3" /> {lastAction} Dispatched
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* 1. Broadcast Public Alert */}
        <button
          type="button"
          onClick={() =>
            handleAction(
              `Public Evacuation Alert Issued for ${floorLabel}`,
              `High-priority audio siren & localized SMS blast issued for ${occupants} occupants on ${floorLabel}.`,
              'CRITICAL',
              'Public Alert',
            )
          }
          className="p-2.5 rounded-lg bg-danger-500/15 border border-danger-500/30 text-danger-300 hover:bg-danger-500/25 hover:border-danger-500/50 transition-all text-left group"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Megaphone className="h-3.5 w-3.5 text-danger-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Broadcast Alert</span>
          </div>
          <span className="text-[9px] text-slate-400 block leading-tight">
            Public Siren + Geo-SMS blast to all registered ULPIN residents
          </span>
        </button>

        {/* 2. Dispatch NDRF / Fire Team */}
        <button
          type="button"
          onClick={() =>
            handleAction(
              `Rescue Directive Dispatched: ${recommendedTeam} → ${floorLabel}`,
              `Tactical breach directive transmitted to ${recommendedTeam} for immediate intervention on ${floorLabel} (${floorData?.accessStatus || 'BLOCKED'} access).`,
              'WARNING',
              'Unit Dispatch',
            )
          }
          className="p-2.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-300 hover:bg-orange-500/25 hover:border-orange-500/50 transition-all text-left group"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Siren className="h-3.5 w-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Notify Rescue Team</span>
          </div>
          <span className="text-[9px] text-slate-400 block leading-tight">
            Transmit 3D strata coordinates & hazard specs to {recommendedTeam}
          </span>
        </button>

        {/* 3. Notify Medical Trauma Unit */}
        <button
          type="button"
          onClick={() =>
            handleAction(
              `ALS Medical Alert: ${vulnerableCount} Vulnerable on ${floorLabel}`,
              `108 ALS Trauma unit staged with pediatric/geriatric life support for ${vulnerableCount} vulnerable occupants.`,
              'INFO',
              'Medical Notify',
            )
          }
          className="p-2.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-500/50 transition-all text-left group"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <HeartPulse className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Notify Medical Team</span>
          </div>
          <span className="text-[9px] text-slate-400 block leading-tight">
            Stage ALS trauma ambulances & hospital casualty alert
          </span>
        </button>

        {/* 4. Mark Evacuation Started */}
        <button
          type="button"
          onClick={() =>
            handleAction(
              `Evacuation Protocol Updated for ${floorLabel}`,
              `Incident Commander logged official evacuation order for ${floorLabel} (${occupants} occupants).`,
              'INFO',
              'Evac Status',
            )
          }
          className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 hover:border-amber-500/50 transition-all text-left group"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Mark Evacuation</span>
          </div>
          <span className="text-[9px] text-slate-400 block leading-tight">
            Log official evacuation order on DoLR National Disaster Registry
          </span>
        </button>

        {/* 5. Request State Reinforcements */}
        <button
          type="button"
          onClick={() =>
            handleAction(
              `SEOC Escalation for ${floorLabel} (${floorData?.priority || 'P1'} Hazard)`,
              `State Emergency Operations Center requested for additional structural engineering marshals & drone survey on ${floorLabel}.`,
              'WARNING',
              'Reinforcements',
            )
          }
          className="p-2.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 hover:border-purple-500/50 transition-all text-left group"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldPlus className="h-3.5 w-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Request Backup</span>
          </div>
          <span className="text-[9px] text-slate-400 block leading-tight">
            Escalate to State Emergency Operations Center (SEOC)
          </span>
        </button>

        {/* 6. Send Emergency Update */}
        <button
          type="button"
          onClick={() =>
            handleAction(
              `Live 3D SitRep Broadcasted for ${floorLabel}`,
              `Updated 3D Cadastral building health & resident manifest for ${floorLabel} pushed to all disaster agencies.`,
              'SUCCESS',
              'SitRep Sent',
            )
          }
          className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-500/50 transition-all text-left group"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Send className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Send SitRep</span>
          </div>
          <span className="text-[9px] text-slate-400 block leading-tight">
            Publish synchronized 3D telemetry to District Magistrate feed
          </span>
        </button>
      </div>
    </div>
  );
}
