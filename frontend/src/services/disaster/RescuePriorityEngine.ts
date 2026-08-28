/**
 * RescuePriorityEngine — Deterministic Weighted Scoring Model
 *
 * Transparent, auditable rescue prioritization for vertical floor strata
 * during active disaster events. Designed for future replacement of demo
 * inputs with real-time IoT telemetry, AI anomaly detection, occupancy
 * sensors, GIS road distances, and rescue-team GPS feeds.
 *
 * Scoring Model (normalized 0–100 per factor):
 *
 *   priorityScore =
 *     structuralRisk        × 0.25
 *   + fireSmokeRisk         × 0.20
 *   + occupantRisk          × 0.15
 *   + vulnerableOccupants   × 0.15
 *   + accessRestriction     × 0.10
 *   + evacuationBlocked     × 0.10
 *   + teamProximity         × 0.05
 *
 * Priority Classification:
 *   80–100 = P1 / IMMEDIATE RESCUE
 *   60–79  = P2 / HIGH PRIORITY
 *   35–59  = P3 / MONITOR & ASSIST
 *   0–34   = P4 / LOW PRIORITY
 */

import type {
  StructuralRisk,
  FireRisk,
  AccessStatus,
  EvacuationStatus,
  RescuePriority,
  RescueTeam,
} from '@/types/disaster';

// ── Input & Result Interfaces ──────────────────────────────────────────

export interface RescuePriorityInput {
  floorId: string;
  floorName: string;
  structuralRisk: StructuralRisk;
  fireRisk: FireRisk;
  accessStatus: AccessStatus;
  evacuationStatus: EvacuationStatus;
  estimatedOccupants: number;
  vulnerableOccupants: number;
  /** Available rescue teams for assignment consideration */
  availableTeams: RescueTeam[];
}

