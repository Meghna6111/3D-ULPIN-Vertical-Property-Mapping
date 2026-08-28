import * as Cesium from 'cesium';
import type { EmergencyPoint } from '@/types/disaster';

export interface EmergencyPointEntities {
  pointEntities: Map<string, Cesium.Entity>;
}

const POINT_ICONS: Record<
  string,
  { symbol: string; color: string; bgColor: string }
> = {
  HOSPITAL: { symbol: '🏥', color: '#a5f3fc', bgColor: '#083344' },
  FIRE_STATION: { symbol: '🚒', color: '#fca5a5', bgColor: '#450a0a' },
  ASSEMBLY_POINT: { symbol: '📍', color: '#86efac', bgColor: '#052e16' },
  HAZARD_POINT: { symbol: '⚠️', color: '#fde047', bgColor: '#422006' },
  BLOCKED_ROAD: { symbol: '🚧', color: '#fca5a5', bgColor: '#450a0a' },
  SAFE_SHELTER: { symbol: '🛟', color: '#6ee7b7', bgColor: '#064e3b' },
};

/**
 * Creates 3D emergency infrastructure & hazard points in Cesium
 * with short, readable icon badges.
 */
export function createEmergencyPointEntities(
  viewer: Cesium.Viewer,
  points: EmergencyPoint[],
): EmergencyPointEntities {
  const pointEntities = new Map<string, Cesium.Entity>();

  for (const pt of points) {
    const meta = POINT_ICONS[pt.kind] || {
      symbol: '📍',
      color: '#38bdf8',
      bgColor: '#0f172a',
    };
    const pos = Cesium.Cartesian3.fromDegrees(pt.longitude, pt.latitude, 5);

    // Generate concise badge name
    let shortName = pt.name;
    if (pt.kind === 'HOSPITAL') shortName = 'VICTORIA HOSPITAL';
    if (pt.kind === 'FIRE_STATION') shortName = 'HIGH GROUNDS FIRE STN';
    if (pt.kind === 'ASSEMBLY_POINT') shortName = 'ASSEMBLY POINT A';
    if (pt.kind === 'HAZARD_POINT') shortName = 'DEBRIS HAZARD';
    if (pt.kind === 'BLOCKED_ROAD') shortName = 'ROAD BLOCKED';

    const entity = viewer.entities.add({
      id: `emergency-point-${pt.id}`,
      name: pt.name,
      position: pos,
      ellipsoid: {
        radii: new Cesium.Cartesian3(3.5, 3.5, 3.5),
        material: Cesium.Color.fromCssColorString(meta.color).withAlpha(0.85),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: `${meta.symbol} ${shortName} (${pt.distanceMeters}m)`,
        font: 'bold 11px Inter, system-ui, sans-serif',
        fillColor: Cesium.Color.fromCssColorString(meta.color),
        outlineColor: Cesium.Color.fromCssColorString('#020617'),
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString(meta.bgColor).withAlpha(0.92),
        backgroundPadding: new Cesium.Cartesian2(8, 4),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    pointEntities.set(pt.id, entity);
  }

  return { pointEntities };
}

export function removeEmergencyPointEntities(
  viewer: Cesium.Viewer,
  entities: EmergencyPointEntities | null,
) {
  if (!entities) return;
  for (const entity of entities.pointEntities.values()) {
    viewer.entities.remove(entity);
  }
  entities.pointEntities.clear();
}
