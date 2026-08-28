export type DisasterSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FloorEmergencyStatus = 'SAFE' | 'AT_RISK' | 'AFFECTED' | 'CRITICAL' | 'UNKNOWN';

export type RescuePriority = 'P1' | 'P2' | 'P3' | 'P4';

export type StructuralRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FireRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AccessStatus = 'OPEN' | 'LIMITED' | 'BLOCKED';

export type EvacuationStatus = 'AVAILABLE' | 'PARTIAL' | 'BLOCKED' | 'IN_PROGRESS' | 'COMPLETED';

export interface FloorEmergencyData {
  floorId: string;
  floorLabel: string;
  levelIndex: number;
  emergencyStatus: FloorEmergencyStatus;
  priority: RescuePriority;
  priorityReason: string;
  estimatedOccupants: number;
  registeredOccupants: number;
  vulnerableOccupants: number;
  structuralRisk: StructuralRisk;
  fireRisk: FireRisk;
  accessStatus: AccessStatus;
  evacuationStatus: EvacuationStatus;
  lastVerification: string;
  notes: string;
  ulpinCode: string;
}

export type RescueTeamType = 'FIRE_RESCUE' | 'MEDICAL' | 'SEARCH_RESCUE' | 'NDRF_SPECIAL';

export type RescueTeamStatus = 'DISPATCHED' | 'ON_SCENE' | 'EVACUATING' | 'STANDBY';

export interface RescueTeam {
  id: string;
  name: string;
  type: RescueTeamType;
  status: RescueTeamStatus;
  assignedFloor?: string;
  etaMinutes: number;
  personnelCount: number;
  callSign: string;
  longitude: number;
  latitude: number;
}

export type EmergencyPointKind =
  | 'HOSPITAL'
  | 'FIRE_STATION'
  | 'ASSEMBLY_POINT'
  | 'HAZARD_POINT'
  | 'BLOCKED_ROAD'
  | 'SAFE_SHELTER';

export interface EmergencyPoint {
  id: string;
  name: string;
  kind: EmergencyPointKind;
  status: 'ACTIVE' | 'CAPACITY_REACHED' | 'OPERATIONAL';
  distanceMeters: number;
  capacity?: number;
  availableBeds?: number;
  longitude: number;
  latitude: number;
  contactNumber: string;
}

export interface EvacuationRoute {
  id: string;
  name: string;
  status: 'PRIMARY_CLEAR' | 'ALTERNATIVE_ACTIVE' | 'BLOCKED';
  destinationName: string;
  estimatedTimeMinutes: number;
  distanceMeters: number;
  coordinates: [number, number][]; // [lon, lat][]
  hazardWarnings: string[];
}

export interface IncidentEvent {
  id: string;
  timestamp: string;
  timeFormatted: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  source: string;
}

export interface IncidentSummary {
  id: string;
  title: string;
  disasterType: string;
  severity: DisasterSeverity;
  status: 'ACTIVE' | 'CONTAINED' | 'EVACUATION_ORDERED' | 'RESOLVED';
  detectedAt: string;
  affectedArea: string;
  commandAgency: string;
  totalOccupantsAtRisk: number;
  evacuatedCount: number;
  activeTeamsCount: number;
}

/** Result from the Rescue Priority Engine for a single floor */
export interface FloorPriorityResult {
  floorId: string;
  floorName: string;
  score: number;
  priority: RescuePriority;
  priorityLabel: string;
  reasons: string[];
  occupantCount: number;
  vulnerableCount: number;
  recommendedTeamId: string | null;
  recommendedTeamName: string | null;
  recommendedTeamCallSign: string | null;
  estimatedResponseTime: string;
  confidence: number;
  factorScores: {
    structural: number;
    fireSmoke: number;
    occupant: number;
    vulnerable: number;
    access: number;
    evacuation: number;
    teamProximity: number;
  };
}

export interface DisasterDataset {
  incident: IncidentSummary;
  floors: Map<string, FloorEmergencyData>;
  teams: RescueTeam[];
  emergencyPoints: EmergencyPoint[];
  routes: EvacuationRoute[];
  activeRouteId: string;
  events: IncidentEvent[];
  /** Rescue Priority Queue — sorted by score descending (P1 first) */
  priorityQueue: FloorPriorityResult[];
}

