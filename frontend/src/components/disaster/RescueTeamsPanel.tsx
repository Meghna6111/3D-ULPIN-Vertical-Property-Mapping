import { Shield, Radio, Clock, Users, ArrowUpRight } from 'lucide-react';
import type { RescueTeam } from '@/types/disaster';

interface RescueTeamsPanelProps {
  teams: RescueTeam[];
  selectedFloorId?: string;
  onSelectFloor?: (floorId: string) => void;
}

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  NDRF_SPECIAL: { label: 'NDRF SPECIAL', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  FIRE_RESCUE: { label: 'FIRE & RESCUE', color: 'bg-danger-500/15 text-danger-400 border-danger-500/30' },
  MEDICAL: { label: 'ALS MEDICAL', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  SEARCH_RESCUE: { label: 'CIVIL DEFENSE', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
};

export function RescueTeamsPanel({
  teams,
  selectedFloorId,
  onSelectFloor,
}: RescueTeamsPanelProps) {
  return (
    <div className="p-3.5 bg-base-900/80 border border-white/[0.08] rounded-xl space-y-3 shadow-panel-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-orange-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-tight">
            Active Rescue Teams ({teams.length})
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
          <Radio className="h-3 w-3 text-success-400 animate-pulse" /> NET ACTIVE
        </span>
      </div>

      <div className="space-y-2">
        {teams.map((team) => {
          const typeMeta = TYPE_BADGES[team.type] || TYPE_BADGES.NDRF_SPECIAL;
          const isAssignedSelected = team.assignedFloor === selectedFloorId;

          return (
            <div
              key={team.id}
              className={`p-2.5 rounded-lg border transition-all ${
                isAssignedSelected
                  ? 'bg-accent-500/10 border-accent-500/40 shadow-glow'
                  : 'bg-base-800/60 border-white/[0.04] hover:border-white/[0.1]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200">
                      {team.name}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono border ${typeMeta.color}`}>
                      {typeMeta.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                    <span>Callsign: <strong className="text-slate-200">{team.callSign}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" /> {team.personnelCount} pax
                    </span>
                  </div>
                </div>

                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-base-900 border border-white/[0.06] text-slate-300">
                  {team.status}
                </span>
              </div>

              {team.assignedFloor && (
                <div className="mt-2 pt-1.5 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">
                    Assigned Sector: <strong className="text-accent-300 font-mono">{team.assignedFloor.replace(/^.*-/, '')}</strong>
                  </span>
                  {onSelectFloor && (
                    <button
                      onClick={() => onSelectFloor(team.assignedFloor!)}
                      className="text-accent-400 hover:text-accent-300 flex items-center gap-0.5 font-medium"
                    >
                      <span>Focus Strata</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
