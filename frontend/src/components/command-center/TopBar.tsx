import { Bell, Box, ShieldCheck, MapPin, Plus, Sparkles, RefreshCw, Lock } from 'lucide-react';
import { SearchField } from '@/components/ui/SearchField';
import type { SearchEntry, SelectionState, Parcel } from '@/types/property';
import { useAuth } from '@/services/auth/AuthContext';

interface TopBarProps {
  onSelectSearchResult: (entry: SearchEntry) => void;
  selection: SelectionState;
  activeView?: 'command' | 'disaster';
  onNavigateCommandCenter?: () => void;
  onNavigateDisaster?: () => void;
  onOpenCreateProperty?: () => void;
  isGeneratedActive?: boolean;
  hasGeneratedProperty?: boolean;
  onSwitchToDemo?: () => void;
  onSwitchToGenerated?: () => void;
  activeParcel?: Parcel;
  savedParcels?: Parcel[];
  onOpenAuth?: () => void;
}

export function TopBar({
  onSelectSearchResult,
  selection,
  activeView = 'command',
  onNavigateCommandCenter,
  onNavigateDisaster,
  onOpenCreateProperty,
  isGeneratedActive,
  hasGeneratedProperty,
  onSwitchToDemo,
  onSwitchToGenerated,
  activeParcel,
  savedParcels,
  onOpenAuth,
}: TopBarProps) {
  const { user, mockUser, logout } = useAuth();
  const currentUser = user || mockUser;

  const selectionLabel = selection.kind
    ? `${selection.kind.toUpperCase()} SELECTED`
    : 'READY';

  return (
    <header className="h-12 shrink-0 flex items-center justify-between px-4 glass-panel-header z-20">
      {/* Left: logo + navigation + create action */}
      <div className="flex items-center gap-3.5">
        {/* Logo / Wordmark */}
        <button
          onClick={onNavigateCommandCenter}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-md border border-accent-400/25 group-hover:scale-[1.02] transition-transform">
            <Box className="h-4 w-4 text-white animate-pulse-soft" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-bold tracking-wider text-slate-100 font-mono">SIH26011</span>
            <span className="text-[9px] font-bold text-slate-500 font-mono tracking-widest uppercase">3D ULPIN GIS</span>
          </div>
        </button>

        {/* View Switchers */}
        <div className="h-4 w-[1px] bg-white/[0.06] hidden sm:block" />

        <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-base-950/40 border border-white/[0.04] hidden sm:flex">
          <NavPill
            label="COMMAND CENTER"
            active={activeView === 'command'}
            onClick={onNavigateCommandCenter}
          />
          <NavPill
            label="DISASTER VIEW"
            active={activeView === 'disaster'}
            onClick={onNavigateDisaster}
          />
        </div>

        {/* 3D Property switch control pill */}
        {hasGeneratedProperty && (
          <>
            <div className="h-4 w-[1px] bg-white/[0.06] hidden md:block" />
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-accent-500/5 border border-accent-500/10 hidden md:flex">
              <button
                onClick={onSwitchToDemo}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${
                  !isGeneratedActive
                    ? 'bg-accent-500/15 text-accent-300 font-semibold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                DEMO CADASTRE
              </button>
              <button
                onClick={onSwitchToGenerated}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${
                  isGeneratedActive
                    ? 'bg-accent-500/15 text-accent-300 font-semibold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                CUSTOM PROPERTIES ({savedParcels?.length || 0})
              </button>
            </div>
          </>
        )}

        {/* Create 3D Property Trigger Button */}
        {activeView === 'command' && (
          <button
            onClick={onOpenCreateProperty}
            title="Upload Floorplan & Generate 3D Property"
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-accent-500 hover:bg-accent-600 border border-accent-600 text-white text-[10px] font-bold tracking-wide transition-all shadow-md font-mono"
          >
            <Plus className="h-3 w-3" />
            GENERATE 3D
          </button>
        )}
      </div>

      {/* Center: search */}
      <div className="flex items-center gap-3">
        <SearchField onSelect={onSelectSearchResult} savedParcels={savedParcels} />
      </div>

      {/* Right: location + status + notifications + user */}
      <div className="flex items-center gap-3">
        {/* Active Property Badge */}
        {activeParcel && (
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-base-800/40 px-2 py-1 rounded border border-white/[0.04]">
            <span className="text-slate-500">PARCEL:</span>
            <span className="text-slate-200 truncate max-w-[120px]">{activeParcel.id}</span>
          </div>
        )}

        {/* System status */}
        <div className="hidden md:flex items-center gap-1.5 text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse-soft" />
          <span className="text-success-400 font-medium tracking-wide uppercase">
            {selectionLabel}
          </span>
        </div>

        {/* Notifications */}
        <button
          title="Notifications (Land Records Feed)"
          className="relative h-8 w-8 rounded-lg bg-base-800/60 border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-white/10 transition-all"
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-warn-500" />
        </button>

        {/* User profile */}
        {currentUser ? (
          <div
            onClick={() => {
              if (window.confirm('Do you want to secure sign out?')) {
                logout().catch(() => {});
              }
            }}
            title="Click to Secure Sign Out"
            className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-base-800/50 border border-white/[0.06] hover:bg-white/[0.04] cursor-pointer transition-all"
          >
            <div className="h-6 w-6 rounded-full bg-accent-500/15 border border-accent-500/25 flex items-center justify-center">
              <ShieldCheck className="h-3 w-3 text-accent-400" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] text-slate-200 font-medium truncate max-w-[100px]">
                {currentUser.email?.split('@')[0] || 'Officer'}
              </span>
              <span className="text-[9px] text-slate-500">Sign Out</span>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 border border-accent-600 text-white text-[11px] font-semibold tracking-wide transition-all shadow-md font-mono"
          >
            <Lock className="h-3 w-3" />
            SECURE SIGN IN
          </button>
        )}
      </div>
    </header>
  );
}

function NavPill({
  label,
  active,
  disabled,
  tooltip,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={tooltip}
      className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
        active
          ? 'bg-accent-500 text-white shadow-sm'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
      }`}
    >
      {label}
    </button>
  );
}
