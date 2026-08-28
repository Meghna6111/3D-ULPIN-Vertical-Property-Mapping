/**
 * 3D Geometry Verification Engine Types
 *
 * Defines contracts for 2D/3D physical footprint geometry,
 * registered cadastral geometry comparisons, polygon intersections,
 * boundary deviations, and deterministic discrepancy classifications.
 */

import type { ConfidenceLevel, EvidenceSource } from './evidence';
import type { DataProvenance } from './cadastral';

export type GeometryDiscrepancyClassification =
  | 'MATCH'
  | 'MINOR_DEVIATION'
  | 'BOUNDARY_MISMATCH'
  | 'AREA_MISMATCH'
  | 'MAJOR_SPATIAL_MISMATCH'
  | 'INSUFFICIENT_GEOMETRY';

export interface Point2D {
  x: number;
  y: number;
}

export interface BoundingBox2D {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  widthM: number;
  depthM: number;
}

export interface CadastralGeometry {
  /** Optional 2D polygon boundary in local/meter space */
  polygon?: Point2D[];
  /** Registered deed area in square feet */
  areaSqft: number;
  /** Registered deed area in square meters */
  areaSqM: number;
  /** Registered boundary perimeter in meters */
  perimeterM?: number;
  /** Deed bounding width in meters (if recorded) */
  widthM?: number;
  /** Deed bounding depth in meters (if recorded) */
  depthM?: number;
  /** Deed recorded elevation in meters (if recorded) */
  elevationM?: number;
  /** Deed recorded stratum height in meters (if recorded) */
  heightM?: number;
  /** Flag indicating whether polygon coordinates are present in the record */
  hasPolygon: boolean;
}

export interface Physical3DGeometry {
  /** 2D footprint polygon in local meter space */
  polygon: Point2D[];
  /** Bounding box of the physical footprint */
  bounds: BoundingBox2D;
  /** Calculated floor area in square feet */
  areaSqft: number;
  /** Calculated floor area in square meters */
  areaSqM: number;
  /** Perimeter of the physical boundary in meters */
  perimeterM: number;
  /** Footprint width in meters */
  widthM: number;
  /** Footprint depth in meters */
  depthM: number;
  /** Elevation of floor bottom from ground datum in meters */
  floorElevationM: number;
  /** Clear floor height in meters */
  floorHeightM: number;
  /** 3D spatial volume of this stratum in cubic meters */
  volumeM3: number;
}

export interface GeometryAvailability {
  /** True when both registered & physical areas can be compared mathematically */
  areaComparisonAvailable: boolean;
  /** True only when actual cadastral polygon coordinates are provided to intersect */
  geometryOverlapAvailable: boolean;
  /** True only when cadastral boundary coordinates can be compared with physical edges */
  boundaryComparisonAvailable: boolean;
  /** True when floor elevations are available */
  elevationComparisonAvailable: boolean;
}

export interface ElevationComparisonInfo {
  floorElevationM: number;
  floorHeightM: number;
  totalBuildingHeightM: number;
  registeredElevationM: number | null;
  registeredHeightM: number | null;
  elevationDifferenceM: number | null;
}

export interface GeometryVerificationResult {
  ulpin: string;
  parcelId: string;
  buildingId: string;
  floorId: string;
  floorLabel: string;
  /** Registered cadastral geometry (from deed / provider) */
  registeredGeometry: CadastralGeometry | null;
  /** Derived physical 3D geometry (from confirmed footprint extrusion) */
  physicalGeometry: Physical3DGeometry;
  /** Deed-registered area in sq.ft */
  registeredAreaSqft: number;
  /** Derived physical area in sq.ft */
  physicalAreaSqft: number;
  /** Absolute difference: physicalArea - registeredArea (sq.ft) */
  areaDifferenceSqft: number;
  /** Percentage variance: ((physical - registered) / registered) * 100 */
  percentageVariance: number;
  /** Geometric intersection / union overlap percentage (0-100), or null if polygon unavailable */
  geometryOverlapPercentage: number | null;
  /** Maximum boundary deviation in meters, or null if polygon unavailable */
  boundaryDeviationMeters: number | null;
  /** Elevation and vertical stratum information */
  elevationInfo: ElevationComparisonInfo;
  /** Deterministic classification */
  classification: GeometryDiscrepancyClassification;
  /** Measurement confidence */
  confidence: ConfidenceLevel;
  /** Primary evidence source descriptor */
  evidenceSource: EvidenceSource;
  /** Cadastral Data Provider Provenance */
  provenance: DataProvenance;
  /** Explicit feature availability matrix */
  availability: GeometryAvailability;
  /** Summary of algorithmic geometric findings */
  findings: string[];
}