export interface RescuePriorityResult {
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
  /** Individual factor scores for transparency */
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

// ── Weight Configuration ───────────────────────────────────────────────

export const PRIORITY_WEIGHTS = {
  structural: 0.25,
  fireSmoke: 0.20,
  occupant: 0.15,
  vulnerable: 0.15,
  access: 0.10,
  evacuation: 0.10,
  teamProximity: 0.05,
} as const;

export const PRIORITY_THRESHOLDS = {
  P1: 80,
  P2: 60,
  P3: 35,
  P4: 0,
} as const;

export const PRIORITY_LABELS: Record<RescuePriority, string> = {
  P1: 'IMMEDIATE RESCUE',
  P2: 'HIGH PRIORITY',
  P3: 'MONITOR & ASSIST',
  P4: 'LOW PRIORITY',
};

// ── Factor Normalization (pure functions, unit-testable) ───────────────

export function normalizeStructuralRisk(risk: StructuralRisk): number {
  switch (risk) {
    case 'CRITICAL': return 100;
    case 'HIGH': return 85;
    case 'MEDIUM': return 60;
    case 'LOW': return 10;
    default: return 0;
  }
}

export function normalizeFireRisk(risk: FireRisk): number {
  switch (risk) {
    case 'CRITICAL': return 100;
    case 'HIGH': return 85;
    case 'MEDIUM': return 55;
    case 'LOW': return 10;
    default: return 0;
  }
}

export function normalizeOccupantRisk(occupants: number): number {
  if (occupants <= 0) return 0;
  if (occupants <= 2) return 40;
  if (occupants <= 4) return 65;
  if (occupants <= 6) return 85;
  if (occupants <= 10) return 95;
  return 100;
}

export function normalizeVulnerableOccupants(vulnerable: number, total: number): number {
  if (vulnerable <= 0) return 0;
  if (vulnerable === 1) return 65;
  if (vulnerable === 2) return 85;
  return Math.min(85 + (vulnerable - 2) * 10, 100);
}

export function normalizeAccessRestriction(access: AccessStatus): number {
  switch (access) {
    case 'BLOCKED': return 100;
    case 'LIMITED': return 65;
    case 'OPEN': return 10;
    default: return 0;
  }
}

export function normalizeEvacuationBlocked(status: EvacuationStatus): number {
  switch (status) {
    case 'BLOCKED': return 100;
    case 'PARTIAL': return 70;
    case 'IN_PROGRESS': return 55;
    case 'AVAILABLE': return 20;
    case 'COMPLETED': return 0;
    default: return 0;
  }
}

export function normalizeTeamProximity(teams: RescueTeam[], floorId: string): number {
  if (teams.length === 0) return 100;
  const assignedTeam = teams.find((t) => t.assignedFloor === floorId);
  if (assignedTeam && assignedTeam.status === 'ON_SCENE') return 30;
  if (assignedTeam) return 50;
  const anyOnScene = teams.some((t) => t.status === 'ON_SCENE');
  return anyOnScene ? 40 : 80;
}

// ── Reason Generator (pure, deterministic) ─────────────────────────────

export function generateReasons(input: RescuePriorityInput): string[] {
  const reasons: string[] = [];

  if (input.structuralRisk === 'CRITICAL') {
    reasons.push('Critical structural compromise detected');
  } else if (input.structuralRisk === 'HIGH') {
    reasons.push('Elevated structural stress');
  }

  if (input.fireRisk === 'CRITICAL') {
    reasons.push('Active fire/toxic smoke breach');
  } else if (input.fireRisk === 'HIGH') {
    reasons.push('High fire/smoke risk');
  } else if (input.fireRisk === 'MEDIUM') {
    reasons.push('Moderate smoke density');
  }

  if (input.accessStatus === 'BLOCKED') {
    reasons.push('Stair access blocked — egress obstructed');
  } else if (input.accessStatus === 'LIMITED') {
    reasons.push('Limited access corridor');
  }

  if (input.evacuationStatus === 'BLOCKED') {
    reasons.push('Evacuation route blocked');
  } else if (input.evacuationStatus === 'IN_PROGRESS') {
    reasons.push('Evacuation in progress');
  }

  if (input.estimatedOccupants > 0) {
    reasons.push(`${input.estimatedOccupants} occupant(s) on floor`);
  }

  if (input.vulnerableOccupants > 0) {
    reasons.push(`${input.vulnerableOccupants} vulnerable occupant(s) (elderly/children/mobility-impaired)`);
  }

  if (reasons.length === 0) {
    reasons.push('No immediate life-safety risk identified');
  }

  return reasons;
}

// ── Team Assignment (deterministic) ────────────────────────────────────

export interface TeamAssignment {
  teamId: string | null;
  teamName: string | null;
  callSign: string | null;
  eta: string;
}

export function assignTeam(
  input: RescuePriorityInput,
  alreadyAssigned: Set<string>,
): TeamAssignment {
  const { availableTeams, floorId } = input;

  // 1. If a team is already assigned to this floor, use it
  const preAssigned = availableTeams.find(
    (t) => t.assignedFloor === floorId,
  );
  if (preAssigned) {
    return {
      teamId: preAssigned.id,
      teamName: preAssigned.name,
      callSign: preAssigned.callSign,
      eta: preAssigned.status === 'ON_SCENE' ? 'On Scene' : `~${preAssigned.etaMinutes} min`,
    };
  }

  // 2. Find an unassigned team, preferring ON_SCENE teams
  const candidates = availableTeams
    .filter((t) => !alreadyAssigned.has(t.id))
    .sort((a, b) => {
      const statusOrder = { ON_SCENE: 0, DISPATCHED: 1, EVACUATING: 2, STANDBY: 3 };
      return (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
    });

  if (candidates.length > 0) {
    const team = candidates[0];
    return {
      teamId: team.id,
      teamName: team.name,
      callSign: team.callSign,
      eta: team.status === 'ON_SCENE' ? 'On Scene' : `~${team.etaMinutes} min`,
    };
  }

  return { teamId: null, teamName: null, callSign: null, eta: 'No team available' };
}

// ── Main Engine ────────────────────────────────────────────────────────

export function calculateFloorPriority(input: RescuePriorityInput): Omit<RescuePriorityResult, 'recommendedTeamId' | 'recommendedTeamName' | 'recommendedTeamCallSign' | 'estimatedResponseTime'> & { _teamAssignmentDeferred: true } {
  const factorScores = {
    structural: normalizeStructuralRisk(input.structuralRisk),
    fireSmoke: normalizeFireRisk(input.fireRisk),
    occupant: normalizeOccupantRisk(input.estimatedOccupants),
    vulnerable: normalizeVulnerableOccupants(input.vulnerableOccupants, input.estimatedOccupants),
    access: normalizeAccessRestriction(input.accessStatus),
    evacuation: normalizeEvacuationBlocked(input.evacuationStatus),
    teamProximity: normalizeTeamProximity(input.availableTeams, input.floorId),
  };

  const rawScore =
    factorScores.structural * PRIORITY_WEIGHTS.structural +
    factorScores.fireSmoke * PRIORITY_WEIGHTS.fireSmoke +
    factorScores.occupant * PRIORITY_WEIGHTS.occupant +
    factorScores.vulnerable * PRIORITY_WEIGHTS.vulnerable +
    factorScores.access * PRIORITY_WEIGHTS.access +
    factorScores.evacuation * PRIORITY_WEIGHTS.evacuation +
    factorScores.teamProximity * PRIORITY_WEIGHTS.teamProximity;

  const score = Math.round(rawScore);

  let priority: RescuePriority = 'P4';
  if (score >= PRIORITY_THRESHOLDS.P1) priority = 'P1';
  else if (score >= PRIORITY_THRESHOLDS.P2) priority = 'P2';
  else if (score >= PRIORITY_THRESHOLDS.P3) priority = 'P3';

  const reasons = generateReasons(input);

  // Confidence: higher when more data points are available
  const dataPoints = [
    input.structuralRisk !== 'LOW',
    input.fireRisk !== 'LOW',
    input.estimatedOccupants > 0,
    input.vulnerableOccupants > 0,
    input.accessStatus !== 'OPEN',
    input.evacuationStatus !== 'AVAILABLE',
    input.availableTeams.length > 0,
  ].filter(Boolean).length;
  const confidence = Math.min(0.65 + dataPoints * 0.05, 0.98);

  return {
    floorId: input.floorId,
    floorName: input.floorName,
    score,
    priority,
    priorityLabel: PRIORITY_LABELS[priority],
    reasons,
    occupantCount: input.estimatedOccupants,
    vulnerableCount: input.vulnerableOccupants,
    confidence,
    factorScores,
    _teamAssignmentDeferred: true,
  };
}

/**
 * Calculates rescue priority for ALL floors and assigns teams globally.
 * This is the main entry point — called once per disaster dataset update.
 */
export function calculateAllFloorPriorities(
  inputs: RescuePriorityInput[],
): RescuePriorityResult[] {
  // 1. Calculate raw scores for all floors
  const rawResults = inputs.map((input) => ({
    input,
    result: calculateFloorPriority(input),
  }));

  // 2. Sort by score descending (highest priority first)
  rawResults.sort((a, b) => b.result.score - a.result.score);

  // 3. Assign teams in priority order (highest-priority floor gets first pick)
  const assignedTeams = new Set<string>();
  const finalResults: RescuePriorityResult[] = [];

  for (const { input, result } of rawResults) {
    const teamAssignment = assignTeam(input, assignedTeams);
    if (teamAssignment.teamId) {
      assignedTeams.add(teamAssignment.teamId);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _teamAssignmentDeferred, ...rest } = result;
    finalResults.push({
      ...rest,
      recommendedTeamId: teamAssignment.teamId,
      recommendedTeamName: teamAssignment.teamName,
      recommendedTeamCallSign: teamAssignment.callSign,
      estimatedResponseTime: teamAssignment.eta,
    });
  }

  // 4. Re-sort by score descending for the priority queue
  finalResults.sort((a, b) => b.score - a.score);

  return finalResults;
}
