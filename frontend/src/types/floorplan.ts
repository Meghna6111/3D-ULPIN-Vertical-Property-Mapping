export type DetectionQuality = 'GOOD' | 'REVIEW_REQUIRED' | 'FAILED';

export interface NormalizedPoint {
  /** X coordinate in normalized [0, 1] image space */
  x: number;
  /** Y coordinate in normalized [0, 1] image space */
  y: number;
}

export interface DetectedFootprint {
  /** Ordered vertices tracing the closed exterior building perimeter in normalized [0, 1] space */
  polygon: NormalizedPoint[];
  /** Bounding box aspect ratio (width / depth) */
  aspectRatio: number;
  /** Detection quality assessment */
  quality: DetectionQuality;
  /** Factual rationale for the quality assessment */
  qualityReason: string;
  /** Original image width in pixels */
  imageWidth: number;
  /** Original image height in pixels */
  imageHeight: number;
  /** Approximate pixel area percentage of the bounding contour */
  contourAreaRatio: number;
  /** ISO timestamp */
  detectedAt: string;
}

export interface ConfirmedDimensions {
  /** Confirmed width in meters (East-West) */
  widthMeters: number;
  /** Confirmed depth in meters (North-South) */
  depthMeters: number;
}

export interface BuildingParameters {
  /** Number of above-ground floors (e.g., 4) */
  floorsAbove: number;
  /** Number of basement floors below ground (e.g., 1) */
  basements: number;
  /** Floor-to-floor height in meters (e.g., 3.0m) */
  floorHeight: number;
  /** Structural slab thickness in meters (e.g., 0.2m) */
  slabThickness: number;
  /** Display label for the property */
  propertyName: string;
  /** Cadastral Parcel ID */
  parcelId: string;
  /** Building Label (e.g., "Building 01") */
  buildingLabel: string;
  /** Owner name */
  ownerName: string;
  /** Optional target longitude for georeferencing */
  longitude?: number;
  /** Optional target latitude for georeferencing */
  latitude?: number;
}

export interface FloorplanImageSource {
  imageUrl: string;
  filename: string;
  filesize: number;
  isPreset?: boolean;
}
