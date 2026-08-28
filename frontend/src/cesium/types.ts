import type { SelectionState } from '@/types/property';
import type { Parcel } from '@/types/property';

/**
 * Contract between the React application layer and the Cesium rendering layer.
 * The adapter owns all Cesium Viewer manipulation; React only calls these methods.
 */
export interface ICesiumAdapter {
  init(container: HTMLElement): Promise<void>;
  setParcel(parcel: Parcel): void;
  select(selection: SelectionState): void;
  setMapMode(mode: '3d' | '2d'): void;
  resetCamera(): void;
  flyToFloor(floorId: string): void;
  setDisasterMode(enabled: boolean, disasterData?: import('@/types/disaster').DisasterDataset): void;
  dispose(): void;
}

/** Entity IDs used inside Cesium, namespaced so they don't collide. */
export const EntityIds = {
  parcel: 'sample-parcel',
  buildingPrefix: 'building-',
  floorPrefix: 'floor-',
} as const;
