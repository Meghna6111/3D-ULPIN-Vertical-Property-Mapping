/**
 * ExternalCadastralProvider
 *
 * Future-ready placeholder for connecting to live government
 * cadastral APIs (e.g., Karnataka Bhoomi Portal, DILRMP, NLRMP, DoLR).
 *
 * IMPORTANT: This provider does NOT fabricate or simulate government data.
 * Until an actual API endpoint and credentials are configured, it returns
 * an explicit NOT_CONNECTED status for every query.
 */

import type {
  ICadastralProvider,
  ProviderStatus,
  CadastralParcelRecord,
  CadastralFloorRecord,
} from '../../types/cadastral';

export interface ExternalProviderConfig {
  /** API endpoint URL, e.g. "https://bhoomi.karnataka.gov.in/api/v1" */
  endpoint: string;
  /** API key or OAuth token */
  apiKey: string;
  /** Provider display name */
  name: string;
}

export class ExternalCadastralProvider implements ICadastralProvider {
  readonly id = 'external-cadastral-v1';
  readonly name: string;

  private config: ExternalProviderConfig | null;

  constructor(config?: ExternalProviderConfig) {
    this.config = config || null;
    this.name = config?.name || 'External Cadastral Provider (Not Connected)';
  }

  getStatus(): ProviderStatus {
    if (!this.config || !this.config.endpoint || !this.config.apiKey) {
      return 'NOT_CONNECTED';
    }
    // Future: perform actual health check against the configured endpoint
    return 'NOT_CONNECTED';
  }

  getParcelRecord(_parcelId: string): CadastralParcelRecord | null {
    // No live API connection exists — return null explicitly
    // Future: implement actual HTTP fetch against this.config.endpoint
    return null;
  }

  getFloorRecord(_ulpinOrFloorId: string): CadastralFloorRecord | null {
    // No live API connection exists — return null explicitly
    // Future: implement actual HTTP fetch against this.config.endpoint
    return null;
  }
}
