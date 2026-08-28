import * as Cesium from 'cesium';

/**
 * Encapsulates all camera manipulation for the 3D viewer.
 * Positions camera with metric offsets for consistent, hero-scale 3D viewing.
 */
export class CameraController {
  constructor(private viewer: Cesium.Viewer) {}

  /** Frame the full sample parcel/building from an isometric 3D oblique perspective. */
  frameParcel(lon: number, lat: number, maxFloorHeight: number): void {
    const latRad = Cesium.Math.toRadians(lat);
    const mToDegLon = 1 / (111320 * Math.cos(latRad));
    const mToDegLat = 1 / 110574;

    // Position camera ~55m South-West of the building and ~42m in elevation
    const destination = Cesium.Cartesian3.fromDegrees(
      lon - 42 * mToDegLon,
      lat - 48 * mToDegLat,
      45,
    );

    this.viewer.camera.flyTo({
      destination,
      orientation: {
        heading: Cesium.Math.toRadians(40),
        pitch: Cesium.Math.toRadians(-24),
        roll: 0,
      },
      duration: 1.2,
    });
  }

  /** Move camera closer to a specific floor level for inspection. */
  flyToFloor(lon: number, lat: number, floorCenterZ: number): void {
    const latRad = Cesium.Math.toRadians(lat);
    const mToDegLon = 1 / (111320 * Math.cos(latRad));
    const mToDegLat = 1 / 110574;

    const destination = Cesium.Cartesian3.fromDegrees(
      lon - 30 * mToDegLon,
      lat - 34 * mToDegLat,
      Math.max(floorCenterZ + 18, 22),
    );

    this.viewer.camera.flyTo({
      destination,
      orientation: {
        heading: Cesium.Math.toRadians(40),
        pitch: Cesium.Math.toRadians(-18),
        roll: 0,
      },
      duration: 0.8,
    });
  }

  /** Toggle between 3D perspective and 2D top-down map. */
  setMapMode(mode: '3d' | '2d', lon: number, lat: number): void {
    if (mode === '2d') {
      this.viewer.scene.morphTo2D(0.8);
    } else {
      this.viewer.scene.morphTo3D(0.8);
    }
  }

  resetCamera(lon: number, lat: number, maxFloorHeight: number): void {
    this.frameParcel(lon, lat, maxFloorHeight);
  }
}
