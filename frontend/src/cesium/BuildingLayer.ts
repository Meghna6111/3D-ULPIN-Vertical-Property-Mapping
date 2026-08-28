import * as Cesium from 'cesium';
import type { Building } from '@/types/property';

// Default metric dimensions in METERS (used when building doesn't specify custom dimensions)
const DEFAULT_BUILDING_WIDTH_M = 24;
const DEFAULT_BUILDING_DEPTH_M = 24;
const FLOOR_HEIGHT_M = 4.0;      // 4.0 meters per floor slot
const FLOOR_SLAB_HEIGHT_M = 3.0; // 3.0m slab height (leaves 1.0m visible strata gap!)

/**
 * Creates a translucent glass architectural envelope around all above-ground floors.
 * Dimensions dynamically adapt to building.widthM and building.depthM in METERS.
 */
export function createBuildingEntity(
  viewer: Cesium.Viewer,
  building: Building,
  parcelLon: number,
  parcelLat: number,
): Cesium.Entity {
  const aboveFloors = building.floors.filter((f) => f.kind !== 'basement');
  const topIndex = Math.max(...aboveFloors.map((f) => f.levelIndex), 0);
  const totalAboveHeight = (topIndex + 1) * FLOOR_HEIGHT_M;

  const widthM = building.widthM || DEFAULT_BUILDING_WIDTH_M;
  const depthM = building.depthM || DEFAULT_BUILDING_DEPTH_M;

  return viewer.entities.add({
    id: `building-${building.id}`,
    name: building.label,
    // Center of the above-ground envelope
    position: Cesium.Cartesian3.fromDegrees(
      parcelLon,
      parcelLat,
      totalAboveHeight / 2,
    ),
    box: {
      // Cesium Cartesian3 for box dimensions is (lengthX, widthY, heightZ) in METERS!
      dimensions: new Cesium.Cartesian3(
        widthM + 1.2,
        depthM + 1.2,
        totalAboveHeight,
      ),
      material: Cesium.Color.fromCssColorString('#0284c7').withAlpha(0.06),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.3),
    },
  });
}

export function setBuildingHighlight(
  entity: Cesium.Entity | undefined,
  selected: boolean,
) {
  if (!entity || !entity.box) return;
  const baseFill = Cesium.Color.fromCssColorString('#0284c7').withAlpha(0.06);
  const highlightFill = Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.12);
  const baseEdge = Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.3);
  const highlightEdge = Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.65);

  (entity.box.material as Cesium.ColorMaterialProperty).color = selected
    ? new Cesium.ConstantProperty(highlightFill)
    : new Cesium.ConstantProperty(baseFill);
  (entity.box.outlineColor as Cesium.ConstantProperty) = new Cesium.ConstantProperty(
    selected ? highlightEdge : baseEdge,
  );
}

export const BUILDING_CONSTANTS = {
  BUILDING_WIDTH_M: DEFAULT_BUILDING_WIDTH_M,
  BUILDING_DEPTH_M: DEFAULT_BUILDING_DEPTH_M,
  FLOOR_HEIGHT_M,
  FLOOR_SLAB_HEIGHT_M,
};
