import React from "react";
import { Eye, Hand, Sword } from "lucide-react";

import type { Room } from "../types";
import ActionButton from "./ActionButton";
import { ITEMS } from "../data/gameData";
import useSoundFx from "../hooks/useSoundFx";

import { useGameStore } from "../store/useGameStore";

interface ActionPanelProps {
  currentRoom: Room;
  isWalking: boolean;
  onInspectRoom: () => void;
  onTakeItem: (itemId: string) => void;
  onAttack: () => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({
  currentRoom,
  isWalking,
  onInspectRoom,
  onTakeItem,
  onAttack,
}) => {
  const { isEnemyRevealed, hasInspected } = useGameStore(state => state.gameState);
  const { playSoundFile } = useSoundFx();

  const handleInspect = () => {
    playSoundFile("inspect.mp3", 1.0);
    onInspectRoom();
  };

  return (
    <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-w-0 w-full h-32 md:h-full content-start pt-1">
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

      {(!hasInspected || currentRoom.items.length === 0) && (
        <div className="w-full py-2 flex justify-end pr-6 shrink-0">
          <button
            onClick={handleInspect}
            disabled={isWalking}
            className="group relative flex items-center justify-center p-4 transition-all duration-500 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Blink"
          >
            <div className="relative">
              <Eye size={52} className="text-amber-500/80 group-hover:text-amber-400 group-hover:scale-110 transition-all duration-500 animate-eye-pulse drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] drop-shadow-[0_0_20px_rgba(245,158,11,0.2)]" />
              <div className="absolute inset-0 bg-amber-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 auto-rows-[3rem] w-full">
        {hasInspected && currentRoom.items.length > 0 && (
          currentRoom.items.map(itemId => {
            const item = ITEMS[itemId];
            return (
              <button
                key={itemId}
                disabled={isWalking}
                onClick={() => onTakeItem(itemId)}
                className="w-full h-full flex items-center justify-between px-4 bg-stone-800 hover:bg-stone-700 border-2 border-stone-600 rounded-lg text-amber-200 transition-all active:scale-95 animate-in slide-in-from-right duration-300 disabled:opacity-50 shadow-md"
              >
                <span className="flex items-center gap-4 font-bold text-sm font-medieval tracking-wide">
                  <Hand size={16} /> TAKE {item.name.toUpperCase()}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActionPanel;
