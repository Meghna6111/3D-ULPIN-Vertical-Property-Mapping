import {
  Info,
  User,
  Ruler,
  ShieldCheck,
  FileWarning,
  MapPin,
  Building2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import type { Parcel, SelectionState } from '@/types/property';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ULPINCard } from '@/components/ulpin/ULPINCard';
import { resolveSelectedBuilding, resolveSelectedFloor } from '@/utils/selection';
import { verificationClass, verificationLabel } from '@/utils/status';
import { generateFloorEvidenceRecord } from '@/services/verification/EvidenceService';
import { VerificationEvidencePanel } from '@/components/property/VerificationEvidencePanel';

interface PropertyIntelligenceProps {
  parcel: Parcel;
  selection: SelectionState;
  onSelectParcel?: () => void;
  onSelectBuilding?: (buildingId: string) => void;
  onSelectFloor?: (buildingId: string, floorId: string) => void;
}

export function PropertyIntelligence({
  parcel,
  selection,
  onSelectParcel,
  onSelectBuilding,
  onSelectFloor,
}: PropertyIntelligenceProps) {
  const building = resolveSelectedBuilding(parcel, selection);
  const floor = resolveSelectedFloor(parcel, selection);

  const defaultBuildingId = parcel.buildings[0]?.id || 'BLD-A-001';
  const defaultFloorId =
    floor?.id || parcel.buildings[0]?.floors[0]?.id || 'BLD-A-001-G';

  const handleTabClick = (tab: 'parcel' | 'building' | 'floor') => {
    if (tab === 'parcel') {
      onSelectParcel?.();
    } else if (tab === 'building') {
      onSelectBuilding?.(defaultBuildingId);
    } else if (tab === 'floor') {
      onSelectFloor?.(defaultBuildingId, defaultFloorId);
    }
  };

  if (selection.kind === null) {
    return (
      <div className="flex flex-col h-full">
        <PanelHeader
          title="Property Intelligence"
          subtitle="Real-time cadastral information"
        />
        {/* View-mode tabs to initiate selection */}
        <div className="px-3 py-2 border-b border-white/[0.04] shrink-0 flex gap-0.5">
          <TabPill
            label="Parcel"
            active={false}
            onClick={() => handleTabClick('parcel')}
          />
          <TabPill
            label="Building"
            active={false}
            onClick={() => handleTabClick('building')}
          />
          <TabPill
            label="Floor"
            active={false}
            onClick={() => handleTabClick('floor')}
          />
        </div>
        <EmptyState onSelectDemo={() => onSelectFloor?.('BLD-A-001', 'BLD-A-001-F03')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Property Intelligence"
        subtitle="Real-time cadastral information"
        selection={selection}
      />

      {/* View-mode tabs */}
      <div className="px-3 py-2 border-b border-white/[0.04] shrink-0 flex gap-0.5">
        <TabPill
          label="Parcel"
          active={selection.kind === 'parcel'}
          onClick={() => handleTabClick('parcel')}
        />
        <TabPill
          label="Building"
          active={selection.kind === 'building'}
          onClick={() => handleTabClick('building')}
        />
        <TabPill
          label="Floor"
          active={selection.kind === 'floor'}
          onClick={() => handleTabClick('floor')}
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        {/* Selection breadcrumb */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 flex-wrap">
          <button
            onClick={() => onSelectParcel?.()}
            className="flex items-center gap-1 hover:text-accent-300 transition-colors"
          >
            <MapPin className="h-3 w-3" />
            <span className="font-mono">{parcel.id}</span>
          </button>
          {building && (
            <>
              <span className="text-slate-700">/</span>
              <button
                onClick={() => onSelectBuilding?.(building.id)}
                className="flex items-center gap-1 hover:text-accent-300 transition-colors"
              >
                <Building2 className="h-3 w-3" />
                <span className="font-mono">{building.id}</span>
              </button>
            </>
          )}
          {floor && (
            <>
              <span className="text-slate-700">/</span>
              <span className="flex items-center gap-1 text-accent-300">
                <Layers className="h-3 w-3" />
                <span className="font-mono">{floor.id}</span>
              </span>
            </>
          )}
        </div>

        {/* Parcel details */}
        {selection.kind === 'parcel' && (
          <DetailCard title="Parcel Information">
            <DetailRow
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Parcel ID"
              value={parcel.id}
              mono
            />
            <DetailRow label="Label" value={parcel.label} />
            <DetailRow
              label="Land Area"
              value={`${parcel.landAreaSqft.toLocaleString()} sq.ft`}
            />
            <DetailRow
              label="Coordinates"
              value={`${parcel.longitude.toFixed(4)}°, ${parcel.latitude.toFixed(4)}°`}
              mono
            />
            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-white/[0.04]">
              <span className="text-[10px] text-slate-500">Status</span>
              <StatusBadge status={parcel.status} size="md" />
            </div>
          </DetailCard>
        )}

        {/* Building details */}
        {selection.kind === 'building' && building && (
          <DetailCard title="Building Information">
            <DetailRow
              icon={<Building2 className="h-3.5 w-3.5" />}
              label="Building ID"
              value={building.id}
              mono
            />
            <DetailRow label="Label" value={building.label} />
            <DetailRow label="Above-ground Floors" value={`${building.totalFloors}`} />
            <DetailRow label="Basements" value={`${building.basementCount}`} />
            <DetailRow label="Total Units" value={`${building.floors.length}`} />
            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-white/[0.04]">
              <span className="text-[10px] text-slate-500">Status</span>
              <StatusBadge status={building.status} size="md" />
            </div>
          </DetailCard>
        )}

        {/* Floor details */}
        {selection.kind === 'floor' && floor && building && (
          <>
            {/* ULPIN Card at the top for prominence */}
            <ULPINCard ulpin={floor.ulpin} floorLabel={floor.label} />

            {/* Ground-Truth Evidence Layer Panel */}
            <VerificationEvidencePanel
              evidence={generateFloorEvidenceRecord(floor, building, parcel)}
              onFocusFloorInCesium={() => onSelectFloor?.(building.id, floor.id)}
            />

            <DetailCard title="Floor Information">
              <DetailRow
                icon={<Layers className="h-3.5 w-3.5" />}
                label="Floor ID"
                value={floor.id}
                mono
              />
              <DetailRow label="Floor" value={floor.label} />
              <DetailRow label="Building" value={building.label} />
              <DetailRow
                icon={<Ruler className="h-3.5 w-3.5" />}
                label="Floor Area"
                value={`${floor.areaSqft} sq.ft`}
              />
              <DetailRow label="Use Type" value={floor.useType} />
              <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-white/[0.04]">
                <span className="text-[10px] text-slate-500">Property Status</span>
                <StatusBadge status={floor.status} size="md" />
              </div>
            </DetailCard>

            {/* Owner section */}
            <DetailCard title="Owner Details">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent-500/10 border border-accent-500/20 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-accent-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-slate-200 truncate">
                    {floor.owner}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <VerificationPill status={floor.verification} />
                  </div>
                </div>
              </div>
            </DetailCard>

            {/* Floor Status & Verification */}
            <DetailCard title="Administrative Title Status">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verification State
                </span>
                <span
                  className={`text-[11px] font-medium ${verificationClass(floor.verification)}`}
                >
                  {verificationLabel(floor.verification)}
                </span>
              </div>

              {floor.verification === 'mismatch' && (
                <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-danger-500/8 border border-danger-500/15 text-[10px] text-danger-400 leading-relaxed">
                  <FileWarning className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Spatial mismatch detected — floor area or internal partition
                    does not match registered cadastre records.
                  </span>
                </div>
              )}

              {floor.verification === 'pending' && (
                <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-warn-500/8 border border-warn-500/15 text-[10px] text-warn-400 leading-relaxed">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Verification pending — property documents are under review.
                  </span>
                </div>
              )}
            </DetailCard>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function PanelHeader({
  title,
  subtitle,
  selection,
}: {
  title: string;
  subtitle: string;
  selection?: SelectionState;
}) {
  return (
    <div className="px-4 py-3 border-b border-white/[0.04] shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            {title}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div>
        </div>
        {selection?.kind === 'floor' && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-success-500/10 border border-success-500/20 text-success-400">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Floor View
          </span>
        )}
        {selection?.kind === 'building' && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-signal-blue/10 border border-signal-blue/20 text-signal-blue">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Building View
          </span>
        )}
        {selection?.kind === 'parcel' && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-accent-500/10 border border-accent-500/20 text-accent-300">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Parcel View
          </span>
        )}
      </div>
    </div>
  );
}

function TabPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium text-center transition-all ${
        active
          ? 'bg-accent-500/15 text-accent-300 border border-accent-500/25 shadow-glow'
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border border-transparent'
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ onSelectDemo }: { onSelectDemo?: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-base-700/30 border border-white/[0.04] flex items-center justify-center mb-4">
        <Info className="h-6 w-6 text-slate-600" />
      </div>
      <div className="text-sm text-slate-400 font-medium">No Property Selected</div>
      <div className="text-[11px] text-slate-600 mt-1.5 max-w-[220px] leading-relaxed">
        Select a parcel, building, or floor from the explorer or the 3D map to view its intelligence.
      </div>
      {onSelectDemo && (
        <button
          onClick={onSelectDemo}
          className="mt-4 px-3 py-1.5 rounded-md bg-accent-500/10 border border-accent-500/20 text-[11px] text-accent-300 hover:bg-accent-500/20 transition-all"
        >
          Inspect Sample Floor 03
        </button>
      )}
    </div>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-panel-tight p-3.5 animate-fade-in-up">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="data-row">
      <span className="data-row-label">
        {icon}
        {label}
      </span>
      <span className={`data-row-value ${mono ? 'font-mono text-[10px]' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function VerificationPill({ status }: { status: string }) {
  if (status === 'verified') {
    return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-success-500/10 border border-success-500/20 text-success-400">
        <CheckCircle2 className="h-2.5 w-2.5" />
        Verified Owner
      </span>
    );
  }
  if (status === 'mismatch') {
    return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-danger-500/10 border border-danger-500/20 text-danger-400">
        <XCircle className="h-2.5 w-2.5" />
        Mismatch
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-warn-500/10 border border-warn-500/20 text-warn-400">
      <AlertTriangle className="h-2.5 w-2.5" />
      Pending Review
    </span>
  );
}
