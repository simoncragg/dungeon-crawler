import { ITEMS } from "../data/gameData";
import type { Hotspot } from "../types";

interface RoomHotspotsProps {
  hotspots?: Hotspot[];
  onHotspotClick: (hotspot: Hotspot) => void;
  disabled?: boolean;
  debug?: boolean;
  itemsRevealed?: boolean;
  isTransitioning?: boolean;
}

export default function RoomHotspots({ hotspots, onHotspotClick, disabled, debug, itemsRevealed, isTransitioning }: RoomHotspotsProps) {
  if (!hotspots || hotspots.length === 0) return null;

  const fadeClass = isTransitioning ? "duration-500" : "duration-300";
  const animationClass = isTransitioning ? "animate-hotspot-fade" : "";

  return (
    <div className={`absolute inset-0 z-10 transition-opacity ${fadeClass} ${disabled && !isTransitioning && !debug ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"}`}>
      {hotspots.map((hotspot) => (
        <button
          key={hotspot.type === "item" ? hotspot.itemId : hotspot.direction}
          onClick={() => onHotspotClick(hotspot)}
          className={`absolute group transition-opacity ${animationClass} ${debug ? "border-2 border-dashed border-emerald-500/50 bg-emerald-500/10" : "border-none"}`}
          style={{
            top: hotspot.top,
            left: hotspot.left,
            width: hotspot.width,
            height: hotspot.height,
          }}
          aria-label={hotspot.label || (hotspot.type === "item" ? `Take ${ITEMS[hotspot.itemId]?.name}` : `Move ${hotspot.direction}`)}
          title={hotspot.label || (hotspot.type === "item" ? `Take ${ITEMS[hotspot.itemId]?.name}` : `Move ${hotspot.direction}`)}
          disabled={disabled && !debug}
        >
          {hotspot.type === "item" && ITEMS[hotspot.itemId]?.image && (() => {
            const item = ITEMS[hotspot.itemId];
            const glow = item.glow;
            const glowStyles = glow ? {
              "--glow-color": glow.color,
              "--glow-offset-y": glow.offsetY || "0px",
              "--glow-blur-sm": glow.blur || "15px",
              "--glow-blur-lg": `calc(${glow.blur || "15px"} * 1.4)`,
            } as React.CSSProperties : {};

            return (
              <div
                className={`w-full h-full transition-all duration-200 ${itemsRevealed ? 'opacity-100 scale-100 blur-none' : 'opacity-0 scale-95 blur-sm'}`}
                style={{
                  pointerEvents: itemsRevealed ? 'auto' : 'none',
                  transform: `
                    ${hotspot.rotation ? `rotate(${hotspot.rotation})` : ""}
                    ${hotspot.scale ? `scale(${hotspot.scale})` : ""}
                  `.trim() || undefined,
                } as React.CSSProperties}
              >
                <div
                  className={`w-full h-full ${glow ? (glow.pulse ? `glow-pulse-${glow.intensity || 1}` : `glow-${glow.intensity || 1}`) : ''}`}
                  style={{
                    ...glowStyles,
                    "--glow-brightness": hotspot.brightness ?? 1,
                    filter: !glow ? `brightness(${hotspot.brightness ?? 1})` : undefined
                  } as React.CSSProperties}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain pointer-events-none drop-shadow-lg"
                  />
                </div>
              </div>
            );
          })()}

          {debug && (
            <div className="absolute top-1 left-1 bg-emerald-950/80 text-emerald-400 text-[10px] px-1 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap font-mono pointer-events-none">
              {hotspot.type === "door" ? hotspot.direction?.toUpperCase() : `ITEM: ${hotspot.itemId}`}
              {hotspot.label && `: ${hotspot.label}`}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
