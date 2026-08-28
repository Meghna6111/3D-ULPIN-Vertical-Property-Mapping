import type { Parcel } from '@/types/property';
import type {
  DisasterDataset,
  FloorEmergencyData,
  RescueTeam,
  EmergencyPoint,
  IncidentSummary,
  IncidentEvent,
} from '@/types/disaster';
import { calculateRescuePriority } from './RescuePriorityService';
import { generateEvacuationRoutes } from './EvacuationService';
import { calculateAllFloorPriorities, type RescuePriorityInput } from './RescuePriorityEngine';

/**
 * Generates a realistic, deterministic simulated disaster dataset
 * anchored to the active Parcel and its vertical floor strata.
 */
export function createDisasterDataset(parcel: Parcel): DisasterDataset {
  const lon = parcel.longitude;
  const lat = parcel.latitude;
  const mToDegLon = 1 / (111320 * Math.cos((lat * Math.PI) / 180));
  const mToDegLat = 1 / 110574;

  const firstBuilding = parcel.buildings[0];
  const floorsMap = new Map<string, FloorEmergencyData>();

  let totalAtRisk = 0;
  let totalEvacuated = 0;

  if (firstBuilding) {
    for (const floor of firstBuilding.floors) {
      const isF03 = floor.label.includes('03') || floor.levelIndex === 3;
      const isF04 = floor.label.includes('04') || floor.levelIndex === 4;
      const isF02 = floor.label.includes('02') || floor.levelIndex === 2;
      const isF01 = floor.label.includes('01') && floor.levelIndex === 1;
      const isGround = floor.kind === 'ground' || floor.levelIndex === 0;
      const isBasement = floor.kind === 'basement';

      let emergencyStatus: FloorEmergencyData['emergencyStatus'] = 'SAFE';
      let structuralRisk: FloorEmergencyData['structuralRisk'] = 'LOW';
      let fireRisk: FloorEmergencyData['fireRisk'] = 'LOW';
      let accessStatus: FloorEmergencyData['accessStatus'] = 'OPEN';
      let evacuationStatus: FloorEmergencyData['evacuationStatus'] = 'AVAILABLE';
      let estimatedOccupants = 4;
      let registeredOccupants = 4;
      let vulnerableOccupants = 0;
      let notes = 'Normal environmental parameters.';

      if (isF03) {
        emergencyStatus = 'CRITICAL';
        structuralRisk = 'CRITICAL';
        fireRisk = 'HIGH';
        accessStatus = 'BLOCKED';
        evacuationStatus = 'BLOCKED';
        estimatedOccupants = 6;
        registeredOccupants = 4;
        vulnerableOccupants = 2;
        notes = 'Unauthorized interior partition failure. Stairwell doorway jammed. Active smoke breach.';
      } else if (isF04) {
        emergencyStatus = 'AT_RISK';
        structuralRisk = 'HIGH';
        fireRisk = 'MEDIUM';
        accessStatus = 'LIMITED';
        evacuationStatus = 'IN_PROGRESS';
        estimatedOccupants = 3;
        registeredOccupants = 2;
        vulnerableOccupants = 1;
        notes = 'Penthouse level — smoke accumulation from vertical elevator conduit.';
      } else if (isF02) {
        emergencyStatus = 'AFFECTED';
        structuralRisk = 'MEDIUM';
        fireRisk = 'LOW';
        accessStatus = 'LIMITED';
        evacuationStatus = 'IN_PROGRESS';
        estimatedOccupants = 5;
        registeredOccupants = 5;
        vulnerableOccupants = 0;
        notes = 'Secondary exit stairwell clear. Egress progressing smoothly.';
      } else if (isF01) {
        emergencyStatus = 'AFFECTED';
        structuralRisk = 'LOW';
        fireRisk = 'LOW';
        accessStatus = 'OPEN';
        evacuationStatus = 'COMPLETED';
        estimatedOccupants = 0;
        registeredOccupants = 4;
        vulnerableOccupants = 0;
        notes = 'Floor fully cleared and verified by search marshal.';
      } else if (isGround) {
        emergencyStatus = 'SAFE';
        structuralRisk = 'LOW';
        fireRisk = 'LOW';
        accessStatus = 'OPEN';
        evacuationStatus = 'COMPLETED';
        estimatedOccupants = 2;
        registeredOccupants = 2;
        vulnerableOccupants = 0;
        notes = 'Ground triage desk and incident field command post established.';
      } else if (isBasement) {
        emergencyStatus = 'AT_RISK';
        structuralRisk = 'MEDIUM';
        fireRisk = 'LOW';
        accessStatus = 'LIMITED';
        evacuationStatus = 'IN_PROGRESS';
        estimatedOccupants = 2;
        registeredOccupants = 2;
        vulnerableOccupants = 0;
        notes = 'Subterranean utility vault inspection underway. HVAC shutoff verified.';
      }

      const priorityEval = calculateRescuePriority({
        floorLabel: floor.label,
        structuralRisk,
        fireRisk,
        accessStatus,
        estimatedOccupants,
        vulnerableOccupants,
      });

      if (evacuationStatus === 'COMPLETED') {
        totalEvacuated += registeredOccupants;
      } else {
        totalAtRisk += estimatedOccupants;
      }

      floorsMap.set(floor.id, {
        floorId: floor.id,
        floorLabel: floor.label,
        levelIndex: floor.levelIndex,
        emergencyStatus,
        priority: priorityEval.priority,
        priorityReason: priorityEval.priorityReason,
        estimatedOccupants,
        registeredOccupants,
        vulnerableOccupants,
        structuralRisk,
        fireRisk,
        accessStatus,
        evacuationStatus,
        lastVerification: 'Just now (Live Telemetry)',
        notes,
        ulpinCode: floor.ulpin.code,
      });
    }
  }

  // Active Rescue Teams stationed around property (Cleanly spaced)
  const teams: RescueTeam[] = [
    {
      id: 'team-alpha',
      name: 'NDRF Quick Response Team Alpha',
      type: 'NDRF_SPECIAL',
      status: 'ON_SCENE',
      assignedFloor: firstBuilding?.floors.find((f) => f.label.includes('03'))?.id,
      etaMinutes: 0,
      personnelCount: 8,
      callSign: 'EAGLE-1',
      longitude: lon - 35 * mToDegLon,
      latitude: lat + 25 * mToDegLat,
    },
    {
      id: 'team-fire-04',
      name: 'Karnataka Fire & Emergency Services Unit 04',
      type: 'FIRE_RESCUE',
      status: 'ON_SCENE',
      assignedFloor: firstBuilding?.floors.find((f) => f.label.includes('04'))?.id,
      etaMinutes: 0,
      personnelCount: 6,
      callSign: 'BLAZE-4',
      longitude: lon + 40 * mToDegLon,
      latitude: lat + 35 * mToDegLat,
    },
    {
      id: 'team-medical-02',
      name: '108 Advanced Life Support Medical Unit',
      type: 'MEDICAL',
      status: 'ON_SCENE',
      etaMinutes: 0,
      personnelCount: 4,
      callSign: 'MEDIC-2',
      longitude: lon - 45 * mToDegLon,
      latitude: lat - 35 * mToDegLat,
    },
    {
      id: 'team-search-bravo',
      name: 'Civil Defense Search & Rescue Bravo',
      type: 'SEARCH_RESCUE',
      status: 'DISPATCHED',
      etaMinutes: 3,
      personnelCount: 10,
      callSign: 'SEARCH-9',
      longitude: lon + 55 * mToDegLon,
      latitude: lat - 45 * mToDegLat,
    },
  ];

  // Critical Emergency Points & Infrastructure
  const emergencyPoints: EmergencyPoint[] = [
    {
      id: 'point-assembly-a',
      name: 'Central Ground Assembly Point A',
      kind: 'ASSEMBLY_POINT',
      status: 'ACTIVE',
      distanceMeters: 280,
      capacity: 350,
      longitude: lon - 210 * mToDegLon,
      latitude: lat + 180 * mToDegLat,
      contactNumber: '112 / +91-80-2294-2222',
    },
    {
      id: 'point-hospital-victoria',
      name: 'Victoria Hospital Emergency Trauma Center',
      kind: 'HOSPITAL',
      status: 'ACTIVE',
      distanceMeters: 850,
      availableBeds: 24,
      longitude: lon + 350 * mToDegLon,
      latitude: lat + 290 * mToDegLat,
      contactNumber: '+91-80-2670-1150',
    },
    {
      id: 'point-fire-stn-4',
      name: 'High Grounds Fire Station',
      kind: 'FIRE_STATION',
      status: 'OPERATIONAL',
      distanceMeters: 620,
      longitude: lon - 280 * mToDegLon,
      latitude: lat - 240 * mToDegLat,
      contactNumber: '101 / +91-80-2287-1010',
    },
    {
      id: 'point-hazard-leak',
      name: 'Structural Debris Hazard Perimeter',
      kind: 'HAZARD_POINT',
      status: 'ACTIVE',
      distanceMeters: 45,
      longitude: lon - 15 * mToDegLon,
      latitude: lat + 38 * mToDegLat,
      contactNumber: 'Control Room Field Line',
    },
    {
      id: 'point-road-blocked',
      name: 'North-East Access Road Blockade (Debris)',
      kind: 'BLOCKED_ROAD',
      status: 'ACTIVE',
      distanceMeters: 110,
      longitude: lon + 85 * mToDegLon,
      latitude: lat + 60 * mToDegLat,
      contactNumber: 'Traffic Police Desk',
    },
  ];

  const routes = generateEvacuationRoutes(lon, lat);

  const events: IncidentEvent[] = [
    {
      id: 'evt-1',
      timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
      timeFormatted: '14:20:12',
      title: 'Structural Anomaly Detected on Floor 03',
      description: 'Sensor alert: Load-bearing wall stress exceeds threshold on Floor 03.',
      severity: 'CRITICAL',
      source: 'DoLR 3D IoT Structural Monitor',
    },
    {
      id: 'evt-2',
      timestamp: new Date(Date.now() - 11 * 60000).toISOString(),
      timeFormatted: '14:23:45',
      title: 'Disaster Command Center Activated',
      description: 'Level 2 Urban Structure Response initiated for parcel KA-BLR-GEN-002.',
      severity: 'WARNING',
      source: 'State Disaster Management Authority (SDMA)',
    },
    {
      id: 'evt-3',
      timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
      timeFormatted: '14:26:00',
      title: 'NDRF Team Alpha Deployed to Floor 03',
      description: 'NDRF Eagle-1 on scene initiating localized stairwell breach protocol.',
      severity: 'INFO',
      source: 'Emergency Dispatch Net',
    },
    {
      id: 'evt-4',
      timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
      timeFormatted: '14:30:18',
      title: 'Floor 01 Evacuation Verified Clear',
      description: 'All 4 registered occupants from Floor 01 accounted for at Assembly Point A.',
      severity: 'SUCCESS',
      source: 'Field Search Marshal',
    },
  ];

  const incident: IncidentSummary = {
    id: `INC-2026-${parcel.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || '9021'}`,
    title: `Structural Distress & Evacuation Alert — ${parcel.label}`,
    disasterType: 'Urban Structural Collapse & Fire Risk',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    detectedAt: new Date(Date.now() - 15 * 60000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    affectedArea: 'North-East Strata Column (F03 / F04)',
    commandAgency: 'NDRF • Karnataka Fire & Emergency Services • DoLR',
    totalOccupantsAtRisk: totalAtRisk,
    evacuatedCount: totalEvacuated,
    activeTeamsCount: teams.length,
  };

  // ── Rescue Priority Engine: Calculate Priority Queue ──────────────
  const priorityInputs: RescuePriorityInput[] = Array.from(floorsMap.values()).map(
    (floorData) => ({
      floorId: floorData.floorId,
      floorName: floorData.floorLabel,
      structuralRisk: floorData.structuralRisk,
      fireRisk: floorData.fireRisk,
      accessStatus: floorData.accessStatus,
      evacuationStatus: floorData.evacuationStatus,
      estimatedOccupants: floorData.estimatedOccupants,
      vulnerableOccupants: floorData.vulnerableOccupants,
      availableTeams: teams,
    }),
  );

  const priorityQueue = calculateAllFloorPriorities(priorityInputs);

  // Add a single Rescue Priority Calculated event
  const p1Floor = priorityQueue.find((r) => r.priority === 'P1');
  if (p1Floor) {
    events.push({
      id: 'evt-priority-calc',
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
      timeFormatted: new Date(Date.now() - 2 * 60000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      title: 'Rescue Priority Engine — Classification Complete',
      description: `${p1Floor.floorName} classified P1 Immediate Rescue (Score: ${p1Floor.score}/100). Reason: ${p1Floor.reasons.slice(0, 3).join(', ')}. Recommended unit: ${p1Floor.recommendedTeamCallSign || 'Awaiting assignment'}.`,
      severity: 'CRITICAL',
      source: 'Rescue Priority Engine v1.0',
    });
  }

  return {
    incident,
    floors: floorsMap,
    teams,
    emergencyPoints,
    routes,
    activeRouteId: routes[0]?.id || '',
    events,
    priorityQueue,
  };
}
