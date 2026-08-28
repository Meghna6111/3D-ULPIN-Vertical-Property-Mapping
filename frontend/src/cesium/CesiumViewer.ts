import * as Cesium from 'cesium';
import type { ICesiumAdapter } from './types';
import type { Parcel, SelectionState } from '@/types/property';
import type { DisasterDataset } from '@/types/disaster';
import { createParcelEntity, setParcelHighlight } from './ParcelLayer';
import {
  createBuildingEntity,
  setBuildingHighlight,
  BUILDING_CONSTANTS,
} from './BuildingLayer';
import { createFloorEntities, setFloorHighlight, floorCenterHeight } from './FloorLayer';
import { CameraController } from './CameraController';
import { InteractionHandler } from './interaction/InteractionHandler';
import {
  createDisasterZoneEntities,
  removeDisasterZoneEntities,
  type DisasterZoneEntities,
} from './disaster/DisasterZoneLayer';
import {
  createRescueTeamEntities,
  removeRescueTeamEntities,
  type RescueTeamEntities,
} from './disaster/RescueTeamsLayer';
import {
  createEmergencyPointEntities,
  removeEmergencyPointEntities,
  type EmergencyPointEntities,
} from './disaster/EmergencyPointsLayer';
import {
  createEvacuationRouteEntity,
  removeEvacuationRouteEntities,
  type EvacuationRouteEntities,
} from './disaster/EvacuationRouteLayer';

/**
 * CesiumSceneAdapter is the single bridge between React and CesiumJS.
 * Handles dynamic property replacement, floor strata rendering, disaster zones, and camera focus.
 */
export class CesiumSceneAdapter implements ICesiumAdapter {
  private viewer: Cesium.Viewer | null = null;
  private camera: CameraController | null = null;
  private interaction: InteractionHandler | null = null;

  private parcel: Parcel | null = null;
  private parcelEntity: Cesium.Entity | undefined;
  private buildingEntities = new Map<string, Cesium.Entity>();
  private floorRecords = new Map<
    string,
    { entity: Cesium.Entity; floor: import('@/types/property').Floor; labelEntity?: Cesium.Entity }
  >();

  // Disaster 3D Entity state
  private isDisasterActive = false;
  private disasterData: DisasterDataset | null = null;
  private disasterZones: DisasterZoneEntities | null = null;
  private rescueTeamsEntities: RescueTeamEntities | null = null;
  private emergencyPointsEntities: EmergencyPointEntities | null = null;
  private evacuationRouteEntities: EvacuationRouteEntities | null = null;

  private currentSelection: SelectionState = {
    kind: null,
    parcelId: null,
    buildingId: null,
    floorId: null,
  };

  constructor(private onSelection: (selection: SelectionState) => void) {}

