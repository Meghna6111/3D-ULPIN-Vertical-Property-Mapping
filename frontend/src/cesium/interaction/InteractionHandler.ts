import * as Cesium from 'cesium';
import type { SelectionState, Parcel } from '@/types/property';

/**
 * Translates Cesium pick events into application SelectionState.
 * Supports clicking on 3D floor slabs, 3D floor labels, building envelope, parcel polygon,
 * and emergency rescue entities.
 */
export class InteractionHandler {
  private screenSpaceHandler: Cesium.ScreenSpaceEventHandler;
  private currentParcel: Parcel | null = null;

  constructor(
    private viewer: Cesium.Viewer,
    private onSelection: (selection: SelectionState) => void,
  ) {
    this.screenSpaceHandler = new Cesium.ScreenSpaceEventHandler(
      viewer.scene.canvas,
    );

    this.screenSpaceHandler.setInputAction(
      this.handleLeftClick.bind(this),
      Cesium.ScreenSpaceEventType.LEFT_CLICK,
    );
  }

  setParcel(parcel: Parcel | null): void {
    this.currentParcel = parcel;
  }

  private handleLeftClick(movement: { position: Cesium.Cartesian2 }): void {
    const picked = this.viewer.scene.pick(movement.position);
    if (Cesium.defined(picked) && picked.id instanceof Cesium.Entity) {
      const entity = picked.id as Cesium.Entity;
      this.resolveSelection(entity.id);
    } else {
      // Click on empty space clears selection
      this.onSelection({ kind: null, parcelId: null, buildingId: null, floorId: null });
    }
  }

  private resolveSelection(entityId: string): void {
    const parcelId = this.currentParcel?.id || 'KA-BLR-DEMO-001';
    const buildingId = this.currentParcel?.buildings[0]?.id || 'BLD-A-001';

    if (entityId === 'sample-parcel') {
      this.onSelection({
        kind: 'parcel',
        parcelId,
        buildingId: null,
        floorId: null,
      });
      return;
    }

    // Handle 3D floor label clicks
    if (entityId.startsWith('floor-label-')) {
      const floorId = entityId.replace('floor-label-', '');
      this.onSelection({
        kind: 'floor',
        parcelId,
        buildingId,
        floorId,
      });
      return;
    }

    // Handle 3D floor slab clicks
    if (entityId.startsWith('floor-')) {
      const floorId = entityId.replace('floor-', '');
      this.onSelection({
        kind: 'floor',
        parcelId,
        buildingId,
        floorId,
      });
      return;
    }

    // Handle building shell clicks
    if (entityId.startsWith('building-')) {
      const bId = entityId.replace('building-', '');
      this.onSelection({
        kind: 'building',
        parcelId,
        buildingId: bId,
        floorId: null,
      });
      return;
    }
  }

  dispose(): void {
    if (this.screenSpaceHandler && !this.screenSpaceHandler.isDestroyed()) {
      this.screenSpaceHandler.destroy();
    }
  }
}
