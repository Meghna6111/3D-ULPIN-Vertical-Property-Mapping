import type { Parcel, SelectionState } from '@/types/property';

/** Resolves the currently selected floor object from the selection state. */
export function resolveSelectedFloor(parcel: Parcel, sel: SelectionState) {
  if (sel.kind !== 'floor' || !sel.buildingId || !sel.floorId) return null;
  const building = parcel.buildings.find((b) => b.id === sel.buildingId);
  if (!building) return null;
  return building.floors.find((f) => f.id === sel.floorId) ?? null;
}

/** Resolves the currently selected building object. */
export function resolveSelectedBuilding(parcel: Parcel, sel: SelectionState) {
  if ((sel.kind !== 'building' && sel.kind !== 'floor') || !sel.buildingId) return null;
  return parcel.buildings.find((b) => b.id === sel.buildingId) ?? null;
}
