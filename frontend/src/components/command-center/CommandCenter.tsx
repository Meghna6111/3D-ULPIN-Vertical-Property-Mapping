import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import { TopBar } from '@/components/command-center/TopBar';
import { PropertyExplorer } from '@/components/property/PropertyExplorer';
import { PropertyIntelligence } from '@/components/property/PropertyIntelligence';
import { FloorExplorer } from '@/components/floor/FloorExplorer';
import { CesiumMount } from '@/components/ui/CesiumMount';
import { MapControls } from '@/components/ui/MapControls';
import { CreatePropertyModal } from '@/components/floorplan/CreatePropertyModal';
import { DisasterView } from '@/components/disaster/DisasterView';
import { AuthModal } from '@/components/auth/AuthModal';
import { useCommandCenterState } from '@/hooks/useCommandCenterState';
import { useCesiumAdapter } from '@/hooks/useCesiumAdapter';
import { createDisasterDataset } from '@/services/disaster/DisasterService';
import { resolveSelectedBuilding } from '@/utils/selection';
import type { SearchEntry, SelectionState } from '@/types/property';
import type { DisasterDataset, IncidentEvent } from '@/types/disaster';

export function CommandCenter() {
  const state = useCommandCenterState();
  const containerRef = useRef<HTMLDivElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Disaster dataset tied to active parcel
  const initialDisasterData = useMemo(() => {
    return createDisasterDataset(state.parcel);
  }, [state.parcel]);

  const [disasterDataset, setDisasterDataset] = useState<DisasterDataset>(initialDisasterData);

  // Synchronize disaster dataset when active parcel changes
  useEffect(() => {
    setDisasterDataset(createDisasterDataset(state.parcel));
  }, [state.parcel]);

  // Stable selection callback so the adapter effect doesn't re-run
  const selectionCallbackRef = useRef((sel: SelectionState) => {
    state.select(sel);
  });
  selectionCallbackRef.current = state.select;

  const adapterRef = useCesiumAdapter(
    containerRef,
    state.parcel,
    (sel) => selectionCallbackRef.current(sel),
  );

  // Mark ready once the adapter has parcel loaded
  useEffect(() => {
    const t = setTimeout(() => state.setCesiumReady(true), 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync React selection → Cesium highlight
  useEffect(() => {
    adapterRef.current?.select(state.selection);
    if (state.selection.kind === 'floor' && state.selection.floorId) {
      adapterRef.current?.flyToFloor(state.selection.floorId);
    }
  }, [state.selection, adapterRef]);

  // Sync map mode
  useEffect(() => {
    adapterRef.current?.setMapMode(state.mapMode);
  }, [state.mapMode, adapterRef]);

  // Sync Disaster Mode into Cesium 3D View
  useEffect(() => {
    if (state.viewMode === 'disaster') {
      adapterRef.current?.setDisasterMode(true, disasterDataset);
    } else {
      adapterRef.current?.setDisasterMode(false);
    }
  }, [state.viewMode, disasterDataset, adapterRef]);

  const handleSearchSelect = useCallback(
    (entry: SearchEntry) => {
      // 1. If not the active parcel, switch or load it
      if (entry.parcelId !== state.activeParcel.id) {
        if (entry.parcelId === 'KA-BLR-DEMO-001') {
          state.switchToSampleParcel();
        } else {
          state.loadParcel(entry.parcelId);
        }
      }

      // 2. Directly set selection state using the parcelId from search entry
      if (entry.kind === 'parcel') {
        state.select({
          kind: 'parcel',
          parcelId: entry.parcelId,
          buildingId: null,
          floorId: null,
        });
      } else if (entry.kind === 'building') {
        state.select({
          kind: 'building',
          parcelId: entry.parcelId,
          buildingId: entry.buildingId,
          floorId: null,
        });
      } else if (entry.kind === 'floor' && entry.floorId) {
        state.select({
          kind: 'floor',
          parcelId: entry.parcelId,
          buildingId: entry.buildingId,
          floorId: entry.floorId,
        });
      }
    },
    [state],
  );

  const handleHomeCamera = useCallback(() => {
    adapterRef.current?.resetCamera();
  }, [adapterRef]);

  const handleFocusSelection = useCallback(() => {
    if (state.selection.kind === 'floor' && state.selection.floorId) {
      adapterRef.current?.flyToFloor(state.selection.floorId);
    } else {
      adapterRef.current?.resetCamera();
    }
  }, [state.selection, adapterRef]);

  const handleResetAll = useCallback(() => {
    state.clearSelection();
    adapterRef.current?.resetCamera();
  }, [state, adapterRef]);

  const handleSelectRoute = useCallback((routeId: string) => {
    setDisasterDataset((prev) => ({
      ...prev,
      activeRouteId: routeId,
    }));
  }, []);

  const handleAddIncidentEvent = useCallback((newEvent: IncidentEvent) => {
    setDisasterDataset((prev) => ({
      ...prev,
      events: [newEvent, ...prev.events],
    }));
  }, []);

  const selectedBuilding = resolveSelectedBuilding(state.parcel, state.selection);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-base-950">
      <TopBar
        onSelectSearchResult={handleSearchSelect}
        selection={state.selection}
        activeView={state.viewMode}
        onNavigateCommandCenter={() => {
          state.setViewMode('command');
          handleResetAll();
        }}
        onNavigateDisaster={() => state.setViewMode('disaster')}
        onOpenCreateProperty={() => setIsCreateModalOpen(true)}
        isGeneratedActive={state.isGeneratedActive}
        hasGeneratedProperty={state.savedParcels.length > 0 || !!state.generatedParcel}
        onSwitchToDemo={state.switchToSampleParcel}
        onSwitchToGenerated={state.switchToGeneratedParcel}
        activeParcel={state.parcel}
        savedParcels={state.savedParcels}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {state.viewMode === 'disaster' ? (
          /* DISASTER MODE PANELS */
          <DisasterView
            parcel={state.parcel}
            selection={state.selection}
            disasterData={disasterDataset}
            onSelectFloor={(buildingId, floorId) => state.selectFloor(buildingId, floorId)}
            onSelectRoute={handleSelectRoute}
            onExitDisasterView={() => state.setViewMode('command')}
            onAddIncidentEvent={handleAddIncidentEvent}
          />
        ) : (
          /* NORMAL CADASTRE MODE PANELS */
          <>
            {/* Left panel — Property Explorer + Vertical Floor Explorer */}
            {!sidebarCollapsed ? (
              <aside className="w-[280px] shrink-0 flex flex-col bg-base-900/70 backdrop-blur-md border-r border-white/[0.04] transition-all duration-300 z-10">
                <div className="flex-1 overflow-hidden">
                  <PropertyExplorer
                    parcel={state.parcel}
                    selection={state.selection}
                    onSelectParcel={state.selectParcel}
                    onSelectBuilding={state.selectBuilding}
                    onSelectFloor={state.selectFloor}
                    onToggleCollapse={() => setSidebarCollapsed(true)}
                  />
                </div>
                {selectedBuilding && (
                  <div className="shrink-0 border-t border-white/[0.04]">
                    <FloorExplorer
                      building={selectedBuilding}
                      selection={state.selection}
                      onSelectFloor={state.selectFloor}
                    />
                  </div>
                )}
              </aside>
            ) : (
              /* Floating Expand Button when Sidebar is Collapsed */
              <button
                onClick={() => setSidebarCollapsed(false)}
                title="Expand Property Explorer"
                className="absolute top-3 left-3 z-30 h-8 px-2.5 rounded-lg glass-panel flex items-center gap-1.5 text-xs text-slate-300 hover:text-accent-300 hover:border-accent-500/30 transition-all shadow-panel-lg"
              >
                <PanelLeftOpen className="h-4 w-4 text-accent-400" />
                <span className="text-[11px] font-medium">Explorer</span>
              </button>
            )}
          </>
        )}

        {/* Center — Cesium 3D Viewer (HERO in both modes) */}
        <main className="flex-1 relative overflow-hidden bg-base-950">
          <CesiumMount
            ready={state.cesiumReady}
            error={state.cesiumError}
            containerRef={containerRef}
            selection={state.selection}
            parcel={state.parcel}
          />
          <MapControls
            mapMode={state.mapMode}
            onToggleMapMode={state.toggleMapMode}
            onHome={handleHomeCamera}
            onFocus={handleFocusSelection}
            onReset={handleResetAll}
            isRescueActive={state.viewMode === 'disaster'}
            onToggleRescueView={() =>
              state.setViewMode(state.viewMode === 'disaster' ? 'command' : 'disaster')
            }
          />
        </main>

        {state.viewMode === 'command' && (
          <>
            {/* Right panel divider */}
            <div className="panel-divider" />

            {/* Right panel — Property Intelligence */}
            <aside className="w-[320px] shrink-0 flex flex-col bg-base-900/70 backdrop-blur-md z-10">
              <PropertyIntelligence
                parcel={state.parcel}
                selection={state.selection}
                onSelectParcel={state.selectParcel}
                onSelectBuilding={state.selectBuilding}
                onSelectFloor={state.selectFloor}
              />
            </aside>
          </>
        )}
      </div>

      {/* CREATE 3D PROPERTY MODAL */}
      <CreatePropertyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGenerateProperty={(generated) => {
          state.setGeneratedParcel(generated);
        }}
      />

      {/* AUTHENTICATION PORTAL MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
