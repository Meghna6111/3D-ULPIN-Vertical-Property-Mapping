/**
 * MockCadastralProvider
 *
 * Serves the existing demo cadastral dataset from sampleProperty.ts
 * through the ICadastralProvider interface. Every record carries explicit
 * MOCK_DATA provenance so the UI never misrepresents demo data as live
 * government cadastral records.
 */

import type {
  ICadastralProvider,
  ProviderStatus,
  CadastralParcelRecord,
  CadastralFloorRecord,
  DataProvenance,
} from '../../types/cadastral';
import { sampleParcel } from '../../data/sampleProperty';

function createMockProvenance(recordId: string): DataProvenance {
  return {
    source: 'Demo Cadastral Record',
    recordId,
    timestamp: '2024-03-15T09:30:00Z',
    provider: 'MockCadastralProvider v1.0',
    providerStatus: 'MOCK_DATA',
    confidence: 'MEDIUM',
    provenanceStatus: 'Simulated demo record — not sourced from a live government cadastral registry.',
    liveConnectionStatus: 'Not Connected',
    groundTruthAvailability: 'Not Available',
  };
}

export class MockCadastralProvider implements ICadastralProvider {
  readonly id = 'mock-cadastral-v1';
  readonly name = 'Demo Cadastral Provider (Prototype)';

  getStatus(): ProviderStatus {
    return 'MOCK_DATA';
  }

  getParcelRecord(parcelId: string): CadastralParcelRecord | null {
    if (parcelId !== sampleParcel.id) return null;

    const floors: CadastralFloorRecord[] = [];
    for (const building of sampleParcel.buildings) {
      for (const floor of building.floors) {
        floors.push({
          ulpin: floor.ulpin.code,
          floorId: floor.id,
          floorLabel: floor.label,
          levelIndex: floor.levelIndex,
          registeredAreaSqft: floor.areaSqft,
          registeredUseType: floor.useType,
          ownerName: floor.owner,
          verificationStatus: floor.verification,
          provenance: createMockProvenance(`${sampleParcel.id}/${floor.id}`),
        });
      }
    }

    return {
      parcelId: sampleParcel.id,
      parcelLabel: sampleParcel.label,
      registeredLandAreaSqft: sampleParcel.landAreaSqft,
      coordinates: {
        longitude: sampleParcel.longitude,
        latitude: sampleParcel.latitude,
      },
      floors,
      provenance: createMockProvenance(sampleParcel.id),
    };
  }

  getFloorRecord(ulpinOrFloorId: string): CadastralFloorRecord | null {
    for (const building of sampleParcel.buildings) {
      for (const floor of building.floors) {
        if (floor.ulpin.code === ulpinOrFloorId || floor.id === ulpinOrFloorId) {
          return {
            ulpin: floor.ulpin.code,
            floorId: floor.id,
            floorLabel: floor.label,
            levelIndex: floor.levelIndex,
            registeredAreaSqft: floor.areaSqft,
            registeredUseType: floor.useType,
            ownerName: floor.owner,
            verificationStatus: floor.verification,
            provenance: createMockProvenance(`${sampleParcel.id}/${floor.id}`),
          };
        }
      }
    }
    return null;
  }
}
