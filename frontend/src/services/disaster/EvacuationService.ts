import type { EvacuationRoute } from '@/types/disaster';

/**
 * Calculates deterministic evacuation corridors anchored to parcel center coordinates.
 */
export function generateEvacuationRoutes(
  centerLon: number,
  centerLat: number,
): EvacuationRoute[] {
  // Convert offset in meters to degrees
  const mToDegLon = 1 / (111320 * Math.cos((centerLat * Math.PI) / 180));
  const mToDegLat = 1 / 110574;

  // Primary Route: Exits Building North-West towards Freedom Park Safe Zone (Assembly Point A)
  const primaryCoords: [number, number][] = [
    [centerLon, centerLat],
    [centerLon - 30 * mToDegLon, centerLat + 25 * mToDegLat],
    [centerLon - 80 * mToDegLon, centerLat + 60 * mToDegLat],
    [centerLon - 140 * mToDegLon, centerLat + 120 * mToDegLat],
    [centerLon - 210 * mToDegLon, centerLat + 180 * mToDegLat],
  ];

  // Secondary/Alternative Route: Exits Building South-East towards City Triage Staging Area
  const altCoords: [number, number][] = [
    [centerLon, centerLat],
    [centerLon + 25 * mToDegLon, centerLat - 20 * mToDegLat],
    [centerLon + 70 * mToDegLon, centerLat - 50 * mToDegLat],
    [centerLon + 130 * mToDegLon, centerLat - 110 * mToDegLat],
    [centerLon + 190 * mToDegLon, centerLat - 160 * mToDegLat],
  ];

  return [
    {
      id: 'route-primary-nw',
      name: 'Primary Evacuation Corridor (North-West Gate)',
      status: 'PRIMARY_CLEAR',
      destinationName: 'Central Ground Assembly Point A',
      estimatedTimeMinutes: 4,
      distanceMeters: 280,
      coordinates: primaryCoords,
      hazardWarnings: ['Avoid North-East stairwell', 'Low-hanging debris near Gate 1'],
    },
    {
      id: 'route-alt-se',
      name: 'Alternative Egress Route (South-East Gate)',
      status: 'ALTERNATIVE_ACTIVE',
      destinationName: 'South Triage & Medical Staging Shelter',
      estimatedTimeMinutes: 6,
      distanceMeters: 360,
      coordinates: altCoords,
      hazardWarnings: ['Heavy vehicular triage activity along South Ring Rd.'],
    },
  ];
}
