import { useState, useMemo } from 'react';
import type { Parcel, SelectionState } from '@/types/property';
import type { DisasterDataset, FloorEmergencyData, IncidentEvent, FloorPriorityResult } from '@/types/disaster';
import { IncidentPanel } from './IncidentPanel';
import { RiskPanel } from './RiskPanel';
import { OccupantPanel } from './OccupantPanel';
import { RescueTeamsPanel } from './RescueTeamsPanel';
import { EmergencyPointsPanel } from './EmergencyPointsPanel';
import { CommunicationPanel } from './CommunicationPanel';
import { IncidentActivityFeed } from './IncidentActivityFeed';
import { PriorityQueuePanel } from './PriorityQueuePanel';
import { ArrowLeft, Building2 } from 'lucide-react';

interface DisasterViewProps {
  parcel: Parcel;
  selection: SelectionState;
  disasterData: DisasterDataset;
  onSelectFloor: (buildingId: string, floorId: string) => void;
  onSelectRoute: (routeId: string) => void;
  onExitDisasterView: () => void;
  onAddIncidentEvent: (event: IncidentEvent) => void;
}

export function DisasterView({
  parcel,
  selection,
  disasterData,
  onSelectFloor,
  onSelectRoute,
  onExitDisasterView,
  onAddIncidentEvent,
}: DisasterViewProps) {
  const [activeTab, setActiveTab] = useState<'response' | 'teams' | 'routes'>('response');

  const firstBuilding = parcel.buildings[0];

  // Resolve selected floor's emergency data
  const selectedFloorData: FloorEmergencyData | undefined = useMemo(() => {
    if (selection.kind === 'floor' && selection.floorId) {
      return disasterData.floors.get(selection.floorId);
    }
    // Default to Critical Floor 03 or first available
    const criticalFloor = Array.from(disasterData.floors.values()).find(
      (f) => f.emergencyStatus === 'CRITICAL',
    );
    return criticalFloor || disasterData.floors.values().next().value;
  }, [selection, disasterData]);

  // Resolve selected floor's priority result from the engine queue
  const selectedPriorityResult: FloorPriorityResult | undefined = useMemo(() => {
    if (!selectedFloorData) return undefined;
    return disasterData.priorityQueue?.find((r) => r.floorId === selectedFloorData.floorId);
  }, [selectedFloorData, disasterData.priorityQueue]);

  const handleTriggerCommunication = (
    title: string,
    description: string,
    severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS',
  ) => {
    const newEvent: IncidentEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      title,
      description,
      severity,
      source: 'Incident Commander Web Console',
    };
    onAddIncidentEvent(newEvent);
  };

  return (
    <>
      {/* Left Panel: Incident Overview, Priority Queue & Strata Sector Selector */}
      <aside className="w-[350px] shrink-0 flex flex-col bg-base-950/85 backdrop-blur-xl border-r border-danger-500/20 z-10 overflow-hidden shadow-2xl">
        {/* Top Emergency Header Bar */}
        <div className="p-3 bg-danger-950/40 border-b border-danger-500/25 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-danger-500 animate-ping" />
            <span className="text-xs font-black tracking-wider text-danger-300 uppercase">
              Disaster Response Mode
            </span>
          </div>
          <button
            type="button"
            onClick={onExitDisasterView}
            className="px-2 py-1 rounded bg-base-800/80 border border-white/[0.08] text-[10px] text-slate-300 hover:text-white flex items-center gap-1 hover:border-white/20 transition-all font-mono"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Cadastre</span>
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
          <IncidentPanel incident={disasterData.incident} />

          {/* Rescue Priority Queue Section */}
          {disasterData.priorityQueue && disasterData.priorityQueue.length > 0 && (
            <PriorityQueuePanel
              priorityQueue={disasterData.priorityQueue}
              selectedFloorId={selectedFloorData?.floorId}
              onSelectFloor={(floorId) => {
                if (firstBuilding) onSelectFloor(firstBuilding.id, floorId);
              }}
            />
          )}

          {/* Interactive Floor Strata Emergency Matrix */}
          {firstBuilding && (
            <div className="p-3 bg-base-900/80 border border-white/[0.08] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-accent-400" /> Vertical Emergency Strata
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {firstBuilding.floors.length} Levels
                </span>
              </div>

              <div className="space-y-1.5">
                {[...firstBuilding.floors].reverse().map((floor) => {
                  const emergency = disasterData.floors.get(floor.id);
                  const priorityRes = disasterData.priorityQueue?.find((r) => r.floorId === floor.id);
                  const isSelected =
                    selection.kind === 'floor'
                      ? selection.floorId === floor.id
                      : selectedFloorData?.floorId === floor.id;

                  let statusBadge = 'bg-slate-500/20 text-slate-400 border-slate-500/30';
                  let borderLeft = 'border-l-2 border-slate-600';
                  let priorityBadgeColor = 'bg-slate-500/20 text-slate-400 border-slate-500/30';

                  if (emergency?.priority === 'P1' || priorityRes?.priority === 'P1') {
                    statusBadge = 'bg-danger-500/25 text-danger-300 border-danger-500/40';
                    borderLeft = 'border-l-4 border-danger-500';
                    priorityBadgeColor = 'bg-danger-500/30 text-danger-200 border-danger-500/60 font-black';
                  } else if (emergency?.priority === 'P2' || priorityRes?.priority === 'P2') {
                    statusBadge = 'bg-orange-500/25 text-orange-300 border-orange-500/40';
                    borderLeft = 'border-l-4 border-orange-500';
                    priorityBadgeColor = 'bg-orange-500/30 text-orange-200 border-orange-500/60 font-bold';
                  } else if (emergency?.priority === 'P3' || priorityRes?.priority === 'P3') {
                    statusBadge = 'bg-amber-500/25 text-amber-300 border-amber-500/40';
                    borderLeft = 'border-l-4 border-amber-500';
                    priorityBadgeColor = 'bg-amber-500/30 text-amber-200 border-amber-500/60';
                  } else if (emergency?.emergencyStatus === 'SAFE' || priorityRes?.priority === 'P4') {
                    statusBadge = 'bg-success-500/25 text-success-300 border-success-500/40';
                    borderLeft = 'border-l-4 border-success-500';
                    priorityBadgeColor = 'bg-success-500/30 text-success-200 border-success-500/60';
                  }

                  return (
                    <button
                      key={floor.id}
                      type="button"
                      onClick={() => onSelectFloor(firstBuilding.id, floor.id)}
                      className={`w-full p-2 rounded-lg text-left transition-all flex items-center justify-between text-xs ${borderLeft} ${
                        isSelected
                          ? 'bg-base-800 border border-white/20 shadow-glow'
                          : 'bg-base-800/50 border border-white/[0.04] hover:bg-base-800/80 hover:border-white/10'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{floor.label}</span>
                          {(emergency?.priority === 'P1' || priorityRes?.priority === 'P1') && (
                            <span className="h-1.5 w-1.5 rounded-full bg-danger-500 animate-ping" />
                          )}
                        </div>
                        <div className="text-[9.5px] text-slate-400 font-mono">
                          {emergency?.estimatedOccupants} occupants • {emergency?.accessStatus} access
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-1 justify-end">
                          <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-mono border ${statusBadge}`}>
                            {emergency?.emergencyStatus}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-mono border ${priorityBadgeColor}`}>
                            {priorityRes?.priority || emergency?.priority}
                          </span>
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-mono">
                          Score: {priorityRes?.score ?? 0}/100
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <IncidentActivityFeed events={disasterData.events} />
        </div>
      </aside>

      {/* Right Panel: Strata Risk, Occupants, Rescue Teams, & Directives */}
      <aside className="w-[380px] shrink-0 flex flex-col bg-base-950/85 backdrop-blur-xl border-l border-danger-500/20 z-10 overflow-hidden shadow-2xl">
        {/* Navigation Tabs */}
        <div className="p-2 border-b border-white/[0.06] bg-base-900/60 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('response')}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
              activeTab === 'response'
                ? 'bg-danger-500/20 text-danger-300 border border-danger-500/30 shadow-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Strata Risk & Directives
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
              activeTab === 'teams'
                ? 'bg-danger-500/20 text-danger-300 border border-danger-500/30 shadow-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rescue Units ({disasterData.teams.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('routes')}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
              activeTab === 'routes'
                ? 'bg-danger-500/20 text-danger-300 border border-danger-500/30 shadow-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Evacuation
          </button>
        </div>

        {/* Dynamic Tab Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
          {activeTab === 'response' && (
            <>
              <RiskPanel
                floorData={selectedFloorData}
                priorityResult={selectedPriorityResult}
              />
              <OccupantPanel floorData={selectedFloorData} />
              <CommunicationPanel
                onTriggerEvent={handleTriggerCommunication}
                floorData={selectedFloorData}
                priorityResult={selectedPriorityResult}
              />
            </>
          )}

          {activeTab === 'teams' && (
            <>
              <RescueTeamsPanel
                teams={disasterData.teams}
                selectedFloorId={selectedFloorData?.floorId}
                onSelectFloor={(floorId) => {
                  if (firstBuilding) onSelectFloor(firstBuilding.id, floorId);
                }}
              />
              <CommunicationPanel
                onTriggerEvent={handleTriggerCommunication}
                floorData={selectedFloorData}
                priorityResult={selectedPriorityResult}
              />
            </>
          )}

          {activeTab === 'routes' && (
            <>
              <EmergencyPointsPanel
                points={disasterData.emergencyPoints}
                routes={disasterData.routes}
                activeRouteId={disasterData.activeRouteId}
                onSelectRoute={onSelectRoute}
              />
              <CommunicationPanel
                onTriggerEvent={handleTriggerCommunication}
                floorData={selectedFloorData}
                priorityResult={selectedPriorityResult}
              />
            </>
          )}
        </div>
      </aside>
    </>
  );
}
