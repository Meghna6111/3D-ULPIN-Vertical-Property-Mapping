import type {
  ICadastralProvider,
  ProviderStatus,
  CadastralParcelRecord,
  CadastralFloorRecord,
} from '@/types/cadastral';

import { PropertyStore } from '../storage/PropertyStore';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';

export class BackendCadastralProvider implements ICadastralProvider {
  readonly id = 'backend-cadastral-v1';
  readonly name = 'Backend Property Store Provider';

  private status: ProviderStatus = 'NOT_CONNECTED';
  private cache: Map<string, CadastralParcelRecord> = new Map();

  constructor() {
    this.checkHealth();
  }

  private async checkHealth() {
    try {
      const headers: HeadersInit = {};
      const token = PropertyStore.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE_URL}/api/health`, {
        headers,
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        this.status = 'EXTERNAL_CONNECTED';
      } else {
        this.status = 'NOT_CONNECTED';
      }
    } catch {
      this.status = 'NOT_CONNECTED';
    }
  }

  getStatus(): ProviderStatus {
    // Return cached/current connection state
    return this.status;
  }

  getParcelRecord(parcelId: string): CadastralParcelRecord | null {
    // Return from cache if we already loaded it asynchronously
    return this.cache.get(parcelId) ?? null;
  }

  getFloorRecord(ulpinOrFloorId: string): CadastralFloorRecord | null {
    // Lookup inside cached parcels
    for (const record of this.cache.values()) {
      const match = record.floors.find(
        (f) => f.ulpin === ulpinOrFloorId || f.floorId === ulpinOrFloorId,
      );
      if (match) return match;
    }
    return null;
  }

  async fetchParcelRecordAsync(parcelId: string): Promise<CadastralParcelRecord | null> {
    try {
      const headers: HeadersInit = {};
      const token = PropertyStore.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE_URL}/api/cadastral/${parcelId}`, {
        headers,
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = (await res.json()) as CadastralParcelRecord;
      this.cache.set(parcelId, data);
      this.status = 'EXTERNAL_CONNECTED';
      return data;
    } catch (err) {
      console.warn('[BackendCadastralProvider] Failed to fetch parcel record:', err);
      // Fallback: check health to update status if backend went offline
      this.checkHealth();
      return null;
    }
  }

  async fetchFloorRecordAsync(ulpinOrFloorId: string): Promise<CadastralFloorRecord | null> {
    // Scan local cache first
    const cached = this.getFloorRecord(ulpinOrFloorId);
    if (cached) return cached;

    // If not in cache, fetch all parcels from backend to see if we can resolve it
    try {
      const headers: HeadersInit = {};
      const token = PropertyStore.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE_URL}/api/properties`, {
        headers,
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return null;
      const parcels = (await res.json()) as any[];
      
      for (const p of parcels) {
        if (p.id) {
          await this.fetchParcelRecordAsync(p.id);
        }
      }
      return this.getFloorRecord(ulpinOrFloorId);
    } catch {
      return null;
    }
  }
}
