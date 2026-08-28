import { useCallback, useMemo, useState, useEffect } from 'react';
import type { MapMode, SelectionState, Parcel } from '@/types/property';
import { sampleParcel } from '@/data/sampleProperty';
import { PropertyStore } from '@/services/storage/PropertyStore';
import { CadastralRegistry } from '@/services/cadastral/CadastralRegistry';

export type ViewMode = 'command' | 'disaster';

/**
 * Central application state for the Command Center.
 * Manages active parcel (Demo Cadastre vs Generated 3D Property), selection state,
 * and Cesium synchronization.
 *
 * Phase 2: Added multi-property persistence via PropertyStore (localStorage).
 */
export function useCommandCenterState() {
  const [activeParcel, setActiveParcel] = useState<Parcel>(sampleParcel);
  const [generatedParcel, setGeneratedParcelState] = useState<Parcel | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('command');

  // Phase 2: Load saved parcels from localStorage on initialization
  const [savedParcels, setSavedParcels] = useState<Parcel[]>(() => PropertyStore.getAll());

  // Phase 6: Sync from backend database on mount
  useEffect(() => {
    PropertyStore.sync().then((parcels) => {
      setSavedParcels(parcels);
    });
  }, []);

  const [selection, setSelection] = useState<SelectionState>({
    kind: null,
    parcelId: null,
    buildingId: null,
    floorId: null,
  });

  const [mapMode, setMapMode] = useState<MapMode>('3d');
  const [searchQuery, setSearchQuery] = useState('');
  const [cesiumReady, setCesiumReady] = useState(false);
  const [cesiumError, setCesiumError] = useState<string | null>(null);

  const select = useCallback((next: SelectionState) => {
    setSelection(next);
  }, []);

  const selectFloor = useCallback(
    (buildingId: string, floorId: string) => {
      setSelection({
        kind: 'floor',
        parcelId: activeParcel.id,
        buildingId,
        floorId,
      });
    },
    [activeParcel.id],
  );

  const selectBuilding = useCallback(
    (buildingId: string) => {
      setSelection({
        kind: 'building',
        parcelId: activeParcel.id,
        buildingId,
        floorId: null,
      });
    },
    [activeParcel.id],
  );

  const selectParcel = useCallback(() => {
    setSelection({
      kind: 'parcel',
      parcelId: activeParcel.id,
      buildingId: null,
      floorId: null,
    });
  }, [activeParcel.id]);

  const clearSelection = useCallback(() => {
    setSelection({ kind: null, parcelId: null, buildingId: null, floorId: null });
  }, []);

  const toggleMapMode = useCallback(() => {
    setMapMode((m) => (m === '3d' ? '2d' : '3d'));
  }, []);

  /** Sets a newly generated 3D property and makes it active */
  const setGeneratedParcel = useCallback((newParcel: Parcel) => {
    setGeneratedParcelState(newParcel);
    setActiveParcel(newParcel);

    // Phase 2: Persist to localStorage and update savedParcels
    PropertyStore.save(newParcel);
    setSavedParcels(PropertyStore.getAll());

    // Phase 6: Async fetch to register/cache cadastral record from backend
    CadastralRegistry.fetchParcelRecordAsync(newParcel.id).catch(() => {});

    // Auto-select Ground floor of the generated building
    const bld = newParcel.buildings[0];
    if (bld && bld.floors.length > 0) {
      const targetFloor = bld.floors.find((f) => f.kind === 'ground') || bld.floors[0];
      setSelection({
        kind: 'floor',
        parcelId: newParcel.id,
        buildingId: bld.id,
        floorId: targetFloor.id,
      });
    }
  }, []);

  /** Switch back to the standard Demo Cadastre */
  const switchToSampleParcel = useCallback(() => {
    setActiveParcel(sampleParcel);
    setSelection({
      kind: 'parcel',
      parcelId: sampleParcel.id,
      buildingId: null,
      floorId: null,
    });
  }, []);

  /** Switch to the Generated 3D Property */
  const switchToGeneratedParcel = useCallback(() => {
    const target = generatedParcel || savedParcels[0];
    if (target) {
      setActiveParcel(target);
      const bld = target.buildings[0];
      const targetFloor = bld?.floors.find((f) => f.kind === 'ground') || bld?.floors[0];
      setSelection({
        kind: 'floor',
        parcelId: target.id,
        buildingId: bld?.id || null,
        floorId: targetFloor?.id || null,
      });
    }
  }, [generatedParcel, savedParcels]);

  // Phase 2: Load a saved parcel by ID and make it active
  const loadParcel = useCallback((parcelId: string) => {
    const loaded = PropertyStore.get(parcelId);
    if (loaded) {
      setGeneratedParcelState(loaded);
      setActiveParcel(loaded);

      // Phase 6: Async fetch to register/cache cadastral record from backend
      CadastralRegistry.fetchParcelRecordAsync(parcelId).catch(() => {});

      const bld = loaded.buildings[0];
      const targetFloor = bld?.floors.find((f) => f.kind === 'ground') || bld?.floors[0];
      setSelection({
        kind: 'floor',
        parcelId: loaded.id,
        buildingId: bld?.id || null,
        floorId: targetFloor?.id || null,
      });
    }
  }, []);

  // Phase 2: Delete a saved parcel by ID
  const deleteParcel = useCallback(
    (parcelId: string) => {
      PropertyStore.remove(parcelId);
      setSavedParcels(PropertyStore.getAll());
      // If the deleted parcel was active, switch back to demo
      if (activeParcel.id === parcelId) {
        setActiveParcel(sampleParcel);
        setGeneratedParcelState(null);
        setSelection({
          kind: 'parcel',
          parcelId: sampleParcel.id,
          buildingId: null,
          floorId: null,
        });
      }
    },
    [activeParcel.id],
  );

  // Phase 2: List all saved parcel summaries
  const listParcels = useCallback((): Parcel[] => {
    return savedParcels;
  }, [savedParcels]);

  const isGeneratedActive = activeParcel.id !== sampleParcel.id;

  return useMemo(
    () => ({
      parcel: activeParcel,
      activeParcel,
      generatedParcel,
      savedParcels,
      isGeneratedActive,
      selection,
      mapMode,
      viewMode,
      searchQuery,
      cesiumReady,
      cesiumError,
      select,
      selectFloor,
      selectBuilding,
      selectParcel,
      clearSelection,
      setMapMode,
      toggleMapMode,
      setViewMode,
      setSearchQuery,
      setCesiumReady,
      setCesiumError,
      setGeneratedParcel,
      switchToSampleParcel,
      switchToGeneratedParcel,
      loadParcel,
      deleteParcel,
      listParcels,
    }),
    [
      activeParcel,
      generatedParcel,
      savedParcels,
      isGeneratedActive,
      selection,
      mapMode,
      viewMode,
      searchQuery,
      cesiumReady,
      cesiumError,
      select,
      selectFloor,
      selectBuilding,
      selectParcel,
      clearSelection,
      toggleMapMode,
      setGeneratedParcel,
      switchToSampleParcel,
      switchToGeneratedParcel,
      loadParcel,
      deleteParcel,
      listParcels,
    ],
  );
}

export type CommandCenterState = ReturnType<typeof useCommandCenterState>;
