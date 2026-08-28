/**
 * Cadastral Adapter Architecture Types
 *
 * Defines the contract for cadastral data providers, data provenance,
 * and live connection lifecycle states.
 */

import type { ConfidenceLevel } from './evidence';

export type ProviderStatus =
  | 'MOCK_DATA'
  | 'EXTERNAL_CONNECTED'
  | 'NOT_CONNECTED'
  | 'ERROR';

export interface DataProvenance {
  /** Source descriptor, e.g. "Demo Cadastral Record" or "Karnataka Bhoomi Portal" */
  source: string;
  /** Unique municipal or database record ID */
  recordId: string;
  /** Timestamp when record was recorded/retrieved */
  timestamp: string;
  /** Provider engine identifier, e.g. "MockCadastralProvider v1.0" */
  provider: string;
  /** Operational status of the provider */
  providerStatus: ProviderStatus;
  /** Confidence in the cadastral data accuracy */
  confidence: ConfidenceLevel;
  /** Provenance description */
  provenanceStatus: string;
  /** Explicit live connection state */
  liveConnectionStatus: 'Not Connected' | 'Connected' | 'Error';
  /** Ground truth physical survey availability */
  groundTruthAvailability: 'Not Available' | 'Verified Field Survey' | 'Pending Scan';
}

export interface CadastralFloorRecord {
  ulpin: string;
  floorId: string;
  floorLabel: string;
  levelIndex: number;
  registeredAreaSqft: number;
  registeredUseType: string;
  ownerName: string;
  verificationStatus: 'verified' | 'pending' | 'mismatch';
  provenance: DataProvenance;
}

export interface CadastralParcelRecord {
  parcelId: string;
  parcelLabel: string;
  registeredLandAreaSqft: number;
  coordinates: {
    longitude: number;
    latitude: number;
  };
  floors: CadastralFloorRecord[];
  provenance: DataProvenance;
}

/**
 * Common interface for all Cadastral Data Providers.
 * Can be backed by Mock Data, Local SQLite, PostGIS, or future Government APIs.
 */
export interface ICadastralProvider {
  /** Unique provider identifier */
  readonly id: string;
  /** Human-readable provider name */
  readonly name: string;
  /** Current connection & data status */
  getStatus(): ProviderStatus;
  /** Returns parcel-level cadastral record */
  getParcelRecord(parcelId: string): CadastralParcelRecord | null;
  /** Returns floor-level strata cadastral record by ULPIN or floorId */
  getFloorRecord(ulpinOrFloorId: string): CadastralFloorRecord | null;
  /** Future async retrieval interface for external REST APIs */
  fetchParcelRecordAsync?(parcelId: string): Promise<CadastralParcelRecord | null>;
  /** Future async floor retrieval interface */
  fetchFloorRecordAsync?(ulpinOrFloorId: string): Promise<CadastralFloorRecord | null>;
}
