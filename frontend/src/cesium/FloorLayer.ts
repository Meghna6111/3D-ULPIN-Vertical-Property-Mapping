import * as Cesium from 'cesium';
import type { Building, Floor } from '@/types/property';
import { BUILDING_CONSTANTS } from './BuildingLayer';

const { BUILDING_WIDTH_M, BUILDING_DEPTH_M, FLOOR_HEIGHT_M, FLOOR_SLAB_HEIGHT_M } =
  BUILDING_CONSTANTS;

/* ── Status-driven color palette ── */
const COLORS = {
  default:       '#0284c7',   // cyan/sky blue glass
  defaultEdge:   '#38bdf8',   // bright cyan edge
  selected:      '#22d3ee',   // electric cyan
  violation:     '#dc2626',   // deep warning red
  violationEdge: '#ef4444',   // bright red edge
  warning:       '#d97706',   // amber
  warningEdge:   '#fbbf24',   // bright amber edge
  basement:      '#0f2b38',   // subterranean dark teal
  basementEdge:  '#06b6d4',   // cyan edge
} as const;

interface FloorEntityRecord {
  entity: Cesium.Entity;
  floor: Floor;
  labelEntity?: Cesium.Entity;
}

/**
 * Creates one Cesium box entity per floor, stacked vertically with a 1m visible gap
 * between floor slabs to produce the distinct "floor strata" digital twin effect.
 * Dynamically uses building.widthM and building.depthM in METERS.
 */
export function createFloorEntities(
  viewer: Cesium.Viewer,
  building: Building,
  parcelLon: number,
  parcelLat: number,
): Map<string, FloorEntityRecord> {
  const records = new Map<string, FloorEntityRecord>();

  const widthM = building.widthM || BUILDING_WIDTH_M;
  const depthM = building.depthM || BUILDING_DEPTH_M;

  // Offset label ~5 meters to the East of building edge
  const labelLonOffset = metersToDegreesLon(widthM / 2 + 5, parcelLat);

  for (const floor of building.floors) {
    const baseHeight = floor.levelIndex * FLOOR_HEIGHT_M;
    const centerZ = baseHeight + FLOOR_HEIGHT_M / 2;

    const isBasement = floor.kind === 'basement';
    const { fill, edge } = floorColors(floor);

    // 3D Floor Slab Box
    const entity = viewer.entities.add({
      id: `floor-${floor.id}`,
      name: `${building.label} — ${floor.label}`,
      position: Cesium.Cartesian3.fromDegrees(parcelLon, parcelLat, centerZ),
      box: {
        // Dimensions in METERS: (widthX, depthY, slabHeightZ)
        dimensions: new Cesium.Cartesian3(
          widthM,
          depthM,
          FLOOR_SLAB_HEIGHT_M,
        ),
        material: Cesium.Color.fromCssColorString(fill).withAlpha(
          isBasement ? 0.65 : 0.45,
        ),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString(edge).withAlpha(0.9),
      },
    });

    // Spatially anchored 3D Label entity beside the floor
    const labelEntity = viewer.entities.add({
      id: `floor-label-${floor.id}`,
      position: Cesium.Cartesian3.fromDegrees(
        parcelLon + labelLonOffset,
        parcelLat,
        centerZ,
      ),
      label: {
        text: floorBadgeText(floor),
        font: 'bold 12px Inter, system-ui, sans-serif',
        fillColor: Cesium.Color.fromCssColorString(
          floor.status === 'violation' ? '#fca5a5' : '#e2e8f0',
        ),
        outlineColor: Cesium.Color.fromCssColorString('#020617'),
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('#0f172a').withAlpha(0.85),
        backgroundPadding: new Cesium.Cartesian2(7, 3),
        pixelOffset: new Cesium.Cartesian2(4, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    records.set(floor.id, { entity, floor, labelEntity });
  }

  return records;
}

export function setFloorHighlight(
  record: FloorEntityRecord | undefined,
  selected: boolean,
) {
  if (!record) return;
  const { entity, floor, labelEntity } = record;
  if (!entity.box) return;

  const { fill, edge } = floorColors(floor);
  const isViolation = floor.status === 'violation';
  const isBasement = floor.kind === 'basement';

  const targetFill = selected
    ? (isViolation ? '#ef4444' : COLORS.selected)
    : fill;
  const targetEdge = selected
    ? (isViolation ? '#ff0000' : COLORS.selected)
    : edge;

  const alpha = selected ? (isBasement ? 0.85 : 0.75) : (isBasement ? 0.65 : 0.45);

  (entity.box.material as Cesium.ColorMaterialProperty).color =
    new Cesium.ConstantProperty(
      Cesium.Color.fromCssColorString(targetFill).withAlpha(alpha),
    );
  (entity.box.outlineColor as Cesium.ConstantProperty) =
    new Cesium.ConstantProperty(
      Cesium.Color.fromCssColorString(targetEdge).withAlpha(selected ? 1.0 : 0.9),
    );

  // Highlight the label badge
  if (labelEntity?.label) {
    (labelEntity.label.fillColor as Cesium.ConstantProperty) =
      new Cesium.ConstantProperty(
        selected
          ? (isViolation
              ? Cesium.Color.fromCssColorString('#ffffff')
              : Cesium.Color.fromCssColorString('#22d3ee'))
          : (isViolation
              ? Cesium.Color.fromCssColorString('#fca5a5')
              : Cesium.Color.fromCssColorString('#e2e8f0')),
      );
    (labelEntity.label.backgroundColor as Cesium.ConstantProperty) =
      new Cesium.ConstantProperty(
        selected
          ? (isViolation
              ? Cesium.Color.fromCssColorString('#7f1d1d').withAlpha(0.95)
              : Cesium.Color.fromCssColorString('#083344').withAlpha(0.95))
          : Cesium.Color.fromCssColorString('#0f172a').withAlpha(0.85),
      );
  }
}

export function floorCenterHeight(floor: Floor): number {
  return floor.levelIndex * FLOOR_HEIGHT_M + FLOOR_HEIGHT_M / 2;
}

/* ── Internal helpers ── */

function floorColors(floor: Floor): { fill: string; edge: string } {
  if (floor.kind === 'basement') {
    return { fill: COLORS.basement, edge: COLORS.basementEdge };
  }
  switch (floor.status) {
    case 'violation':
      return { fill: COLORS.violation, edge: COLORS.violationEdge };
    case 'warning':
      return { fill: COLORS.warning, edge: COLORS.warningEdge };
    case 'verified':
    default:
      return { fill: COLORS.default, edge: COLORS.defaultEdge };
  }
}

function floorBadgeText(floor: Floor): string {
  if (floor.kind === 'basement') return `B0${Math.abs(floor.levelIndex)}`;
  if (floor.kind === 'ground') return 'Ground';
  return `F0${floor.levelIndex}`;
}

function metersToDegreesLon(meters: number, latDeg: number): number {
  const latRad = Cesium.Math.toRadians(latDeg);
  return meters / (111320 * Math.cos(latRad));
}