  async init(container: HTMLElement): Promise<void> {
    (Cesium as unknown as { Ion: { defaultAccessToken: string } }).Ion.defaultAccessToken =
      (import.meta.env.VITE_CESIUM_TOKEN as string) || '';

    this.viewer = new Cesium.Viewer(container, {
      baseLayer: Cesium.ImageryLayer.fromProviderAsync(
        Cesium.TileMapServiceImageryProvider.fromUrl(
          `${CESIUM_BASE_URL}/Assets/Textures/NaturalEarthII`,
        ),
      ),
      terrainProvider: undefined,
      animation: false,
      timeline: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      fullscreenButton: false,
      navigationHelpButton: false,
      infoBox: false,
      selectionIndicator: false,
      shadows: false,
      shouldAnimate: true,
    });

    const scene = this.viewer.scene;
    scene.globe.baseColor = Cesium.Color.fromCssColorString('#060a10');
    scene.backgroundColor = Cesium.Color.fromCssColorString('#060a10');

    if (scene.skyBox) scene.skyBox.show = false;
    if (scene.sun) scene.sun.show = false;
    if (scene.moon) scene.moon.show = false;
    if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
    scene.fog.enabled = false;

    scene.postProcessStages.fxaa.enabled = true;
    scene.globe.showGroundAtmosphere = false;
    scene.globe.enableLighting = false;
    scene.globe.depthTestAgainstTerrain = false;

    // ── ScreenSpaceCameraController configuration for smooth 360° 3D inspection ──
    const controller = scene.screenSpaceCameraController;
    controller.enableRotate = true;
    controller.enableTranslate = true;
    controller.enableZoom = true;
    controller.enableTilt = true;
    controller.enableLook = true;
    controller.enableCollisionDetection = false; // Disables terrain collision lock so user can orbit basements & all angles
    controller.minimumZoomDistance = 2.0;
    controller.maximumZoomDistance = 25000.0;
    controller.inertiaSpin = 0.08;
    controller.inertiaTranslate = 0.08;
    controller.inertiaZoom = 0.08;

    // Natural 3D Orbit, Tilt, Pan and Zoom bindings:
    // • Left Drag: Rotate/Orbit around the scene
    // • Right Drag / Middle Drag: 360° Tilt & Orbit around the building
    // • Shift + Left Drag / Ctrl + Left Drag: Tilt & Orbit
    // • Shift + Right Drag / Alt + Left Drag: Pan/Translate
    // • Wheel / Pinch: Zoom in & out smoothly
    controller.rotateEventTypes = [
      Cesium.CameraEventType.LEFT_DRAG,
    ];
    controller.tiltEventTypes = [
      Cesium.CameraEventType.MIDDLE_DRAG,
      Cesium.CameraEventType.RIGHT_DRAG,
      { eventType: Cesium.CameraEventType.LEFT_DRAG, modifier: Cesium.KeyboardEventModifier.CTRL },
      { eventType: Cesium.CameraEventType.LEFT_DRAG, modifier: Cesium.KeyboardEventModifier.SHIFT },
    ];
    controller.translateEventTypes = [
      { eventType: Cesium.CameraEventType.RIGHT_DRAG, modifier: Cesium.KeyboardEventModifier.SHIFT },
      { eventType: Cesium.CameraEventType.LEFT_DRAG, modifier: Cesium.KeyboardEventModifier.ALT },
    ];
    controller.zoomEventTypes = [
      Cesium.CameraEventType.WHEEL,
      Cesium.CameraEventType.PINCH,
    ];

    this.camera = new CameraController(this.viewer);
    this.interaction = new InteractionHandler(this.viewer, this.onSelection);

    this.viewer.resize();
    window.addEventListener('resize', () => {
      this.viewer?.resize();
    });
  }

  setParcel(parcel: Parcel): void {
    if (!this.viewer) return;
    this.parcel = parcel;
    this.interaction?.setParcel(parcel);

    // Clean up previous entities
    if (this.parcelEntity) {
      this.viewer.entities.remove(this.parcelEntity);
      this.parcelEntity = undefined;
    }
    for (const entity of this.buildingEntities.values()) {
      this.viewer.entities.remove(entity);
    }
    this.buildingEntities.clear();

    for (const record of this.floorRecords.values()) {
      this.viewer.entities.remove(record.entity);
      if (record.labelEntity) {
        this.viewer.entities.remove(record.labelEntity);
      }
    }
    this.floorRecords.clear();

    // Create new entities
    this.parcelEntity = createParcelEntity(this.viewer, parcel);

    for (const building of parcel.buildings) {
      const bEntity = createBuildingEntity(
        this.viewer,
        building,
        parcel.longitude,
        parcel.latitude,
      );
      this.buildingEntities.set(building.id, bEntity);

      const floorMap = createFloorEntities(
        this.viewer,
        building,
        parcel.longitude,
        parcel.latitude,
      );
      for (const [floorId, record] of floorMap) {
        this.floorRecords.set(floorId, record);
      }
    }

    // Re-apply disaster overlays if active
    if (this.isDisasterActive && this.disasterData) {
      this.setDisasterMode(true, this.disasterData);
    }

    // Frame the scene
    const firstBuilding = parcel.buildings[0];
    const aboveFloors = firstBuilding
      ? firstBuilding.floors.filter((f) => f.kind !== 'basement')
      : [];
    const topIndex = Math.max(...aboveFloors.map((f) => f.levelIndex), 0);
    const maxHeight = (topIndex + 1) * BUILDING_CONSTANTS.FLOOR_HEIGHT_M;
    this.camera?.frameParcel(parcel.longitude, parcel.latitude, maxHeight);
  }

