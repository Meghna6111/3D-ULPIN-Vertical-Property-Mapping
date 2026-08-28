/**
 * Ground-Truth Evidence Layer Types
 *
 * Provides a structured schema distinguishing:
 *  1. Registered Cadastral Title Data (DoLR / Municipal deeds)
 *  2. 3D Model-Derived Spatial Data (from confirmed footprint extrusion)
 *  3. Future / External Ground-Truth Feeds (LiDAR, Field Survey, Satellite, IoT)
 */

import type { DataProvenance } from './cadastral';
import type { GeometryVerificationResult } from './geometryVerification';

export type EvidenceSource =
  | 'CADASTRAL_RECORD'
  | '3D_MODEL'
  | 'LIDAR'
  | 'PHOTOGRAMMETRY'
  | 'FIELD_SURVEY'
  | 'SATELLITE'
  | 'IOT';

export type ConfidenceLevel =
  | 'UNVERIFIED'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'GROUND_TRUTH';

export type GroundTruthStatus =
  | 'CONFIRMED_MATCH'
  | 'DISCREPANCY_DETECTED'
  | 'UNVERIFIED_PENDING'
  | 'STRUCTURAL_VIOLATION';

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  source: EvidenceSource;
  confidence: ConfidenceLevel;
  finding: string;
  verifiedBy: string;
  isOperationalInPrototype: boolean;
}

export interface FloorEvidenceRecord {
  ulpin: string;
  floorId: string;
  floorLabel: string;
  /** Deed-registered area from 2D Cadastral record (sq.ft) */
  registeredCadastralAreaSqft: number;
  /** Spatial area derived from 3D extrusion model (sq.ft) */
  spatialDerivedAreaSqft: number;
  /** Absolute difference (spatial - registered) in sq.ft */
  absoluteDifferenceSqft: number;
  /** Percentage variance: ((spatial - registered) / registered) * 100 */
  percentageVariance: number;
  /** Source of spatial measurement */
  primaryEvidenceSource: EvidenceSource;
  /** Confidence in the measurement */
  measurementConfidence: ConfidenceLevel;
  /** Overall ground-truth assessment */
  groundTruthStatus: GroundTruthStatus;
  /** ISO timestamp of data derivation/capture */
  captureTimestamp: string;
  /** WGS84 spatial coordinates and elevation */
  coordinates: {
    longitude: number;
    latitude: number;
    elevationM: number;
  };
  /** Formal algorithmic verification decision */
  verificationDecision: string;
  /** Detailed rationale & structural breakdown */
  findings: string[];
  /** Audit log of data collection & ground-truth verification steps */
  auditTrail: AuditTrailEntry[];
  /** Provenance metadata from the Cadastral Data Provider */
  cadastralProvenance: DataProvenance;
  /** Comprehensive 3D geometry verification output */
  geometryVerification?: GeometryVerificationResult;
}


