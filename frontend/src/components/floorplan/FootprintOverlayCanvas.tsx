import type { DetectedFootprint } from '@/types/floorplan';

interface FootprintOverlayCanvasProps {
  imageUrl: string;
  footprint: DetectedFootprint | null;
  footprintWidthM: number;
  footprintDepthM: number;
}

export function FootprintOverlayCanvas({
  imageUrl,
  footprint,
  footprintWidthM,
  footprintDepthM,
}: FootprintOverlayCanvasProps) {
  if (!footprint) {
    return (
      <div className="relative w-full h-64 rounded-lg bg-base-950/80 border border-white/[0.06] flex items-center justify-center overflow-hidden">
        <img
          src={imageUrl}
          alt="Floorplan preview"
          className="max-h-full max-w-full object-contain opacity-80"
        />
      </div>
    );
  }

  // Generate SVG polygon points string in percentage coordinates (0..100)
  const svgPoints = footprint.polygon
    .map((pt) => `${(pt.x * 100).toFixed(2)},${(pt.y * 100).toFixed(2)}`)
    .join(' ');

  return (
    <div className="relative w-full h-72 rounded-lg bg-base-950/90 border border-white/[0.08] flex items-center justify-center overflow-hidden p-2">
      {/* Background floorplan image */}
      <div className="relative max-h-full max-w-full flex items-center justify-center">
        <img
          src={imageUrl}
          alt="Floorplan preview with detected footprint"
          className="max-h-64 max-w-full object-contain select-none opacity-85 filter contrast-125"
        />

        {/* Vector Footprint Overlay */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Shaded Footprint Polygon */}
          <polygon
            points={svgPoints}
            className="fill-accent-500/25 stroke-accent-400"
            strokeWidth="1.2"
            strokeDasharray="2 1"
          />

          {/* Vertex Pins */}
          {footprint.polygon.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x * 100}
              cy={pt.y * 100}
              r="1.6"
              className="fill-accent-300 stroke-base-950"
              strokeWidth="0.6"
            />
          ))}
        </svg>

        {/* Dimension badges */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-base-900/90 border border-accent-500/30 text-[10px] font-mono text-accent-300 backdrop-blur-sm shadow-panel">
          W: {footprintWidthM.toFixed(1)}m × D: {footprintDepthM.toFixed(1)}m
        </div>
      </div>
    </div>
  );
}
