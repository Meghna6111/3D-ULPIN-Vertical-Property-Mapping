import { MapPin, Navigation, Hospital, Flame, ShieldAlert, PhoneCall } from 'lucide-react';
import type { EmergencyPoint, EvacuationRoute } from '@/types/disaster';

interface EmergencyPointsPanelProps {
  points: EmergencyPoint[];
  routes: EvacuationRoute[];
  activeRouteId: string;
  onSelectRoute?: (routeId: string) => void;
}

export function EmergencyPointsPanel({
  points,
  routes,
  activeRouteId,
  onSelectRoute,
}: EmergencyPointsPanelProps) {
  return (
    <div className="p-3.5 bg-base-900/80 border border-white/[0.08] rounded-xl space-y-3 shadow-panel-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-success-400" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-tight">
            Emergency Infrastructure & Routes
          </span>
        </div>
        <span className="text-[9px] text-success-400 font-mono font-semibold bg-success-500/10 px-2 py-0.5 rounded border border-success-500/30">
          CORRIDOR OPEN
        </span>
      </div>

      {/* Evacuation Route Switcher */}
      <div className="space-y-1.5">
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
          3D Evacuation Corridors
        </span>
        <div className="grid grid-cols-1 gap-1.5">
          {routes.map((route) => {
            const isActive = route.id === activeRouteId;
            return (
              <button
                key={route.id}
                onClick={() => onSelectRoute && onSelectRoute(route.id)}
                className={`p-2 rounded-lg text-left transition-all border flex items-center justify-between ${
                  isActive
                    ? 'bg-success-500/15 border-success-500/40 text-success-300 shadow-glow'
                    : 'bg-base-800/60 border-white/[0.04] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{route.name}</div>
                  <div className="text-[9px] text-slate-500">
                    Destination: {route.destinationName} ({route.distanceMeters}m • ~{route.estimatedTimeMinutes} min walk)
                  </div>
                </div>
                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-success-500/30 text-success-200' : 'bg-base-900 text-slate-500'}`}>
                  {isActive ? 'ACTIVE 3D' : 'SWITCH'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Emergency Points List */}
      <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
          Nearby Staging Infrastructure
        </span>
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
          {points.map((pt) => (
            <div
              key={pt.id}
              className="p-2 rounded-lg bg-base-800/50 border border-white/[0.04] flex items-center justify-between text-[10px]"
            >
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-1">
                  <span>{pt.name}</span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1.5">
                  <span>{pt.distanceMeters}m</span>
                  <span>•</span>
                  <span className="text-slate-400">{pt.contactNumber}</span>
                </div>
              </div>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                pt.status === 'ACTIVE'
                  ? 'bg-success-500/10 text-success-400 border-success-500/30'
                  : 'bg-accent-500/10 text-accent-400 border-accent-500/30'
              }`}>
                {pt.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
