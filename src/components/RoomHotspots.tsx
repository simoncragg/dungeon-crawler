import { ITEMS } from "../data/gameData";
import { getPreloadedUrl } from "../utils/assetLoader";
import type { Hotspot, ItemHotspot } from "../types";

interface RoomHotspotsProps {
  hotspots?: Hotspot[];
  onHotspotClick: (hotspot: Hotspot) => void;
  disabled?: boolean;
  debug?: boolean;
  itemsRevealed?: boolean;
  isTransitioning?: boolean;
  recentDropId?: string | null;
  isDropAnimating?: boolean;
}

const getHotspotLabel = (hotspot: Hotspot): string | undefined => {
  switch (hotspot.type) {
    case "door":
      return hotspot.label ? `Head ${hotspot.direction} through ${hotspot.label}` : `Exit ${hotspot.direction}`;
    case "item":
      return hotspot.label || `Take ${ITEMS[hotspot.itemId]?.name}`;
  }
};

export default function RoomHotspots({ hotspots, onHotspotClick, disabled, debug, itemsRevealed, isTransitioning, recentDropId, isDropAnimating }: RoomHotspotsProps) {
  if (!hotspots || hotspots.length === 0) return null;

  const fadeClass = isTransitioning ? "duration-500" : "duration-300";
  const animationClass = isTransitioning ? "animate-hotspot-fade" : "";

  return (
    <div className={`absolute inset-0 z-10 transition-opacity ${fadeClass} ${disabled && !isTransitioning && !debug ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"}`}>
      {hotspots.map((hotspot) => {
        const displayLabel = getHotspotLabel(hotspot);
        const isItem = hotspot.type === "item";
        const item = isItem ? ITEMS[hotspot.itemId] : null;
        const itemHotspot = isItem ? (hotspot as ItemHotspot) : null;
        const isRecentDropId = isItem && hotspot.itemId === recentDropId;

        // Determine animation class
        let itemAnimClass = "";
        if (isRecentDropId && isDropAnimating) {
          itemAnimClass = "animate-float-up z-50";
        } else if (isRecentDropId) {
          itemAnimClass = "animate-idle";
        }

        // Glow Logic
        const activeGlow = itemHotspot?.glow || item?.glow;
        const glowStyles = activeGlow
          ? ({
            "--glow-color": activeGlow.color,
            "--glow-offset-y": activeGlow.offsetY || "0px",
            "--glow-blur-sm": activeGlow.blur || "15px",
            "--glow-blur-lg": activeGlow.blur ? `calc(${activeGlow.blur} * 1.4)` : "25px",
          } as React.CSSProperties)
          : {};

        return (
          <button
            key={isItem ? hotspot.itemId : hotspot.direction}
            onClick={() => onHotspotClick(hotspot)}
            className={`absolute group transition-opacity ${animationClass} ${itemAnimClass} ${debug ? "border-2 border-dashed border-emerald-500/50 bg-emerald-500/10" : "border-none"} ${isItem && !itemsRevealed && !debug && !isRecentDropId ? "pointer-events-none" : ""}`}
            style={{
              top: hotspot.top,
              left: hotspot.left,
              width: hotspot.width,
              height: hotspot.height,
            }}
            aria-label={displayLabel}
            title={debug ? displayLabel : undefined}
            disabled={disabled && !debug && !isRecentDropId}
          >
            {item?.image && (
              <div
                className={`w-full h-full transition-all duration-200 ${itemsRevealed || isRecentDropId ? "opacity-100 scale-100 blur-none" : "opacity-0 scale-95 blur-sm"}`}
                style={
                  {
                    pointerEvents: itemsRevealed || isRecentDropId ? "auto" : "none",
                    transform: `
                    ${itemHotspot?.rotation ? `rotate(${itemHotspot.rotation})` : ""}
                    ${hotspot.scale ? `scale(${hotspot.scale})` : ""}
                  `.trim() || undefined,
                  } as React.CSSProperties
                }
              >
                <div
                  className={`w-full h-full ${isRecentDropId && activeGlow ? "glow-pulse-2" : activeGlow ? (activeGlow.pulse ? `glow-pulse-${activeGlow.intensity || 1}` : `glow-${activeGlow.intensity || 1}`) : ""}`}
                  style={
                    {
                      ...glowStyles,
                      "--glow-brightness": itemHotspot?.brightness ?? 1,
                      filter: !activeGlow ? `brightness(${itemHotspot?.brightness ?? 1})` : undefined,
                    } as React.CSSProperties
                  }
                >
                  <img src={getPreloadedUrl(item.image)} alt={item.name} className="w-full h-full object-contain pointer-events-none drop-shadow-lg" />
                </div>
              </div>
            )}

            {debug && (
              <div className="absolute top-1 left-1 bg-emerald-950/80 text-emerald-400 text-[10px] px-1 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap font-mono pointer-events-none">
                {hotspot.type === "door" ? hotspot.direction?.toUpperCase() : `ITEM: ${hotspot.itemId}`}
                {hotspot.label && `: ${hotspot.label}`}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