  setDisasterMode(enabled: boolean, disasterData?: DisasterDataset): void {
    if (!this.viewer || !this.parcel) return;
    this.isDisasterActive = enabled;
    this.disasterData = disasterData || null;

    // Clean up previous disaster layers
    if (this.disasterZones) {
      removeDisasterZoneEntities(this.viewer, this.disasterZones);
      this.disasterZones = null;
    }
    if (this.rescueTeamsEntities) {
      removeRescueTeamEntities(this.viewer, this.rescueTeamsEntities);
      this.rescueTeamsEntities = null;
    }
    if (this.emergencyPointsEntities) {
      removeEmergencyPointEntities(this.viewer, this.emergencyPointsEntities);
      this.emergencyPointsEntities = null;
    }
    if (this.evacuationRouteEntities) {
      removeEvacuationRouteEntities(this.viewer, this.evacuationRouteEntities);
      this.evacuationRouteEntities = null;
    }

    if (enabled && disasterData) {
      // 1. Add Concentric Disaster Risk Zones
      this.disasterZones = createDisasterZoneEntities(
        this.viewer,
        this.parcel.longitude,
        this.parcel.latitude,
      );

      // 2. Add Rescue Teams
      this.rescueTeamsEntities = createRescueTeamEntities(
        this.viewer,
        disasterData.teams,
      );

      // 3. Add Emergency Points
      this.emergencyPointsEntities = createEmergencyPointEntities(
        this.viewer,
        disasterData.emergencyPoints,
      );

      // 4. Add Evacuation Corridor
      const activeRoute =
        disasterData.routes.find((r) => r.id === disasterData.activeRouteId) ||
        disasterData.routes[0];
      if (activeRoute) {
        this.evacuationRouteEntities = createEvacuationRouteEntity(
          this.viewer,
          activeRoute,
        );
      }

      // 5. Apply Emergency Floor Coloring and Badges
      this.applyEmergencyFloorColors(disasterData);
    } else {
      // Restore standard floor colors and standard labels
      for (const record of this.floorRecords.values()) {
        setFloorHighlight(record, record.floor.id === this.currentSelection.floorId);
        if (record.labelEntity?.label) {
          const standardLabel =
            record.floor.kind === 'basement'
              ? `B0${Math.abs(record.floor.levelIndex)}`
              : record.floor.kind === 'ground'
              ? 'Ground'
              : `F0${record.floor.levelIndex}`;

          (record.labelEntity.label.text as Cesium.ConstantProperty) =
            new Cesium.ConstantProperty(standardLabel);
          (record.labelEntity.label.fillColor as Cesium.ConstantProperty) =
            new Cesium.ConstantProperty(
              record.floor.status === 'violation'
                ? Cesium.Color.fromCssColorString('#fca5a5')
                : Cesium.Color.fromCssColorString('#e2e8f0'),
            );
          (record.labelEntity.label.backgroundColor as Cesium.ConstantProperty) =
            new Cesium.ConstantProperty(
              Cesium.Color.fromCssColorString('#0f172a').withAlpha(0.85),
            );
        }
      }
    }
  }

  private applyEmergencyFloorColors(disasterData: DisasterDataset) {
    for (const [floorId, record] of this.floorRecords) {
      const emergencyFloor = disasterData.floors.get(floorId);
      if (!emergencyFloor) continue;

      let fill = '#0284c7';
      let edge = '#38bdf8';
      let labelFill = '#e2e8f0';
      let labelBg = '#0f172a';
      let statusTag: string = emergencyFloor.emergencyStatus;

      const priority =
        disasterData.priorityQueue?.find((r) => r.floorId === floorId)?.priority ||
        emergencyFloor.priority;

      switch (emergencyFloor.emergencyStatus) {
        case 'CRITICAL':
          fill = '#dc2626'; // Red
          edge = '#ef4444';
          labelFill = '#fca5a5';
          labelBg = '#450a0a';
          statusTag = `CRITICAL • ${priority}`;
          break;
        case 'AT_RISK':
          fill = '#ea580c'; // Orange
          edge = '#f97316';
          labelFill = '#fed7aa';
          labelBg = '#431407';
          statusTag = `AT RISK • ${priority}`;
          break;
        case 'AFFECTED':
          fill = '#d97706'; // Amber
          edge = '#fbbf24';
          labelFill = '#fde68a';
          labelBg = '#422006';
          statusTag = `AFFECTED • ${priority}`;
          break;
        case 'SAFE':
        default:
          fill = '#0284c7'; // Sky/Cyan
          edge = '#38bdf8';
          labelFill = '#a5f3fc';
          labelBg = '#083344';
          statusTag = `CLEARED • ${priority}`;
          break;
      }

      if (record.floor.kind === 'basement') {
        fill = '#0f2b38';
        edge = '#06b6d4';
        statusTag = `VAULT • ${priority}`;
      }

      const isSelected = floorId === this.currentSelection.floorId;
      if (isSelected) {
        edge = '#ffffff';
        labelBg = '#1e293b';
      }

      if (record.entity.box) {
        (record.entity.box.material as Cesium.ColorMaterialProperty).color =
          new Cesium.ConstantProperty(
            Cesium.Color.fromCssColorString(fill).withAlpha(isSelected ? 0.85 : 0.55),
          );
        (record.entity.box.outlineColor as Cesium.ConstantProperty) =
          new Cesium.ConstantProperty(
            Cesium.Color.fromCssColorString(edge).withAlpha(isSelected ? 1.0 : 0.8),
          );
      }

      // Update 3D Floor Label Badge
      if (record.labelEntity?.label) {
        const floorPrefix =
          record.floor.kind === 'basement'
            ? `B0${Math.abs(record.floor.levelIndex)}`
            : record.floor.kind === 'ground'
            ? 'Ground'
            : `F0${record.floor.levelIndex}`;

        (record.labelEntity.label.text as Cesium.ConstantProperty) =
          new Cesium.ConstantProperty(`${floorPrefix} • ${statusTag}`);
        (record.labelEntity.label.fillColor as Cesium.ConstantProperty) =
          new Cesium.ConstantProperty(Cesium.Color.fromCssColorString(labelFill));
        (record.labelEntity.label.backgroundColor as Cesium.ConstantProperty) =
          new Cesium.ConstantProperty(
            Cesium.Color.fromCssColorString(labelBg).withAlpha(0.95),
          );
      }
    }
  }

