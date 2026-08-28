/**
 * PropertyStore — localStorage Persistence Layer
 *
 * Provides offline-first property persistence using browser localStorage.
 * Stores complete Parcel objects as JSON under a single key.
 *
 * Never crashes the application if storage is unavailable or data is malformed.
 */

import type { Parcel } from '@/types/property';

const STORAGE_KEY = 'ulpin-properties';

/**
 * Safely read the property map from localStorage.
 * Returns an empty record if data is missing, malformed, or storage is unavailable.
 */
function readStore(): Record<string, Parcel> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, Parcel>;
  } catch {
    return {};
  }
}

/**
 * Safely write the property map to localStorage.
 * Silently fails if storage is unavailable or quota is exceeded.
 */
function writeStore(store: Record<string, Parcel>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage unavailable or quota exceeded — fail silently
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Save or update a parcel in the store. */
export function save(parcel: Parcel): void {
  const store = readStore();
  store[parcel.id] = parcel;
  writeStore(store);

  // Async push to backend
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  fetch('http://localhost:8000/api/properties', {
    method: 'POST',
    headers,
    body: JSON.stringify(parcel),
  }).catch(() => {
    // Fail silently if backend is offline
  });
}

/** Retrieve a single parcel by ID. Returns null if not found. */
export function get(id: string): Parcel | null {
  const store = readStore();
  return store[id] ?? null;
}

/** Retrieve all saved parcels as an array. */
export function getAll(): Parcel[] {
  const store = readStore();
  return Object.values(store);
}

/** Delete a single parcel by ID. Returns true if it existed. */
export function remove(id: string): boolean {
  const store = readStore();
  if (!(id in store)) return false;
  delete store[id];
  writeStore(store);

  // Async delete from backend
  const headers: HeadersInit = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  fetch(`http://localhost:8000/api/properties/${id}`, {
    method: 'DELETE',
    headers,
  }).catch(() => {
    // Fail silently if backend is offline
  });

  return true;
}

/** Remove all saved parcels. */
export function clear(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — fail silently
  }
}

/** Sync all properties from the backend database into local storage. */
export async function sync(): Promise<Parcel[]> {
  try {
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch('http://localhost:8000/api/properties', {
      headers,
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const parcels = (await res.json()) as Parcel[];
      const store = readStore();
      for (const p of parcels) {
        if (p && p.id) {
          store[p.id] = p;
        }
      }
      writeStore(store);
      return Object.values(store);
    }
  } catch {
    // Fail silently if offline
  }
  return getAll();
}

export function getAuthToken(): string | null {
  return authToken;
}

export const PropertyStore = {
  save,
  get,
  getAll,
  remove,
  clear,
  sync,
  setAuthToken,
  getAuthToken,
} as const;
