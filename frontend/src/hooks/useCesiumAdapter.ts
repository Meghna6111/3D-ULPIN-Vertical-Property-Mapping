import { useEffect, useRef } from 'react';
import { CesiumSceneAdapter } from '@/cesium/CesiumViewer';
import type { ICesiumAdapter } from '@/cesium/types';
import type { Parcel, SelectionState } from '@/types/property';

/**
 * Mounts a CesiumSceneAdapter into a container element and manages its
 * lifecycle. Returns a ref to the adapter so React components can call
 * select/flyTo/etc. without importing Cesium.
 */
export function useCesiumAdapter(
  containerRef: React.RefObject<HTMLDivElement | null>,
  parcel: Parcel,
  onSelection: (selection: SelectionState) => void,
) {
  const adapterRef = useRef<ICesiumAdapter | null>(null);

  // Initialize Cesium viewer once
  useEffect(() => {
    if (!containerRef.current) return;

    const adapter = new CesiumSceneAdapter(onSelection);
    adapterRef.current = adapter;

    adapter
      .init(containerRef.current)
      .then(() => {
        adapter.setParcel(parcel);
      })
      .catch((err) => {
        console.error('Cesium init failed:', err);
      });

    return () => {
      adapter.dispose();
      adapterRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Cesium scene whenever the active parcel changes
  useEffect(() => {
    if (adapterRef.current) {
      adapterRef.current.setParcel(parcel);
    }
  }, [parcel]);

  return adapterRef;
}
