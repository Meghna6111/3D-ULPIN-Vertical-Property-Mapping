import type { Parcel, Building, Floor } from '@/types/property';
import type { DetectedFootprint, BuildingParameters, ConfirmedDimensions } from '@/types/floorplan';
import { PARCEL_LON, PARCEL_LAT } from '@/data/sampleProperty';

/**
 * Converts confirmed 2D DetectedFootprint + ConfirmedDimensions + BuildingParameters
 * into a full 3D Parcel & Building dataset.
 *
 * The confirmedDimensions object is the SINGLE AUTHORITATIVE SOURCE OF TRUTH for physical geometry.
 */
export function generatePropertyFromFloorplan(
  _footprint: DetectedFootprint,
  confirmedDimensions: ConfirmedDimensions,
  params: BuildingParameters,
): Parcel {
  const width = confirmedDimensions.widthMeters;
  const depth = confirmedDimensions.depthMeters;
  const areaSqM = Number((width * depth).toFixed(2));
  const singleFloorAreaSqft = Math.round(areaSqM * 10.7639);
  const totalLandAreaSqft = Math.round(areaSqM * 1.5 * 10.7639);

  // Temporary diagnostic logs
  console.log('[GENERATOR INPUT]', {
    width,
    depth,
    area: areaSqM,
    calculatedSqft: singleFloorAreaSqft,
  });

  console.log('[GENERATOR OUTPUT FOOTPRINT]', {
    widthM: width,
    depthM: depth,
    areaSqM,
    singleFloorAreaSqft,
    totalLandAreaSqft,
    floorsAbove: params.floorsAbove,
    basements: params.basements,
  });

  const buildingId = `BLD-${params.parcelId.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || 'GEN-01'}`;
  const floors: Floor[] = [];

  // 1. Generate Basements (below ground, negative levelIndex)
  for (let b = params.basements; b >= 1; b--) {
    const bId = `${buildingId}-B0${b}`;
    const floorSegment = `B0${b}`;
    const ulpinCode = `12A34B56C78D90-B00${b}`;

    floors.push({
      id: bId,
      label: `Basement 0${b}`,
      kind: 'basement',
      levelIndex: -b,
      areaSqft: singleFloorAreaSqft,
      owner: `Common / ${params.ownerName}`,
      status: 'active',
      verification: 'verified',
      useType: b === 1 ? 'Parking & Building Utilities' : 'Underground Storage & HVAC',
      ulpin: {
        code: ulpinCode,
        floorSegment,
        level: 'Below Ground',
      },
    });
  }

  // 2. Generate Ground Floor (levelIndex = 0)
  const groundId = `${buildingId}-G`;
  floors.push({
    id: groundId,
    label: 'Ground',
    kind: 'ground',
    levelIndex: 0,
    areaSqft: singleFloorAreaSqft,
    owner: params.ownerName,
    status: 'verified',
    verification: 'verified',
    useType: 'Entrance Lobby & Commercial / Reception',
    ulpin: {
      code: '12A34B56C78D90-A000',
      floorSegment: '000',
      level: 'Ground Level',
    },
  });

  // 3. Generate Above-Ground Floors (levelIndex = 1..N)
  for (let f = 1; f <= params.floorsAbove; f++) {
    const fStr = f < 10 ? `0${f}` : `${f}`;
    const fId = `${buildingId}-F${fStr}`;
    const floorSegment = `00${f}`;
    const ulpinCode = `12A34B56C78D90-A${floorSegment}`;

    // Floor 3 demo anomaly if 4 floors are generated
    const isAnomaly = f === 3 && params.floorsAbove >= 3;
    const isTopFloor = f === params.floorsAbove;

    floors.push({
      id: fId,
      label: `Floor ${fStr}`,
      kind: 'above',
      levelIndex: f,
      areaSqft: singleFloorAreaSqft,
      owner: isTopFloor ? 'Apex Penthouse Trust' : `Apartment Owner Unit ${f}01`,
      status: isAnomaly ? 'violation' : 'verified',
      verification: isAnomaly ? 'mismatch' : 'verified',
      useType: isAnomaly
        ? 'Residential Apartment (Unauthorized Partition)'
        : isTopFloor
          ? 'Penthouse Suite'
          : 'Residential Apartment',
      ulpin: {
        code: ulpinCode,
        floorSegment,
        level: 'Above Ground',
      },
    });
  }

  const building: Building = {
    id: buildingId,
    label: params.buildingLabel,
    totalFloors: params.floorsAbove,
    basementCount: params.basements,
    status: 'active',
    widthM: width,
    depthM: depth,
    floors,
  };

  const isValidLat =
    typeof params.latitude === 'number' &&
    !isNaN(params.latitude) &&
    params.latitude >= -90 &&
    params.latitude <= 90;
  const isValidLon =
    typeof params.longitude === 'number' &&
    !isNaN(params.longitude) &&
    params.longitude >= -180 &&
    params.longitude <= 180;

  const parcel: Parcel = {
    id: params.parcelId,
    label: params.propertyName,
    landAreaSqft: totalLandAreaSqft,
    status: 'verified',
    longitude: isValidLon && params.longitude !== undefined ? params.longitude : PARCEL_LON,
    latitude: isValidLat && params.latitude !== undefined ? params.latitude : PARCEL_LAT,
    buildings: [building],
  };

  return parcel;
}
