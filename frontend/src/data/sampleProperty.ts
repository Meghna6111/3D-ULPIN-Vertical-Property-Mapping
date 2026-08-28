import type { Parcel, SearchEntry } from '../types/property';

/**
 * Centralized sample property dataset for the 3D ULPIN prototype.
 *
 * All floors reference the same parcel/building so the React UI
 * and the Cesium 3D layer share one source of truth.
 */

const PARCEL_LON = 77.5946;
const PARCEL_LAT = 12.9716;

export const sampleParcel: Parcel = {
  id: 'KA-BLR-DEMO-001',
  label: 'Sample Parcel — Demo Cadastre',
  landAreaSqft: 2400,
  status: 'verified',
  longitude: PARCEL_LON,
  latitude: PARCEL_LAT,
  buildings: [
    {
      id: 'BLD-A-001',
      label: 'Building A',
      totalFloors: 5,
      basementCount: 1,
      status: 'active',
      floors: [
        {
          id: 'BLD-A-001-G',
          label: 'Ground',
          kind: 'ground',
          levelIndex: 0,
          areaSqft: 480,
          owner: 'Mehta Holdings Pvt. Ltd.',
          status: 'verified',
          verification: 'verified',
          useType: 'Retail / Commercial Lobby',
          ulpin: {
            code: '12A34B56C78D90-A000',
            floorSegment: '000',
            level: 'Ground Level',
          },
        },
        {
          id: 'BLD-A-001-F01',
          label: 'Floor 01',
          kind: 'above',
          levelIndex: 1,
          areaSqft: 460,
          owner: 'Arjun Mehta',
          status: 'verified',
          verification: 'verified',
          useType: 'Residential Apartment',
          ulpin: {
            code: '12A34B56C78D90-A001',
            floorSegment: '001',
            level: 'Above Ground',
          },
        },
        {
          id: 'BLD-A-001-F02',
          label: 'Floor 02',
          kind: 'above',
          levelIndex: 2,
          areaSqft: 460,
          owner: 'Kavya Reddy',
          status: 'warning',
          verification: 'pending',
          useType: 'Residential Apartment',
          ulpin: {
            code: '12A34B56C78D90-A002',
            floorSegment: '002',
            level: 'Above Ground',
          },
        },
        {
          id: 'BLD-A-001-F03',
          label: 'Floor 03',
          kind: 'above',
          levelIndex: 3,
          areaSqft: 460,
          owner: 'Sundaram Trust',
          status: 'violation',
          verification: 'mismatch',
          useType: 'Residential Apartment (Unauthorized Partition)',
          ulpin: {
            code: '12A34B56C78D90-A003',
            floorSegment: '003',
            level: 'Above Ground',
          },
        },
        {
          id: 'BLD-A-001-F04',
          label: 'Floor 04',
          kind: 'above',
          levelIndex: 4,
          areaSqft: 440,
          owner: 'Ishaan Verma',
          status: 'verified',
          verification: 'verified',
          useType: 'Penthouse',
          ulpin: {
            code: '12A34B56C78D90-A004',
            floorSegment: '004',
            level: 'Above Ground',
          },
        },
        {
          id: 'BLD-A-001-B01',
          label: 'Basement 01',
          kind: 'basement',
          levelIndex: -1,
          areaSqft: 500,
          owner: 'Common / Mehta Holdings Pvt. Ltd.',
          status: 'active',
          verification: 'verified',
          useType: 'Parking & Utilities',
          ulpin: {
            code: '12A34B56C78D90-B001',
            floorSegment: '001',
            level: 'Below Ground',
          },
        },
      ],
    },
  ],
};

/** Flatten the sample property tree into a searchable index. */
export function buildSearchIndex(parcel: Parcel = sampleParcel): SearchEntry[] {
  const entries: SearchEntry[] = [];

  entries.push({
    id: parcel.id,
    displayLabel: parcel.label,
    secondaryLabel: `Parcel ID: ${parcel.id}`,
    kind: 'parcel',
    parcelId: parcel.id,
    buildingId: '',
    floorId: null,
    ulpin: null,
  });

  for (const building of parcel.buildings) {
    entries.push({
      id: building.id,
      displayLabel: building.label,
      secondaryLabel: `Building ID: ${building.id}`,
      kind: 'building',
      parcelId: parcel.id,
      buildingId: building.id,
      floorId: null,
      ulpin: null,
    });

    for (const floor of building.floors) {
      entries.push({
        id: floor.id,
        displayLabel: `${floor.label} — ${building.label}`,
        secondaryLabel: `${floor.useType} · Owner: ${floor.owner}`,
        kind: 'floor',
        parcelId: parcel.id,
        buildingId: building.id,
        floorId: floor.id,
        ulpin: floor.ulpin.code,
      });
    }
  }

  return entries;
}

export const sampleSearchIndex = buildSearchIndex();

export { PARCEL_LON, PARCEL_LAT };
