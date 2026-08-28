/**
 * CadastralRegistry
 *
 * Central registry that manages cadastral data providers.
 * The verification engine queries the registry instead of directly
 * importing sampleProperty.ts.
 *
 * Provider resolution order:
 *  1. ExternalCadastralProvider (if connected)
 *  2. MockCadastralProvider (fallback)
 */

import type {
  ICadastralProvider,
  ProviderStatus,
  CadastralFloorRecord,
  CadastralParcelRecord,
} from '../../types/cadastral';
import { MockCadastralProvider } from './MockCadastralProvider';
import { ExternalCadastralProvider } from './ExternalCadastralProvider';
import { BackendCadastralProvider } from './BackendCadastralProvider';

export interface RegistryStatus {
  activeProviderId: string;
  activeProviderName: string;
  activeProviderStatus: ProviderStatus;
  externalProviderStatus: ProviderStatus;
  backendProviderStatus: ProviderStatus;
  mockProviderStatus: ProviderStatus;
}

class CadastralRegistryImpl {
  private mockProvider: MockCadastralProvider;
  private externalProvider: ExternalCadastralProvider;
  private backendProvider: BackendCadastralProvider;

  constructor() {
    this.mockProvider = new MockCadastralProvider();
    this.externalProvider = new ExternalCadastralProvider();
    this.backendProvider = new BackendCadastralProvider();
  }

  /** Returns the best available provider (external -> backend -> mock) */
  private getActiveProvider(): ICadastralProvider {
    if (this.externalProvider.getStatus() === 'EXTERNAL_CONNECTED') {
      return this.externalProvider;
    }
    if (this.backendProvider.getStatus() === 'EXTERNAL_CONNECTED') {
      return this.backendProvider;
    }
    return this.mockProvider;
  }

  getStatus(): RegistryStatus {
    const active = this.getActiveProvider();
    return {
      activeProviderId: active.id,
      activeProviderName: active.name,
      activeProviderStatus: active.getStatus(),
      externalProviderStatus: this.externalProvider.getStatus(),
      backendProviderStatus: this.backendProvider.getStatus(),
      mockProviderStatus: this.mockProvider.getStatus(),
    };
  }

  getParcelRecord(parcelId: string): CadastralParcelRecord | null {
    const active = this.getActiveProvider();
    const result = active.getParcelRecord(parcelId);
    if (result) return result;

    // Try backend if not active
    if (active !== this.backendProvider) {
      const backendResult = this.backendProvider.getParcelRecord(parcelId);
      if (backendResult) return backendResult;
    }

    // Fallback to mock if external/backend returned null
    if (active !== this.mockProvider) {
      return this.mockProvider.getParcelRecord(parcelId);
    }
    return null;
  }

  getFloorRecord(ulpinOrFloorId: string): CadastralFloorRecord | null {
    const active = this.getActiveProvider();
    const result = active.getFloorRecord(ulpinOrFloorId);
    if (result) return result;

    // Try backend if not active
    if (active !== this.backendProvider) {
      const backendResult = this.backendProvider.getFloorRecord(ulpinOrFloorId);
      if (backendResult) return backendResult;
    }

    if (active !== this.mockProvider) {
      return this.mockProvider.getFloorRecord(ulpinOrFloorId);
    }
    return null;
  }

  // Expose async fetches to support background verification syncs
  async fetchParcelRecordAsync(parcelId: string): Promise<CadastralParcelRecord | null> {
    return await this.backendProvider.fetchParcelRecordAsync(parcelId);
  }

  async fetchFloorRecordAsync(ulpinOrFloorId: string): Promise<CadastralFloorRecord | null> {
    return await this.backendProvider.fetchFloorRecordAsync(ulpinOrFloorId);
  }
}

/** Singleton instance */
export const CadastralRegistry = new CadastralRegistryImpl();
