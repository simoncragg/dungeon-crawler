import type { Hotspot } from "../types";

interface RoomHotspotsProps {
  hotspots?: Hotspot[];
  onHotspotClick: (hotspot: Hotspot) => void;
  disabled?: boolean;
  debug?: boolean;
}

export default function RoomHotspots({ hotspots, onHotspotClick, disabled, debug }: RoomHotspotsProps) {
  if (!hotspots || hotspots.length === 0) return null;

  return (
    <div className={`absolute inset-0 z-10 ${disabled && !debug ? "pointer-events-none" : "pointer-events-auto"}`}>
      {hotspots.map((hotspot, index) => (
        <button
          key={`${hotspot.direction || 'hotspot'}-${index}`}
          onClick={() => onHotspotClick(hotspot)}
          className={`absolute group overflow-hidden transition-all ${debug ? "border-2 border-dashed border-emerald-500/50 bg-emerald-500/10" : "border-none"}`}
          style={{
            top: hotspot.top,
            left: hotspot.left,
            width: hotspot.width,
            height: hotspot.height,
          }}
          aria-label={hotspot.label || `Move ${hotspot.direction}`}
          title={hotspot.label || `Move ${hotspot.direction}`}
          disabled={disabled && !debug}
        >
          {debug && (
            <div className="absolute top-1 left-1 bg-emerald-950/80 text-emerald-400 text-[10px] px-1 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap font-mono pointer-events-none">
              {hotspot.direction?.toUpperCase() || 'HOTSPOT'}
              {hotspot.label && `: ${hotspot.label}`}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
