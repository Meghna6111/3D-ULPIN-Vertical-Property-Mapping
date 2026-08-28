import { useMemo, useState } from 'react';
import type { Parcel, SearchEntry } from '@/types/property';
import { sampleParcel, buildSearchIndex, sampleSearchIndex } from '@/data/sampleProperty';

/**
 * Local search over all available properties.
 * Supports searching by Parcel ID, Building ID, Floor ID, ULPIN code, floor name, and keywords.
 *
 * Phase 3: Extended to search across demo + all saved/generated parcels.
 */
export function usePropertySearch(savedParcels?: Parcel[]) {
  const [query, setQuery] = useState('');

  // Build a unified search index: demo parcel + all saved parcels
  const searchIndex = useMemo<SearchEntry[]>(() => {
    // Always include the demo parcel index
    const indices: SearchEntry[] = [...sampleSearchIndex];

    // Add entries for each saved parcel (skip demo to avoid duplicates)
    if (savedParcels && savedParcels.length > 0) {
      for (const parcel of savedParcels) {
        if (parcel.id === sampleParcel.id) continue;
        const parcelEntries = buildSearchIndex(parcel);
        indices.push(...parcelEntries);
      }
    }

    return indices;
  }, [savedParcels]);

  const results = useMemo<SearchEntry[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];

    return searchIndex.filter((entry) => {
      const matchLabel = entry.displayLabel.toLowerCase().includes(q);
      const matchId = entry.id.toLowerCase().includes(q);
      const matchParcel = entry.parcelId.toLowerCase().includes(q);
      const matchBuilding = entry.buildingId ? entry.buildingId.toLowerCase().includes(q) : false;
      const matchFloor = entry.floorId ? entry.floorId.toLowerCase().includes(q) : false;
      const matchUlpin = entry.ulpin ? entry.ulpin.toLowerCase().includes(q) : false;
      const matchSecondary = entry.secondaryLabel.toLowerCase().includes(q);

      return (
        matchLabel ||
        matchId ||
        matchParcel ||
        matchBuilding ||
        matchFloor ||
        matchUlpin ||
        matchSecondary
      );
    });
  }, [query, searchIndex]);

  return { query, setQuery, results };
}
