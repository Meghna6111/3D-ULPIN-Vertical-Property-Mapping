import * as Cesium from 'cesium';
import type { EvacuationRoute } from '@/types/disaster';

export interface EvacuationRouteEntities {
  corridorPolyline: Cesium.Entity;
  startMarker: Cesium.Entity;
  destinationMarker: Cesium.Entity;
}

/**
 * Creates a glowing 3D evacuation corridor along the selected route with
 * concise start and destination markers.
 */
export function createEvacuationRouteEntity(
  viewer: Cesium.Viewer,
  route: EvacuationRoute,
): EvacuationRouteEntities {
  const flatPositions: number[] = [];
  for (const [lon, lat] of route.coordinates) {
    flatPositions.push(lon, lat);
  }

  const positions = Cesium.Cartesian3.fromDegreesArray(flatPositions);
  const isPrimary = route.status === 'PRIMARY_CLEAR';

  // 1. Glowing 3D Polyline Corridor
  const corridorPolyline = viewer.entities.add({
    id: `evacuation-corridor-${route.id}`,
    name: route.name,
    polyline: {
      positions,
      width: 7,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.4,
        color: Cesium.Color.fromCssColorString(isPrimary ? '#22c55e' : '#f59e0b'),
      }),
      clampToGround: true,
    },
  });

  // 2. Start Egress Marker
  const firstCoord = route.coordinates[0];
  const startPos = Cesium.Cartesian3.fromDegrees(firstCoord[0], firstCoord[1], 4);

  const startMarker = viewer.entities.add({
    id: `evacuation-start-${route.id}`,
    name: 'Evacuation Egress Point',
    position: startPos,
    label: {
      text: '🚶 EVACUATION START',
      font: 'bold 11px Inter, system-ui, sans-serif',
      fillColor: Cesium.Color.fromCssColorString('#86efac'),
      outlineColor: Cesium.Color.fromCssColorString('#020617'),
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString('#052e16').withAlpha(0.92),
      backgroundPadding: new Cesium.Cartesian2(8, 4),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(0, -14),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  // 3. Safe Assembly Destination Marker
  const lastCoord = route.coordinates[route.coordinates.length - 1];
  const destPos = Cesium.Cartesian3.fromDegrees(lastCoord[0], lastCoord[1], 8);

  const destinationMarker = viewer.entities.add({
    id: `evacuation-dest-${route.id}`,
    name: route.destinationName,
    position: destPos,
    cylinder: {
      length: 16,
      topRadius: 5,
      bottomRadius: 0.5,
      material: Cesium.Color.fromCssColorString('#22c55e').withAlpha(0.75),
      outline: true,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
    },
    label: {
      text: `🏁 ${route.destinationName.toUpperCase()} (~${route.estimatedTimeMinutes} MIN WALK)`,
      font: 'bold 11px Inter, system-ui, sans-serif',
      fillColor: Cesium.Color.fromCssColorString('#86efac'),
      outlineColor: Cesium.Color.fromCssColorString('#020617'),
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString('#052e16').withAlpha(0.94),
      backgroundPadding: new Cesium.Cartesian2(9, 4),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(0, -20),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  return {
    corridorPolyline,
    startMarker,
    destinationMarker,
  };
}

export function removeEvacuationRouteEntities(
  viewer: Cesium.Viewer,
  entities: EvacuationRouteEntities | null,
) {
  if (!entities) return;
  viewer.entities.remove(entities.corridorPolyline);
  viewer.entities.remove(entities.startMarker);
  viewer.entities.remove(entities.destinationMarker);
}
