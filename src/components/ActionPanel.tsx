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
    <div className="flex-1 grid grid-cols-1 gap-2 auto-rows-[3rem] overflow-y-auto min-w-0 w-full h-32 md:h-full content-start">
      {currentRoom.enemy && isEnemyRevealed && (
        <ActionButton
          icon={Sword}
          label={`FIGHT (${currentRoom.enemy.hp})`}
          danger
          onClick={onAttack}
          isWalking={isWalking}
        />
      )}

      {(!hasInspected || currentRoom.items.length === 0) && (
        <ActionButton
          icon={Eye}
          label="INSPECT AREA"
          onClick={handleInspect}
          isWalking={isWalking}
        />
      )}

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
  );
};

export default ActionPanel;
