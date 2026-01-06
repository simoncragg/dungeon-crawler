import { useGameStore } from "../store/useGameStore";
import { ITEMS } from "../data/gameData";
import { getPreloadedUrl } from "../utils/assetLoader";
import type { Hotspot, ItemHotspot, Direction } from "../types";

const getHotspotLabel = (hotspot: Hotspot): string | undefined => {
  switch (hotspot.type) {
    case "door":
      return hotspot.label ? `Head ${hotspot.direction} through ${hotspot.label}` : `Exit ${hotspot.direction}`;
    case "item":
      return hotspot.label || `Take ${ITEMS[hotspot.itemId]?.name}`;
  }
};

interface RoomHotspotsProps {
  handleMove: (dir: Direction) => void;
  takeItem: (id: string) => void;
  handleDropOnHotspot: (e: React.DragEvent, hotspot: Hotspot) => void;
}

export default function RoomHotspots({
  handleMove,
  takeItem,
  handleDropOnHotspot
}: RoomHotspotsProps) {
  const { gameState } = useGameStore();
  const {
    rooms,
    currentRoomId,
    perceivedRoomId,
    isWalking,
    isShutterActive,
    activeTransitionVideo,
    isDebugMode: debug,
    recentDropId,
    isDropAnimating,
    latestDrop,
    unlockedDirection,
    isQuestLogOpen,
    combat
  } = gameState;

  const visibleRoom = rooms[perceivedRoomId] || rooms[currentRoomId];

  const inCombat = combat?.inCombat;
  const hotspots = visibleRoom.hotspots?.filter((h: Hotspot) => h.type === "door" || visibleRoom.items.includes(h.itemId));
  const disabled = isWalking || isShutterActive || inCombat || isQuestLogOpen;
  const isTransitioning = !!activeTransitionVideo || isShutterActive;
  const isEnemyDrop = recentDropId === latestDrop?.itemId;

  if (!hotspots || hotspots.length === 0) return null;

  return (
    <div className={`absolute inset-0 z-10 ${disabled && !isTransitioning && !debug ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"}`}>
      {hotspots.map((hotspot) => {
        const displayLabel = getHotspotLabel(hotspot);
        const isItem = hotspot.type === "item";
        const item = isItem ? ITEMS[hotspot.itemId] : null;
        const itemHotspot = isItem ? (hotspot as ItemHotspot) : null;
        const isRecentDropId = isItem && hotspot.itemId === recentDropId;


        let itemAnimClass = "";
        if (isRecentDropId && isDropAnimating) {
          itemAnimClass = "animate-float-up z-50";
        } else if (isRecentDropId && isEnemyDrop) {
          itemAnimClass = "animate-idle";
        }

        const isUnlockedHighlight = hotspot.type === "door" && hotspot.direction === unlockedDirection;


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
            onClick={() => {
              if (hotspot.type === "door") {
                handleMove(hotspot.direction);
              }
              if (hotspot.type === "item") takeItem(hotspot.itemId);
            }}
            className={`absolute group ${itemAnimClass} ${debug ? "border-2 border-dashed border-emerald-500/50 bg-emerald-500/10" : "border-none"}`}
            style={{
              top: hotspot.top,
              left: hotspot.left,
              width: hotspot.width,
              height: hotspot.height,
            }}
            aria-label={displayLabel}
            title={debug ? displayLabel : undefined}
            disabled={disabled && !debug && !isRecentDropId}
            onDragOver={(e) => {
              if (hotspot.type === "door") {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }
            }}
            onDrop={(e) => {
              if (hotspot.type === "door") {
                e.preventDefault();
                handleDropOnHotspot?.(e, hotspot);
              }
            }}
          >
            {item?.image && (
              <div
                className={`w-full h-full opacity-100 scale-100 blur-none 
                ${isDropAnimating && isRecentDropId ? "transition-all duration-200" : "transition-none"}`}
                style={
                  {
                    pointerEvents: !isTransitioning ? "auto" : "none",
                    opacity: isTransitioning ? 0 : 1,
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

            {isUnlockedHighlight && (
              <div className="absolute inset-0 animate-highlight-reveal rounded-sm" />
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
