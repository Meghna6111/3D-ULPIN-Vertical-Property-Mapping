import * as Cesium from 'cesium';

export interface DisasterZoneEntities {
  criticalCircle: Cesium.Entity;
  highRiskCircle: Cesium.Entity;
  moderateRiskCircle: Cesium.Entity;
  safePerimeter: Cesium.Entity;
  labels: Cesium.Entity[];
}

/**
 * Creates concentric 3D multi-level emergency risk and impact zones in Cesium
 * with clean, concise, non-overlapping perimeter badges.
 */
export function createDisasterZoneEntities(
  viewer: Cesium.Viewer,
  lon: number,
  lat: number,
): DisasterZoneEntities {
  const center = Cesium.Cartesian3.fromDegrees(lon, lat, 0.2);

  // 1. Critical Impact Zone (35m radius)
  const criticalCircle = viewer.entities.add({
    id: 'disaster-zone-critical',
    name: 'Critical Impact Zone (35m)',
    position: center,
    ellipse: {
      semiMinorAxis: 35,
      semiMajorAxis: 35,
      height: 0.3,
      material: Cesium.Color.fromCssColorString('#dc2626').withAlpha(0.24),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.9),
      outlineWidth: 3,
    },
  });

  // 2. High Risk Warning Ring (70m radius)
  const highRiskCircle = viewer.entities.add({
    id: 'disaster-zone-high-risk',
    name: 'High Risk Hazard Zone (70m)',
    position: center,
    ellipse: {
      semiMinorAxis: 70,
      semiMajorAxis: 70,
      height: 0.2,
      material: Cesium.Color.fromCssColorString('#ea580c').withAlpha(0.14),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString('#f97316').withAlpha(0.85),
      outlineWidth: 2,
    },
  });

  // 3. Moderate Risk Buffer Ring (120m radius)
  const moderateRiskCircle = viewer.entities.add({
    id: 'disaster-zone-moderate',
    name: 'Moderate Risk Buffer (120m)',
    position: center,
    ellipse: {
      semiMinorAxis: 120,
      semiMajorAxis: 120,
      height: 0.15,
      material: Cesium.Color.fromCssColorString('#d97706').withAlpha(0.07),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString('#fbbf24').withAlpha(0.75),
      outlineWidth: 2,
    },
  });

  // 4. Safe Perimeter Boundary (200m radius)
  const safePerimeter = viewer.entities.add({
    id: 'disaster-zone-safe-perimeter',
    name: 'Safe Evacuation Perimeter (200m)',
    position: center,
    ellipse: {
      semiMinorAxis: 200,
      semiMajorAxis: 200,
      height: 0.1,
      material: Cesium.Color.fromCssColorString('#16a34a').withAlpha(0.04),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString('#22c55e').withAlpha(0.7),
      outlineWidth: 2,
    },
  });

  const labels: Cesium.Entity[] = [];
  const mToDegLon = 1 / (111320 * Math.cos((lat * Math.PI) / 180));
  const mToDegLat = 1 / 110574;

  const zoneBadges = [
    {
      text: '⚠️ CRITICAL (35m)',
      offsetLon: -22,
      offsetLat: 28,
      color: '#fca5a5',
      bgColor: '#450a0a',
      borderColor: '#ef4444',
    },
    {
      text: '⚡ HIGH RISK (70m)',
      offsetLon: 0,
      offsetLat: -68,
      color: '#fdba74',
      bgColor: '#431407',
      borderColor: '#f97316',
    },
    {
      text: '🛡️ SAFE ZONE (200m)',
      offsetLon: -130,
      offsetLat: -60,
      color: '#86efac',
      bgColor: '#052e16',
      borderColor: '#22c55e',
    },
  ];

  for (const item of zoneBadges) {
    const labelEntity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        lon + item.offsetLon * mToDegLon,
        lat + item.offsetLat * mToDegLat,
        8,
      ),
      label: {
        text: item.text,
        font: 'bold 11px Inter, system-ui, sans-serif',
        fillColor: Cesium.Color.fromCssColorString(item.color),
        outlineColor: Cesium.Color.fromCssColorString('#020617'),
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString(item.bgColor).withAlpha(0.92),
        backgroundPadding: new Cesium.Cartesian2(8, 4),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    labels.push(labelEntity);
  }

  return {
    criticalCircle,
    highRiskCircle,
    moderateRiskCircle,
    safePerimeter,
    labels,
  };
}

export function removeDisasterZoneEntities(
  viewer: Cesium.Viewer,
  zones: DisasterZoneEntities | null,
) {
  if (!zones) return;
  viewer.entities.remove(zones.criticalCircle);
  viewer.entities.remove(zones.highRiskCircle);
  viewer.entities.remove(zones.moderateRiskCircle);
  viewer.entities.remove(zones.safePerimeter);
  for (const l of zones.labels) {
    viewer.entities.remove(l);
  }
}
