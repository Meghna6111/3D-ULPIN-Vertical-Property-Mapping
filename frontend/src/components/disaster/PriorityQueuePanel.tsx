import { useMemo } from 'react';
import { Target, Users, ShieldAlert, Clock, ChevronRight, Zap } from 'lucide-react';
import type { FloorPriorityResult } from '@/types/disaster';

interface PriorityQueuePanelProps {
  priorityQueue: FloorPriorityResult[];
  selectedFloorId?: string;
  onSelectFloor: (floorId: string) => void;
}

const PRIORITY_COLORS: Record<string, { badge: string; border: string; glow: string }> = {
  P1: {
    badge: 'bg-danger-500/25 text-danger-300 border-danger-500/50',
    border: 'border-l-4 border-danger-500',
    glow: 'shadow-[0_0_8px_rgba(239,68,68,0.3)]',
  },
  P2: {
    badge: 'bg-orange-500/25 text-orange-300 border-orange-500/50',
    border: 'border-l-4 border-orange-500',
    glow: '',
  },
  P3: {
    badge: 'bg-amber-500/25 text-amber-300 border-amber-500/50',
    border: 'border-l-4 border-amber-500',
    glow: '',
  },
  P4: {
    badge: 'bg-success-500/25 text-success-300 border-success-500/50',
    border: 'border-l-4 border-success-500',
    glow: '',
  },
};

export function PriorityQueuePanel({
  priorityQueue,
  selectedFloorId,
  onSelectFloor,
}: PriorityQueuePanelProps) {
  const sortedQueue = useMemo(
    () => [...priorityQueue].sort((a, b) => b.score - a.score),
    [priorityQueue],
  );

  return (
    <div className="p-3.5 bg-base-900/80 border border-white/[0.08] rounded-xl space-y-3 shadow-panel-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-accent-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-tight">
            Rescue Priority Queue
          </span>
        </div>
        <span className="text-[9px] text-slate-500 font-mono">
          {sortedQueue.length} floors ranked
        </span>
      </div>

      <div className="space-y-1.5">
        {sortedQueue.map((item) => {
          const colors = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.P4;
          const isSelected = item.floorId === selectedFloorId;

          return (
            <button
              key={item.floorId}
              type="button"
              onClick={() => onSelectFloor(item.floorId)}
              className={`w-full rounded-lg text-left transition-all ${colors.border} ${
                isSelected
                  ? `bg-base-800 border border-white/20 ${colors.glow}`
                  : 'bg-base-800/50 border border-white/[0.04] hover:bg-base-800/80 hover:border-white/10'
              }`}
            >
              <div className="p-2 space-y-1.5">
                {/* Header Row: Floor Name + Priority Badge + Score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">{item.floorName}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${colors.badge}`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-200">
                      {item.score}
                    </span>
                    <span className="text-[8px] text-slate-500">/100</span>
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                  </div>
                </div>

                {/* Occupant + Access Row */}
                <div className="flex items-center gap-3 text-[9.5px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-slate-500" />
                    {item.occupantCount} occ
                  </span>
                  {item.vulnerableCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <ShieldAlert className="h-3 w-3" />
                      {item.vulnerableCount} vuln
                    </span>
                  )}
                  {item.recommendedTeamCallSign && (
                    <span className="flex items-center gap-1 text-accent-400">
                      <Zap className="h-3 w-3" />
                      {item.recommendedTeamCallSign}
                    </span>
                  )}
                  {item.estimatedResponseTime && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="h-3 w-3" />
                      {item.estimatedResponseTime}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
