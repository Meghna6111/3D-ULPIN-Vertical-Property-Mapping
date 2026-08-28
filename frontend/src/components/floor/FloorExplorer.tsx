import { ArrowUp, ArrowDown, Building as BuildingIcon } from 'lucide-react';
import type { Building, Floor, SelectionState } from '@/types/property';

interface FloorExplorerProps {
  building: Building;
  selection: SelectionState;
  onSelectFloor: (buildingId: string, floorId: string) => void;
}

/**
 * Vertical floor explorer — visualizes the building's floor strata from
 * roof down to basement. Communicates vertical property mapping.
 */
export function FloorExplorer({ building, selection, onSelectFloor }: FloorExplorerProps) {
  const sortedFloors = [...building.floors].sort((a, b) => b.levelIndex - a.levelIndex);

  return (
    <div className="px-3 py-3">
      <div className="flex items-center gap-2 mb-3">
        <BuildingIcon className="h-3.5 w-3.5 text-accent-500/60" />
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Vertical Explorer
        </span>
        <span className="text-[9px] text-slate-600 ml-auto font-mono">
          {building.id}
        </span>
      </div>

      <div className="flex flex-col gap-[3px]">
        {/* Roof label */}
        <div className="text-[9px] text-slate-600 text-center flex items-center justify-center gap-1 py-0.5">
          <ArrowUp className="h-2.5 w-2.5" />
          <span className="uppercase tracking-wider">Roof</span>
        </div>

        {sortedFloors.map((floor) => (
          <FloorBar
            key={floor.id}
            floor={floor}
            selected={selection.kind === 'floor' && selection.floorId === floor.id}
            onClick={() => onSelectFloor(building.id, floor.id)}
          />
        ))}

        {/* Ground label */}
        <div className="text-[9px] text-slate-600 text-center flex items-center justify-center gap-1 py-0.5">
          <ArrowDown className="h-2.5 w-2.5" />
          <span className="uppercase tracking-wider">Ground Level</span>
        </div>
      </div>
    </div>
  );
}

function FloorBar({
  floor,
  selected,
  onClick,
}: {
  floor: Floor;
  selected: boolean;
  onClick: () => void;
}) {
  const statusColor = getStatusColor(floor);
  const isBasement = floor.kind === 'basement';

  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-all overflow-hidden ${
        selected
          ? 'bg-accent-500/15 border border-accent-500/25 shadow-glow'
          : `bg-base-800/40 border border-white/[0.04] hover:bg-base-700/40 hover:border-white/[0.08]`
      }`}
    >
      {/* Status accent bar on left */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l ${statusColor}`}
      />

      <span className={`text-[11px] flex-1 truncate pl-1 ${
        selected ? 'text-accent-200 font-medium' : 'text-slate-400'
      }`}>
        {floor.label}
      </span>

      {isBasement && (
        <span className="text-[8px] text-slate-600 uppercase tracking-widest font-mono">
          B
        </span>
      )}

      {floor.status === 'violation' && (
        <span className="h-1.5 w-1.5 rounded-full bg-danger-500 animate-pulse-soft" />
      )}
      {floor.status === 'warning' && (
        <span className="h-1.5 w-1.5 rounded-full bg-warn-500" />
      )}
    </button>
  );
}

function getStatusColor(floor: Floor): string {
  if (floor.status === 'violation') return 'bg-danger-500';
  if (floor.status === 'warning') return 'bg-warn-500';
  if (floor.status === 'verified') return 'bg-success-500';
  return 'bg-accent-500/50';
}
