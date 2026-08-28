/**
 * Deterministic Unit Tests for 3D Geometry Verification Engine
 *
 * Test Cases:
 *  1. Exact geometry match (overlap >= 98%, boundary deviation <= 0.3m, variance <= 2%)
 *  2. Small boundary deviation (overlap >= 90%, boundary deviation <= 1.0m)
 *  3. Major area mismatch (Floor 03 discrepancy: 2,809 sq.ft vs 460 sq.ft -> +510.65%, +2,349 sq.ft)
 *  4. Missing cadastral geometry (polygon unavailable -> returns INSUFFICIENT_GEOMETRY or AREA_MISMATCH with overlap = null)
 *  5. Zero or invalid geometry dimensions -> returns INSUFFICIENT_GEOMETRY
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  GeometryVerificationEngine,
  calculatePolygonArea,
  calculatePolygonPerimeter,
  calculatePolygonBounds,
  clipPolygon,
  calculateBoundaryDeviation,
  createRectangularPolygon,
} from '../GeometryVerificationEngine.ts';

import type { Floor, Building, Parcel } from '../../../types/property.ts';
import type { CadastralGeometry } from '../../../types/geometryVerification.ts';


// Mock base entities
const mockParcel: Parcel = {
  id: 'KA-BLR-DEMO-001',
  label: 'Sample Parcel — Demo Cadastre',
  landAreaSqft: 2400,
  status: 'verified',
  longitude: 77.5946,
  latitude: 12.9716,
  buildings: [],
};

const mockBuilding: Building = {
  id: 'BLD-A-001',
  label: 'Building A',
  totalFloors: 5,
  basementCount: 1,
  status: 'active',
  widthM: 18.0,
  depthM: 14.5,
  floors: [],
};

const mockFloor01: Floor = {
  id: 'BLD-A-001-F01',
  label: 'Floor 01',
  kind: 'above',
  levelIndex: 1,
  areaSqft: 480,
  owner: 'Dr. Ramesh Rao',
  status: 'verified',
  verification: 'verified',
  useType: 'Commercial Office Space',
  ulpin: {
    code: '12A34B56C78D90-A001',
    floorSegment: '001',
    level: 'Above Ground',
  },
};

const mockFloor03: Floor = {
  id: 'BLD-A-001-F03',
  label: 'Floor 03',
  kind: 'above',
  levelIndex: 3,
  areaSqft: 460,
  owner: 'Smt. Lakshmi Sundaram',
  status: 'violation',
  verification: 'mismatch',
  useType: 'Residential Apartment (Unauthorized Partition)',
  ulpin: {
    code: '12A34B56C78D90-A003',
    floorSegment: '003',
    level: 'Above Ground',
  },
};

describe('3D Geometry Verification Engine — Deterministic Unit Tests', () => {
  describe('Geometric Utility Functions', () => {
    it('calculates polygon area correctly using Shoelace formula', () => {
      const rect = createRectangularPolygon(18.0, 14.5);
      const area = calculatePolygonArea(rect);
      assert.equal(area, 261.0); // 18.0 * 14.5 = 261 m²
    });

    it('calculates polygon perimeter correctly', () => {
      const rect = createRectangularPolygon(18.0, 14.5);
      const perimeter = calculatePolygonPerimeter(rect);
      assert.equal(perimeter, 65.0); // 2 * (18 + 14.5) = 65 m
    });

    it('calculates axis-aligned bounds correctly', () => {
      const rect = createRectangularPolygon(18.0, 14.5);
      const bounds = calculatePolygonBounds(rect);
      assert.equal(bounds.widthM, 18.0);
      assert.equal(bounds.depthM, 14.5);
      assert.equal(bounds.minX, -9.0);
      assert.equal(bounds.maxX, 9.0);
      assert.equal(bounds.minY, -7.25);
      assert.equal(bounds.maxY, 7.25);
    });

    it('clips overlapping polygons correctly', () => {
      const polyA = createRectangularPolygon(10, 10, 0, 0); // [-5, 5] x [-5, 5] = 100 m²
      const polyB = createRectangularPolygon(10, 10, 5, 0); // [0, 10] x [-5, 5]
      const intersection = clipPolygon(polyA, polyB);
      const interArea = calculatePolygonArea(intersection);
      assert.equal(interArea, 50.0); // 5 x 10 = 50 m²
    });

    it('calculates boundary deviation in meters', () => {
      const polyA = createRectangularPolygon(10, 10, 0, 0);
      const polyB = createRectangularPolygon(10, 10, 0.5, 0); // 0.5m offset
      const dev = calculateBoundaryDeviation(polyA, polyB);
      assert.equal(dev, 0.5);
    });
  });

  describe('Test Case 1: Exact Geometry Match', () => {
    it('produces MATCH when cadastral polygon aligns with 3D model within 2%', () => {
      const cadastralPolygon = createRectangularPolygon(18.0, 14.5); // Exact 18m x 14.5m
      const customCadastre: CadastralGeometry = {
        polygon: cadastralPolygon,
        areaSqft: 2809,
        areaSqM: 261.0,
        hasPolygon: true,
      };

      const result = GeometryVerificationEngine.verifyFloorGeometry(
        mockFloor01,
        mockBuilding,
        mockParcel,
        customCadastre,
      );

      assert.equal(result.classification, 'MATCH');
      assert.equal(result.percentageVariance, 0);
      assert.equal(result.geometryOverlapPercentage, 100.0);
      assert.equal(result.boundaryDeviationMeters, 0.0);
      assert.equal(result.availability.geometryOverlapAvailable, true);
    });
  });

  describe('Test Case 2: Small Boundary Deviation', () => {
    it('produces MINOR_DEVIATION when boundary offset is <= 1.0m and variance <= 5%', () => {
      // 0.4m shift to the east
      const shiftedPolygon = createRectangularPolygon(18.0, 14.5, 0.4, 0);
      const customCadastre: CadastralGeometry = {
        polygon: shiftedPolygon,
        areaSqft: 2809,
        areaSqM: 261.0,
        hasPolygon: true,
      };

      const result = GeometryVerificationEngine.verifyFloorGeometry(
        mockFloor01,
        mockBuilding,
        mockParcel,
        customCadastre,
      );

      assert.equal(result.classification, 'MINOR_DEVIATION');
      assert.ok(result.geometryOverlapPercentage! >= 90.0);
      assert.ok(result.boundaryDeviationMeters! <= 1.0);
    });
  });

  describe('Test Case 3: Major Area Mismatch (Floor 03 Prototype Discrepancy)', () => {
    it('correctly verifies Floor 03 discrepancy (+2,349 sq.ft / +510.65%)', () => {
      const result = GeometryVerificationEngine.verifyFloorGeometry(
        mockFloor03,
        mockBuilding,
        mockParcel,
      );

      assert.equal(result.registeredAreaSqft, 460);
      assert.equal(result.physicalAreaSqft, 2809);
      assert.equal(result.areaDifferenceSqft, 2349);
      assert.equal(result.percentageVariance, 510.65);
      assert.equal(result.classification, 'AREA_MISMATCH');
      assert.equal(result.evidenceSource, '3D_MODEL');
      assert.equal(result.confidence, 'HIGH');
      assert.equal(result.availability.geometryOverlapAvailable, false);
      assert.equal(result.geometryOverlapPercentage, null);
      assert.equal(result.boundaryDeviationMeters, null);
    });
  });

  describe('Test Case 4: Missing Geometry / Area Only Record', () => {
    it('handles cadastral record without polygon coordinates gracefully', () => {
      const customCadastre: CadastralGeometry = {
        areaSqft: 2809,
        areaSqM: 261.0,
        hasPolygon: false,
      };

      const result = GeometryVerificationEngine.verifyFloorGeometry(
        mockFloor01,
        mockBuilding,
        mockParcel,
        customCadastre,
      );

      assert.equal(result.classification, 'MATCH');
      assert.equal(result.availability.geometryOverlapAvailable, false);
      assert.equal(result.geometryOverlapPercentage, null);
      assert.equal(result.boundaryDeviationMeters, null);
    });
  });

  describe('Test Case 5: Zero or Invalid Geometry', () => {
    it('returns INSUFFICIENT_GEOMETRY when building dimensions are zero or invalid', () => {
      const invalidBuilding: Building = {
        ...mockBuilding,
        widthM: 0,
        depthM: 0,
      };

      const result = GeometryVerificationEngine.verifyFloorGeometry(
        mockFloor01,
        invalidBuilding,
        mockParcel,
      );

      assert.equal(result.classification, 'INSUFFICIENT_GEOMETRY');
      assert.ok(result.findings.some((f) => f.includes('Insufficient or zero')));
    });

    it('returns INSUFFICIENT_GEOMETRY when registered area is zero', () => {
      const customCadastre: CadastralGeometry = {
        areaSqft: 0,
        areaSqM: 0,
        hasPolygon: false,
      };

      const result = GeometryVerificationEngine.verifyFloorGeometry(
        mockFloor01,
        mockBuilding,
        mockParcel,
        customCadastre,
      );

      assert.equal(result.classification, 'INSUFFICIENT_GEOMETRY');
    });
  });
});
