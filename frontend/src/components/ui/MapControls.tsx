import { Home, Crosshair, RotateCcw, Layers, Siren, Box, Map } from 'lucide-react';
import type { MapMode } from '@/types/property';

interface MapControlsProps {
  mapMode: MapMode;
  onToggleMapMode: () => void;
  onHome: () => void;
  onFocus: () => void;
  onReset: () => void;
  isRescueActive?: boolean;
  onToggleRescueView?: () => void;
}

export function MapControls({
  mapMode,
  onToggleMapMode,
  onHome,
  onFocus,
  onReset,
  isRescueActive,
  onToggleRescueView,
}: MapControlsProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <div className="glass-panel flex items-center gap-0.5 px-1.5 py-1 shadow-panel-lg">
        {/* 2D / 3D Toggle */}
        <div className="flex items-center bg-base-800/60 rounded-md p-0.5 mr-1 border border-white/[0.04]">
          <button
            onClick={mapMode === '2d' ? undefined : onToggleMapMode}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              mapMode === '2d'
                ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30 shadow-glow'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            title="Switch to 2D Orthographic Cadastre Map"
          >
            <Map className="h-3 w-3 inline mr-1" />
            2D
          </button>
          <button
            onClick={mapMode === '3d' ? undefined : onToggleMapMode}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              mapMode === '3d'
                ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30 shadow-glow'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
            title="Switch to 3D Perspective Digital Twin Scene"
          >
            <Box className="h-3 w-3 inline mr-1" />
            3D
          </button>
        </div>

        <Divider />

        {/* Home Overview */}
        <ControlButton
          onClick={onHome}
          icon={<Home className="h-3.5 w-3.5" />}
          label="Home"
          tooltip="Return camera to full property overview"
        />

        {/* Focus on Selection */}
        <ControlButton
          onClick={onFocus}
          icon={<Crosshair className="h-3.5 w-3.5" />}
          label="Focus"
          tooltip="Focus camera on the currently selected floor or building"
        />

        {/* Reset State & View */}
        <ControlButton
          onClick={onReset}
          icon={<RotateCcw className="h-3.5 w-3.5" />}
          label="Reset"
          tooltip="Reset view and clear active selections"
        />

        <Divider />

        {/* Layers — Future Phase */}
        <ControlButton
          disabled
          icon={<Layers className="h-3.5 w-3.5" />}
          label="Layers"
          tooltip="GIS layers control (Coming in future integration phase)"
        />

        {/* Disaster Rescue Module Toggle */}
        <ControlButton
          active={isRescueActive}
          onClick={onToggleRescueView}
          icon={<Siren className="h-3.5 w-3.5" />}
          label="Rescue View"
          tooltip="Toggle 3D Disaster & Evacuation Rescue View"
        />
      </div>
    </div>
  );
}

function ControlButton({
  icon,
  label,
  onClick,
  active,
  disabled,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
}) {
  const base =
    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all';
  const styles = disabled
    ? 'text-slate-600 cursor-not-allowed opacity-40 hover:bg-transparent'
    : active
      ? 'text-accent-300 bg-accent-500/15 border border-accent-500/25 shadow-glow'
      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={tooltip}
      className={`${base} ${styles}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="h-5 w-px bg-white/[0.06] mx-0.5" />;
}
