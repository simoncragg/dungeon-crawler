import React from "react";
import { Eye, EyeClosed, Sword } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ITEMS } from "../data/gameData";
import { useGameStore } from "../store/useGameStore";
import type { Hotspot } from "../types";
import ActionButton from "./ActionButton";
import ActionIcon from "./ActionIcon";

interface ActionPanelProps {
  onTakeItem: (itemId: string) => void;
  onAttack: () => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ onTakeItem, onAttack }) => {
  const { gameState } = useGameStore();
  const { rooms, currentRoomId, perceivedRoomId, isWalking, isEnemyRevealed, isDropAnimating } = gameState;
  const currentRoom = rooms[perceivedRoomId] || rooms[currentRoomId];

  const [isGrabMenuOpen, setIsGrabMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (isDropAnimating) setIsGrabMenuOpen(true);
  }, [isDropAnimating]);

  const handleInspect = () => {
    setIsGrabMenuOpen(!isGrabMenuOpen);
  };

  const nonNativeItems = currentRoom.items.filter((itemId: string) =>
    !currentRoom.hotspots?.some((h: Hotspot) => h.type === "item" && h.itemId === itemId)
  );

  const showEye = nonNativeItems.length > 0;

  return (
    <div className="flex-1 flex flex-col gap-2 overflow-visible min-w-0 w-full h-32 md:h-full content-start pt-1">
      {currentRoom.enemy && isEnemyRevealed && (
        <div className="grid grid-cols-1 auto-rows-[3rem] w-full shrink-0">
          <ActionButton
            icon={Sword}
            label={`FIGHT (${currentRoom.enemy.hp})`}
            danger
            onClick={onAttack}
            isWalking={isWalking}
          />
        </div>
      )}

      <div className="w-full py-2 flex flex-col items-end pr-6 shrink-0 relative">
        {showEye && (
          <div className="relative flex flex-col items-center w-[60px]">
            <ActionIcon
              icon={(isGrabMenuOpen ? EyeClosed : Eye) as LucideIcon}
              onClick={handleInspect}
              disabled={isWalking}
              ariaLabel="Inspect Dropped Items"
              size={72}
              iconSize={52}
              iconClassName=""
            />

            {isGrabMenuOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-6 py-4">
                {nonNativeItems.map((itemId: string, idx: number) => {
                  const item = ITEMS[itemId];
                  const slotScale = item.slotStyle?.scale ?? 1;
                  const slotRotation = item.slotStyle?.rotation ?? "0deg";

                  return (
                    <button
                      key={`${itemId}-${idx}`}
                      onClick={() => {
                        onTakeItem(itemId);
                        if (nonNativeItems.length <= 1) setIsGrabMenuOpen(false);
                      }}
                      className="size-14 group relative flex items-center justify-center animate-spin-out opacity-0 will-change-transform"
                      style={{ animationDelay: `${idx * 150}ms` }}
                    >
                      {/* Aura */}
                      <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full opacity-40 group-hover:opacity-100 group-hover:bg-amber-400/20 group-hover:scale-150 transition-all duration-700 ease-out pointer-events-none" />

                      <div
                        className="size-full flex items-center justify-center pointer-events-none relative z-10"
                        style={{ transform: `scale(${slotScale}) rotate(${slotRotation})` }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-all duration-500"
                        />
                      </div>

                      <div className="absolute right-full mr-6 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/90 text-amber-200 text-[10px] font-bold uppercase tracking-widest border border-amber-900/40 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-[60]">
                        {item.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionPanel;
