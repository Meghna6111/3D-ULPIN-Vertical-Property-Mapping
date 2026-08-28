import { Clock, AlertOctagon, AlertTriangle, Info, CheckCircle2, Activity } from 'lucide-react';
import type { IncidentEvent } from '@/types/disaster';

interface IncidentActivityFeedProps {
  events: IncidentEvent[];
}

export function IncidentActivityFeed({ events }: IncidentActivityFeedProps) {
  return (
    <div className="p-3.5 bg-base-900/80 border border-white/[0.08] rounded-xl space-y-3 shadow-panel-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-tight">
            Incident Command Activity Feed ({events.length})
          </span>
        </div>
        <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
          <Clock className="h-3 w-3" /> REALTIME SYNC
        </span>
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
        {events.map((evt) => {
          let badgeColor = 'text-accent-400 bg-accent-500/10 border-accent-500/30';
          let Icon = Info;

          if (evt.severity === 'CRITICAL') {
            badgeColor = 'text-danger-400 bg-danger-500/10 border-danger-500/30';
            Icon = AlertOctagon;
          } else if (evt.severity === 'WARNING') {
            badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            Icon = AlertTriangle;
          } else if (evt.severity === 'SUCCESS') {
            badgeColor = 'text-success-400 bg-success-500/10 border-success-500/30';
            Icon = CheckCircle2;
          }

          return (
            <div
              key={evt.id}
              className="p-2.5 rounded-lg bg-base-800/60 border border-white/[0.04] space-y-1 text-[11px] animate-fade-in"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Icon className={`h-3.5 w-3.5 ${badgeColor.split(' ')[0]}`} />
                  <span>{evt.title}</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 shrink-0">
                  {evt.timeFormatted}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug pl-5">
                {evt.description}
              </p>
              <div className="text-[8.5px] font-mono text-slate-500 pl-5 flex items-center justify-between">
                <span>Source: {evt.source}</span>
                <span className={`px-1 py-0.2 rounded border ${badgeColor}`}>
                  {evt.severity}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
