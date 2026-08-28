import { ChevronDown, ChevronRight, MapPin, Building2, Layers, Search, PanelLeftClose } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Parcel, SelectionState } from '@/types/property';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface PropertyExplorerProps {
  parcel: Parcel;
  selection: SelectionState;
  onSelectParcel: () => void;
  onSelectBuilding: (buildingId: string) => void;
  onSelectFloor: (buildingId: string, floorId: string) => void;
  onToggleCollapse?: () => void;
}

export function PropertyExplorer({
  parcel,
  selection,
  onSelectParcel,
  onSelectBuilding,
  onSelectFloor,
  onToggleCollapse,
}: PropertyExplorerProps) {
  const [buildingExpanded, setBuildingExpanded] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  const parcelSelected = selection.kind === 'parcel';

  // Filter building floors by local query if provided
  const filteredFloors = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    const floors = parcel.buildings[0]?.floors || [];
    if (!q) return floors;
    return floors.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.useType.toLowerCase().includes(q) ||
        f.owner.toLowerCase().includes(q) ||
        f.ulpin.code.toLowerCase().includes(q),
    );
  }, [parcel, filterQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Property Explorer
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Vertical property hierarchy
            </div>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Collapse Explorer Panel"
              className="h-6 px-2 rounded text-[10px] text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors flex items-center gap-1 border border-white/[0.04]"
            >
              <PanelLeftClose className="h-3 w-3" />
              <span>Hide</span>
            </button>
          )}
        </div>

        {/* Local Filter Input */}
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter floors in building..."
            className="w-full bg-base-800/50 border border-white/[0.04] rounded-md pl-7 pr-3 py-1.5 text-[11px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-accent-500/30 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2">
        {/* Parcel node */}
        <button
          onClick={onSelectParcel}
          className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all mb-1 hover-glow ${
            parcelSelected
              ? 'bg-accent-500/10 border border-accent-500/25 shadow-glow'
              : 'hover:bg-white/[0.03] border border-transparent'
          }`}
        >
          <div
            className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
              parcelSelected
                ? 'bg-accent-500/15 border border-accent-500/30'
                : 'bg-base-700/50 border border-white/[0.06]'
            }`}
          >
            <MapPin
              className={`h-3.5 w-3.5 ${parcelSelected ? 'text-accent-400' : 'text-slate-500'}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-slate-200 font-medium truncate">
              {parcel.label}
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
              {parcel.id}
            </div>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-500">
                {parcel.landAreaSqft.toLocaleString()} sq.ft
              </span>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[10px] text-slate-500">
                {parcel.buildings.length} Building
              </span>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[10px] text-slate-500">
                {parcel.buildings[0].floors.length} Floors
              </span>
              <StatusBadge status={parcel.status} />
            </div>
          </div>
        </button>

        {/* Buildings */}
        {parcel.buildings.map((building) => {
          const buildingSelected =
            selection.kind === 'building' && selection.buildingId === building.id;
          const floorInBuildingSelected =
            selection.kind === 'floor' && selection.buildingId === building.id;

          return (
            <div key={building.id} className="ml-3 mt-0.5">
              {/* Building Node */}
              <div className="relative">
                <button
                  onClick={() => {
                    setBuildingExpanded((v) => !v);
                    onSelectBuilding(building.id);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all hover-glow ${
                    buildingSelected
                      ? 'bg-signal-blue/10 border border-signal-blue/25 shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_0_16px_-4px_rgba(59,130,246,0.2)]'
                      : 'hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <span className="shrink-0 text-slate-600 transition-transform">
                    {buildingExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </span>
                  <Building2
                    className={`h-3.5 w-3.5 shrink-0 ${buildingSelected ? 'text-signal-blue' : 'text-slate-500'}`}
                  />
                  <span className="text-[11px] text-slate-200 font-medium flex-1 truncate">
                    {building.label}
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono">
                    {building.id}
                  </span>
                  <StatusBadge status={building.status} />
                </button>
              </div>

              {/* Floors Tree */}
              {buildingExpanded && (
                <div className="ml-4 mt-0.5 border-l border-white/[0.04] pl-2.5 space-y-0.5">
                  {filteredFloors.length === 0 ? (
                    <div className="text-[10px] text-slate-600 py-2 pl-2">
                      No matching floors
                    </div>
                  ) : (
                    filteredFloors.map((floor) => {
                      const floorSelected =
                        selection.kind === 'floor' &&
                        selection.floorId === floor.id;

                      const statusDot =
                        floor.status === 'violation'
                          ? 'bg-danger-500'
                          : floor.status === 'warning'
                            ? 'bg-warn-500'
                            : floor.status === 'verified'
                              ? 'bg-success-500'
                              : 'bg-accent-400';

                      return (
                        <button
                          key={floor.id}
                          onClick={() => onSelectFloor(building.id, floor.id)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all ${
                            floorSelected
                              ? 'bg-accent-500/15 border border-accent-500/25 shadow-glow'
                              : floorInBuildingSelected
                                ? 'bg-white/[0.02]'
                                : 'hover:bg-white/[0.03] border border-transparent'
                          }`}
                        >
                          <Layers
                            className={`h-3 w-3 shrink-0 ${
                              floorSelected ? 'text-accent-400' : 'text-slate-600'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-[11px] truncate block ${
                                floorSelected ? 'text-accent-200 font-medium' : 'text-slate-400'
                              }`}
                            >
                              {floor.label}
                            </span>
                            <span className="text-[9px] text-slate-600 truncate block">
                              {floor.useType}
                            </span>
                          </div>
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDot}`}
                          />
                        </button>
                      );
                    })
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
