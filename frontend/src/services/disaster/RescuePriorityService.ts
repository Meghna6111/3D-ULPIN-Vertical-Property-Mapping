import type {
  RescuePriority,
  StructuralRisk,
  FireRisk,
  AccessStatus,
} from '@/types/disaster';

export interface PriorityEvaluationInput {
  floorLabel: string;
  structuralRisk: StructuralRisk;
  fireRisk: FireRisk;
  accessStatus: AccessStatus;
  estimatedOccupants: number;
  vulnerableOccupants: number;
}

export interface PriorityEvaluationResult {
  priority: RescuePriority;
  priorityScore: number;
  priorityReason: string;
}

/**
 * Deterministic Rescue Prioritization Engine.
 * Evaluates risk factors, vulnerable life counts, and physical egress bottlenecks
 * to rank floor-level rescue dispatch orders (P1..P4).
 */
export function calculateRescuePriority(input: PriorityEvaluationInput): PriorityEvaluationResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Structural Risk weight
  if (input.structuralRisk === 'CRITICAL') {
    score += 40;
    reasons.push('Critical structural compromise');
  } else if (input.structuralRisk === 'HIGH') {
    score += 25;
    reasons.push('High structural stress');
  } else if (input.structuralRisk === 'MEDIUM') {
    score += 10;
  }

  // 2. Fire & Toxic Gas Risk weight
  if (input.fireRisk === 'CRITICAL') {
    score += 35;
    reasons.push('Active thermal / toxic smoke breach');
  } else if (input.fireRisk === 'HIGH') {
    score += 20;
    reasons.push('Elevated smoke density');
  }

  // 3. Egress Access Bottleneck
  if (input.accessStatus === 'BLOCKED') {
    score += 30;
    reasons.push('Primary stairwell egress blocked');
  } else if (input.accessStatus === 'LIMITED') {
    score += 15;
    reasons.push('Restricted entry corridor');
  }

  // 4. Vulnerable Occupants (Children, Elderly, Mobility Impaired)
  if (input.vulnerableOccupants > 0) {
    score += input.vulnerableOccupants * 12;
    reasons.push(`${input.vulnerableOccupants} vulnerable occupant(s) recorded`);
  }

  // 5. Total Occupant Volume
  if (input.estimatedOccupants > 0) {
    score += Math.min(input.estimatedOccupants * 3, 20);
    reasons.push(`${input.estimatedOccupants} total occupants requiring evacuation`);
  }

  let priority: RescuePriority = 'P4';
  if (score >= 65) {
    priority = 'P1';
  } else if (score >= 40) {
    priority = 'P2';
  } else if (score >= 20) {
    priority = 'P3';
  } else {
    priority = 'P4';
  }

  const priorityReason =
    reasons.length > 0 ? reasons.join(' • ') : 'Standard monitoring — no immediate life risk';

  return {
    priority,
    priorityScore: score,
    priorityReason: `${priority} — ${priorityReason}`,
  };
}
