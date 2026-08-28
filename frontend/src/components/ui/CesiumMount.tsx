import { Box, AlertCircle, Loader2, Navigation, MapPin } from 'lucide-react';
import type { SelectionState, Parcel } from '@/types/property';
import { resolveSelectedFloor, resolveSelectedBuilding } from '@/utils/selection';

interface CesiumMountProps {
  ready: boolean;
  error: string | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  selection: SelectionState;
  parcel: Parcel;
}

export function CesiumMount({ ready, error, containerRef, selection, parcel }: CesiumMountProps) {
  const selectedFloor = resolveSelectedFloor(parcel, selection);
  const selectedBuilding = resolveSelectedBuilding(parcel, selection);

  return (
    <div className="relative w-full h-full">
      {/* Cesium container */}
      <div ref={containerRef as React.RefObject<HTMLDivElement>} className="absolute inset-0" />

      {/* Viewport vignette for depth */}
      <div className="viewport-vignette" />

      {/* Loading overlay */}
      {!ready && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-950/90 z-10 animate-fade-in">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-4">
              <Box className="h-6 w-6 text-accent-400" />
            </div>
            <Loader2 className="absolute -top-1 -right-1 h-4 w-4 text-accent-400 animate-spin" />
          </div>
          <div className="text-sm text-slate-300 font-medium">Initializing 3D GIS Engine</div>
          <div className="text-[11px] text-slate-500 mt-1">Loading Cesium terrain & assets</div>
          <div className="mt-4 w-32 h-0.5 rounded-full bg-base-700 overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-accent-500/50 animate-[slideRight_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-950/95 z-10">
          <div className="h-12 w-12 rounded-xl bg-danger-500/10 border border-danger-500/20 flex items-center justify-center mb-3">
            <AlertCircle className="h-5 w-5 text-danger-500" />
          </div>
          <div className="text-sm text-slate-300 font-medium">3D Engine Failed to Load</div>
          <div className="text-xs text-slate-500 mt-1 max-w-xs text-center">{error}</div>
        </div>
      )}

      {/* ── Viewport overlays (only when ready) ── */}
      {ready && !error && (
        <>
          {/* Mini compass (top-left) */}
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <div className="h-10 w-10 rounded-full bg-base-900/60 backdrop-blur-sm border border-white/[0.06] flex items-center justify-center">
              <Navigation className="h-4 w-4 text-accent-400/70 -rotate-45" />
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[7px] font-bold text-accent-400/60 tracking-wider">
                N
              </span>
            </div>
          </div>

          {/* Location badge (top-center) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="glass-panel-tight px-3 py-1.5 flex items-center gap-2 text-[11px] text-slate-400">
              <MapPin className="h-3 w-3 text-accent-500/60" />
              <span>Bengaluru, Karnataka</span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-[10px] text-slate-500">
                {parcel.latitude.toFixed(4)}°N, {parcel.longitude.toFixed(4)}°E
              </span>
            </div>
          </div>

          {/* Scale bar (bottom-right) */}
          <div className="absolute bottom-14 right-4 z-10 pointer-events-none">
            <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] text-slate-500 font-mono">Scale: 20 m</span>
              <div className="flex items-center gap-0">
                {[0, 10, 20, 30, 40, 50].map((v) => (
                  <div key={v} className="flex flex-col items-center">
                    <div className="h-1.5 w-px bg-slate-600" />
                    <div className={`h-0.5 ${v < 50 ? 'w-3' : 'w-0'} ${v % 20 === 0 ? 'bg-accent-500/40' : 'bg-slate-700'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected floor floating info card */}
          {selection.kind === 'floor' && selectedFloor && selectedBuilding && (
            <div className="absolute top-16 left-3 z-10 animate-fade-in-up">
              <div className="glass-panel p-3 w-52 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-200">
                    Selected: {selectedFloor.label}
                  </span>
                  <span className="text-[9px] text-slate-600">›</span>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500">Floor Area</div>
                  <div className="text-base font-semibold text-slate-100">
                    {selectedFloor.areaSqft} sq.ft
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-accent-400">⬡</span>
                  <span className="text-slate-400">{selectedFloor.useType}</span>
                </div>
                {selectedFloor.status === 'violation' && (
                  <div className="flex items-center gap-1.5 text-[10px] text-danger-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-danger-500 animate-pulse-soft" />
                    Spatial Anomaly
                  </div>
                )}
                {selectedFloor.status === 'warning' && (
                  <div className="flex items-center gap-1.5 text-[10px] text-warn-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-warn-500" />
                    Pending Verification
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Idle hint — only when nothing selected */}
          {selection.kind === null && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none animate-fade-in">
              <div className="glass-panel-tight px-3 py-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                <Box className="h-3.5 w-3.5 text-accent-400/60" />
                Click a parcel, building, or floor in the 3D scene to inspect
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