  select(selection: SelectionState): void {
    if (!this.viewer) return;
    this.currentSelection = selection;

    // Reset standard highlights
    setParcelHighlight(this.parcelEntity, false);
    for (const entity of this.buildingEntities.values()) {
      setBuildingHighlight(entity, false);
    }

    if (this.isDisasterActive && this.disasterData) {
      this.applyEmergencyFloorColors(this.disasterData);
    } else {
      for (const record of this.floorRecords.values()) {
        setFloorHighlight(record, false);
      }
    }

    if (!selection.kind) return;

    if (selection.kind === 'parcel') {
      setParcelHighlight(this.parcelEntity, true);
    } else if (selection.kind === 'building' && selection.buildingId) {
      const bEntity = this.buildingEntities.get(selection.buildingId);
      setBuildingHighlight(bEntity, true);
    } else if (selection.kind === 'floor' && selection.floorId) {
      const record = this.floorRecords.get(selection.floorId);
      if (this.isDisasterActive && this.disasterData) {
        this.applyEmergencyFloorColors(this.disasterData);
      } else {
        setFloorHighlight(record, true);
      }
    }
  }

  setMapMode(mode: '3d' | '2d'): void {
    if (!this.camera || !this.parcel) return;
    this.camera.setMapMode(mode, this.parcel.longitude, this.parcel.latitude);
  }

  resetCamera(): void {
    if (!this.camera || !this.parcel) return;
    const firstBuilding = this.parcel.buildings[0];
    const aboveFloors = firstBuilding
      ? firstBuilding.floors.filter((f) => f.kind !== 'basement')
      : [];
    const topIndex = Math.max(...aboveFloors.map((f) => f.levelIndex), 0);
    const maxHeight = (topIndex + 1) * BUILDING_CONSTANTS.FLOOR_HEIGHT_M;
    this.camera.frameParcel(this.parcel.longitude, this.parcel.latitude, maxHeight);
  }

  flyToFloor(floorId: string): void {
    if (!this.camera || !this.parcel) return;
    const record = this.floorRecords.get(floorId);
    if (!record) return;

    const centerZ = floorCenterHeight(record.floor);
    this.camera.flyToFloor(this.parcel.longitude, this.parcel.latitude, centerZ);
  }

  dispose(): void {
    if (this.disasterZones && this.viewer) {
      removeDisasterZoneEntities(this.viewer, this.disasterZones);
    }
    if (this.rescueTeamsEntities && this.viewer) {
      removeRescueTeamEntities(this.viewer, this.rescueTeamsEntities);
    }
    if (this.emergencyPointsEntities && this.viewer) {
      removeEmergencyPointEntities(this.viewer, this.emergencyPointsEntities);
    }
    if (this.evacuationRouteEntities && this.viewer) {
      removeEvacuationRouteEntities(this.viewer, this.evacuationRouteEntities);
    }

    this.interaction?.dispose();
    this.interaction = null;
    this.camera = null;
    this.viewer?.destroy();
    this.viewer = null;
  }
}
