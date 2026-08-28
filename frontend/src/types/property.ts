export type PropertyStatus =
  | 'verified'
  | 'warning'
  | 'violation'
  | 'rescue'
  | 'active'
  | 'pending';

export type VerificationStatus = 'verified' | 'pending' | 'mismatch';

export type FloorKind = 'ground' | 'above' | 'basement';

export interface ULPIN {
  /** Prototype 3D ULPIN code, e.g. 12A34B56C78D90-A003 */
  code: string;
  /** Numeric floor segment, e.g. 003 */
  floorSegment: string;
  /** Human-readable level descriptor */
  level: string;
}

export interface Floor {
  id: string;
  label: string;
  kind: FloorKind;
  /** 0 = ground, positive = above ground, negative = basement */
  levelIndex: number;
  areaSqft: number;
  owner: string;
  status: PropertyStatus;
  verification: VerificationStatus;
  ulpin: ULPIN;
  useType: string;
}

export interface Building {
  id: string;
  label: string;
  floors: Floor[];
  totalFloors: number;
  basementCount: number;
  status: PropertyStatus;
  widthM?: number;
  depthM?: number;
}

export interface Parcel {
  id: string;
  label: string;
  landAreaSqft: number;
  status: PropertyStatus;
  /** WGS84 longitude, latitude of the parcel centroid */
  longitude: number;
  latitude: number;
  buildings: Building[];
}

/**
 * Searchable entity index derived from the sample property tree.
 * Used by the local search to resolve Property/Parcel/Building/ULPIN queries.
 */
export interface SearchEntry {
  id: string;
  displayLabel: string;
  secondaryLabel: string;
  kind: 'parcel' | 'building' | 'floor';
  parcelId: string;
  buildingId: string;
  floorId: string | null;
  ulpin: string | null;
}

export type SelectionKind = 'parcel' | 'building' | 'floor' | null;

export interface SelectionState {
  kind: SelectionKind;
  parcelId: string | null;
  buildingId: string | null;
  floorId: string | null;
}

export type MapMode = '3d' | '2d';
