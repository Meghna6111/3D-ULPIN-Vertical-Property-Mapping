/**
 * GeometryVerificationEngine
 *
 * Deterministic engine comparing registered cadastral records with
 * physical/generated 3D spatial models.
 *
 * Supports:
 *  - 2D footprint polygon geometry
 *  - Floor area (sq.ft and m²)
 *  - Perimeter & bounding box
 *  - Floor elevation & stratum clear height
 *  - Volumetric representation (m³)
 *  - Exact geometric intersection & overlap percentage (when cadastral polygon is provided)
 *  - Deterministic discrepancy classification without ML.
 */

import type { Floor, Building, Parcel } from '../../types/property';
import type {
  GeometryVerificationResult,
  GeometryDiscrepancyClassification,
  Physical3DGeometry,
  CadastralGeometry,
  Point2D,
  BoundingBox2D,
} from '../../types/geometryVerification';
import { CadastralRegistry } from '../cadastral/CadastralRegistry';


const SQM_TO_SQFT = 10.7639;

// ==========================================
// Deterministic Geometric Utilities
// ==========================================

/** Calculates polygon area using the Shoelace formula */
export function calculatePolygonArea(points: Point2D[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2.0;
}

/** Calculates polygon perimeter in meters */
export function calculatePolygonPerimeter(points: Point2D[]): number {
  if (!points || points.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const dx = points[j].x - points[i].x;
    const dy = points[j].y - points[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  return perimeter;
}

/** Calculates axis-aligned bounding box for a polygon */
export function calculatePolygonBounds(points: Point2D[]): BoundingBox2D {
  if (!points || points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, widthM: 0, depthM: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    widthM: Number((maxX - minX).toFixed(2)),
    depthM: Number((maxY - minY).toFixed(2)),
  };
}

/**
 * Sutherland-Hodgman polygon clipping to compute exact intersection polygon
 * between two planar polygons.
 */
export function clipPolygon(subjectPolygon: Point2D[], clipPolygon: Point2D[]): Point2D[] {
  if (!subjectPolygon.length || !clipPolygon.length) return [];

  let outputList = subjectPolygon;

  for (let i = 0; i < clipPolygon.length; i++) {
    const cp1 = clipPolygon[i];
    const cp2 = clipPolygon[(i + 1) % clipPolygon.length];
    const inputList = outputList;
    outputList = [];

    if (!inputList.length) break;
    let s = inputList[inputList.length - 1];

    for (let j = 0; j < inputList.length; j++) {
      const e = inputList[j];
      const isInsideE = (cp2.x - cp1.x) * (e.y - cp1.y) - (cp2.y - cp1.y) * (e.x - cp1.x) >= 0;
      const isInsideS = (cp2.x - cp1.x) * (s.y - cp1.y) - (cp2.y - cp1.y) * (s.x - cp1.x) >= 0;

      if (isInsideE) {
        if (!isInsideS) {
          outputList.push(computeLineIntersection(cp1, cp2, s, e));
        }
        outputList.push(e);
      } else if (isInsideS) {
        outputList.push(computeLineIntersection(cp1, cp2, s, e));
      }
      s = e;
    }
  }

  return outputList;
}

function computeLineIntersection(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): Point2D {
  const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(denom) < 1e-9) return { x: (p1.x + p3.x) / 2, y: (p1.y + p3.y) / 2 };

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  return {
    x: x1 + ua * (x2 - x1),
    y: y1 + ua * (y2 - y1),
  };
}

/** Calculates maximum boundary deviation between two polygons in meters */
export function calculateBoundaryDeviation(polyA: Point2D[], polyB: Point2D[]): number {
  if (!polyA.length || !polyB.length) return 0;

  function maxMinDist(src: Point2D[], dst: Point2D[]): number {
    let maxDist = 0;
    for (const p of src) {
      let minDist = Infinity;
      for (let i = 0; i < dst.length; i++) {
        const d1 = dst[i];
        const d2 = dst[(i + 1) % dst.length];
        const dist = pointToSegmentDistance(p, d1, d2);
        if (dist < minDist) minDist = dist;
      }
      if (minDist > maxDist) maxDist = minDist;
    }
    return maxDist;
  }

  return Number(Math.max(maxMinDist(polyA, polyB), maxMinDist(polyB, polyA)).toFixed(2));
}

function pointToSegmentDistance(p: Point2D, v: Point2D, w: Point2D): number {
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return Math.sqrt((p.x - v.x) * (p.x - v.x) + (p.y - v.y) * (p.y - v.y));
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = v.x + t * (w.x - v.x);
  const projY = v.y + t * (w.y - v.y);
  return Math.sqrt((p.x - projX) * (p.x - projX) + (p.y - projY) * (p.y - projY));
}

/**
 * Creates default rectangular footprint centered at origin.
 * In a full GIS setup, coordinates would be projected UTM meters.
 */
export function createRectangularPolygon(widthM: number, depthM: number, offsetX = 0, offsetY = 0): Point2D[] {
  const halfW = widthM / 2;
  const halfD = depthM / 2;
  return [
    { x: -halfW + offsetX, y: -halfD + offsetY },
    { x: halfW + offsetX, y: -halfD + offsetY },
    { x: halfW + offsetX, y: halfD + offsetY },
    { x: -halfW + offsetX, y: halfD + offsetY },
  ];
}

// ==========================================
// Geometry Verification Engine Class
// ==========================================

export class GeometryVerificationEngine {
  /**
   * Deterministically verifies physical 3D building geometry against cadastral title records.
   */
  public static verifyFloorGeometry(
    floor: Floor,
    building: Building,
    parcel: Parcel,
    customCadastralGeometry?: CadastralGeometry,
  ): GeometryVerificationResult {
    // 1. Resolve registered cadastral record from registry
    const cadastralFloor = CadastralRegistry.getFloorRecord(floor.ulpin.code)
      || CadastralRegistry.getFloorRecord(floor.id);

    const registryStatus = CadastralRegistry.getStatus();
    const registeredAreaSqft = customCadastralGeometry?.areaSqft ?? (cadastralFloor?.registeredAreaSqft || 460);
    const registeredAreaSqM = Number((registeredAreaSqft / SQM_TO_SQFT).toFixed(2));

    const cadastralProvenance = cadastralFloor?.provenance || {
      source: 'Demo Cadastral Record',
      recordId: `${parcel.id}/${floor.id}`,
      timestamp: '2024-03-15T09:30:00Z',
      provider: registryStatus.activeProviderName,
      providerStatus: registryStatus.activeProviderStatus,
      confidence: 'MEDIUM' as const,
      provenanceStatus: 'Simulated demo record — not sourced from a live government cadastral registry.',
      liveConnectionStatus: 'Not Connected' as const,
      groundTruthAvailability: 'Not Available' as const,
    };

    // 2. Resolve physical 3D geometry from confirmed building parameters
    const widthM = building.widthM !== undefined ? building.widthM : 18.0;
    const depthM = building.depthM !== undefined ? building.depthM : 14.5;
    const floorHeightM = 3.2;
    const floorElevationM = floor.levelIndex * floorHeightM;
    const totalBuildingHeightM = (building.totalFloors + (building.basementCount || 0)) * floorHeightM;

    const physicalPolygon = createRectangularPolygon(widthM, depthM);
    const physicalAreaSqM = Number((widthM * depthM).toFixed(2));
    const physicalAreaSqft = Math.round(physicalAreaSqM * SQM_TO_SQFT);
    const physicalPerimeterM = Number((2 * (widthM + depthM)).toFixed(2));
    const physicalVolumeM3 = Number((physicalAreaSqM * floorHeightM).toFixed(2));

    const physicalGeometry: Physical3DGeometry = {
      polygon: physicalPolygon,
      bounds: calculatePolygonBounds(physicalPolygon),
      areaSqft: physicalAreaSqft,
      areaSqM: physicalAreaSqM,
      perimeterM: physicalPerimeterM,
      widthM,
      depthM,
      floorElevationM,
      floorHeightM,
      volumeM3: physicalVolumeM3,
    };

    // 3. Mathematical Area Variance
    const areaDifferenceSqft = physicalAreaSqft - registeredAreaSqft;
    const percentageVariance = registeredAreaSqft > 0
      ? Number(((areaDifferenceSqft / registeredAreaSqft) * 100).toFixed(2))
      : 0;

    // 4. Cadastral Geometry & Polygon Intersection (if polygon provided)
    const registeredGeometry: CadastralGeometry = customCadastralGeometry ?? {
      areaSqft: registeredAreaSqft,
      areaSqM: registeredAreaSqM,
      hasPolygon: false,
    };

    let geometryOverlapPercentage: number | null = null;
    let boundaryDeviationMeters: number | null = null;
    let geometryOverlapAvailable = false;
    let boundaryComparisonAvailable = false;

    if (registeredGeometry.hasPolygon && registeredGeometry.polygon && registeredGeometry.polygon.length >= 3) {
      geometryOverlapAvailable = true;
      boundaryComparisonAvailable = true;

      const intersectionPoly = clipPolygon(physicalPolygon, registeredGeometry.polygon);
      const intersectionArea = calculatePolygonArea(intersectionPoly);
      const unionArea = physicalAreaSqM + registeredGeometry.areaSqM - intersectionArea;

      geometryOverlapPercentage = unionArea > 0
        ? Number(((intersectionArea / unionArea) * 100).toFixed(1))
        : 0;

      boundaryDeviationMeters = calculateBoundaryDeviation(physicalPolygon, registeredGeometry.polygon);
    }

    // 5. Deterministic Classification Logic
    let classification: GeometryDiscrepancyClassification;
    const findings: string[] = [];

    // Check invalid/zero geometry first
    if (physicalAreaSqft <= 0 || widthM <= 0 || depthM <= 0 || registeredAreaSqft <= 0) {
      classification = 'INSUFFICIENT_GEOMETRY';
      findings.push('Insufficient or zero geometric boundary data available for spatial verification.');
    } else if (geometryOverlapAvailable && geometryOverlapPercentage !== null && boundaryDeviationMeters !== null) {
      // Full polygon comparison
      const absVar = Math.abs(percentageVariance);

      if (geometryOverlapPercentage >= 98.0 && boundaryDeviationMeters <= 0.3 && absVar <= 2.0) {
        classification = 'MATCH';
        findings.push('Physical 3D footprint matches registered cadastral polygon within standard tolerance (overlap ≥ 98%, variance ≤ 2%).');
      } else if (geometryOverlapPercentage >= 90.0 && boundaryDeviationMeters <= 1.0 && absVar <= 5.0) {
        classification = 'MINOR_DEVIATION';
        findings.push(`Minor boundary deviation detected (${boundaryDeviationMeters}m max offset, ${percentageVariance > 0 ? '+' : ''}${percentageVariance}% area variance).`);
      } else if (absVar > 15.0) {
        classification = 'MAJOR_SPATIAL_MISMATCH';
        findings.push(`Major spatial mismatch: physical volume exceeds registered title deed by ${percentageVariance > 0 ? '+' : ''}${percentageVariance}%.`);
        findings.push(`Geometry overlap: ${geometryOverlapPercentage}%, boundary deviation: ${boundaryDeviationMeters}m.`);
      } else if (absVar > 5.0) {
        classification = 'AREA_MISMATCH';
        findings.push(`Area discrepancy exceeds tolerance threshold (${percentageVariance > 0 ? '+' : ''}${percentageVariance}% variance).`);
      } else {
        classification = 'BOUNDARY_MISMATCH';
        findings.push(`Boundary mismatch detected: spatial footprint shifted (${geometryOverlapPercentage}% overlap, ${boundaryDeviationMeters}m deviation).`);
      }
    } else {
      // Area-only comparison (Polygon coordinates unavailable in cadastral record)
      const absVar = Math.abs(percentageVariance);

      if (absVar <= 2.0) {
        classification = 'MATCH';
        findings.push(`Physical area (${physicalAreaSqft.toLocaleString()} sq.ft) matches registered cadastral title (${registeredAreaSqft.toLocaleString()} sq.ft) within standard tolerance (±2%).`);
      } else if (absVar <= 5.0) {
        classification = 'MINOR_DEVIATION';
        findings.push(`Minor area difference of ${percentageVariance > 0 ? '+' : ''}${percentageVariance}% (${areaDifferenceSqft > 0 ? '+' : ''}${areaDifferenceSqft} sq.ft) observed.`);
      } else if (absVar > 15.0) {
        // Floor 03 / unauthorized additions
        classification = 'AREA_MISMATCH';
        findings.push(`Physical 3D model (${physicalAreaSqft.toLocaleString()} sq.ft) significantly exceeds registered deed (${registeredAreaSqft.toLocaleString()} sq.ft) by ${percentageVariance > 0 ? '+' : ''}${percentageVariance}%.`);
        findings.push(`Excess volumetric area: ${areaDifferenceSqft > 0 ? '+' : ''}${areaDifferenceSqft.toLocaleString()} sq.ft unapproved.`);
        findings.push('Exact 2D cadastral polygon coordinates are not recorded in this registry entry — geometry overlap comparison is Unavailable.');
      } else {
        classification = 'AREA_MISMATCH';
        findings.push(`Area mismatch: registered ${registeredAreaSqft.toLocaleString()} sq.ft vs physical ${physicalAreaSqft.toLocaleString()} sq.ft (${percentageVariance > 0 ? '+' : ''}${percentageVariance}%).`);
      }
    }

    return {
      ulpin: floor.ulpin.code,
      parcelId: parcel.id,
      buildingId: building.id,
      floorId: floor.id,
      floorLabel: floor.label,
      registeredGeometry,
      physicalGeometry,
      registeredAreaSqft,
      physicalAreaSqft,
      areaDifferenceSqft,
      percentageVariance,
      geometryOverlapPercentage,
      boundaryDeviationMeters,
      elevationInfo: {
        floorElevationM,
        floorHeightM,
        totalBuildingHeightM,
        registeredElevationM: registeredGeometry.elevationM ?? null,
        registeredHeightM: registeredGeometry.heightM ?? null,
        elevationDifferenceM: registeredGeometry.elevationM !== undefined
          ? Number((floorElevationM - registeredGeometry.elevationM).toFixed(2))
          : null,
      },
      classification,
      confidence: 'HIGH',
      evidenceSource: '3D_MODEL',
      provenance: cadastralProvenance,
      availability: {
        areaComparisonAvailable: true,
        geometryOverlapAvailable,
        boundaryComparisonAvailable,
        elevationComparisonAvailable: true,
      },
      findings,
    };
  }
}
