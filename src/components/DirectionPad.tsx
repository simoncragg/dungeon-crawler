import React, { useState, useEffect } from "react";
import { useGameStore } from "../store/useGameStore";
import { Footprints } from "lucide-react";

import type { Direction } from "../types";
import NavButton from "./NavButton";

interface DirectionPadProps {
  onMove: (direction: Direction) => void;
}

const DirectionPad: React.FC<DirectionPadProps> = ({ onMove }) => {
  const { gameState } = useGameStore();
  const {
    rooms,
    currentRoomId,
    perceivedRoomId,
    walkingDirection,
    isWalking
  } = gameState;

  const [walkStepScale, setWalkStepScale] = useState(1);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isWalking) {
      interval = setInterval(() => {
        setWalkStepScale(s => s * -1);
      }, 300);
    }
    return () => {
      if (interval) clearInterval(interval);
      setWalkStepScale(1);
    };
  }, [isWalking]);

  const currentRoom = rooms[perceivedRoomId] || rooms[currentRoomId];
  const facingDirection = walkingDirection || currentRoom.facing;

  const renderNavButton = (direction: Direction) => (
    <NavButton direction={direction} onMove={onMove} />
  );

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-2 shrink-0 bg-stone-900/50 rounded-xl border-2 border-stone-700 self-center h-36 p-2 aspect-square shadow-xl">
      <div /> {renderNavButton("north")} <div />
      {renderNavButton("west")}
      <div
        className="flex items-center justify-center text-stone-600 w-full h-full transition-transform duration-300 ease-out"
        style={{
          transform: `rotate(${facingDirection === "east"
            ? 90
            : facingDirection === "south"
              ? 180
              : facingDirection === "west"
                ? -90
                : 0
            }deg)`,
        }}
      >
        <Footprints size={20} style={{ transform: `scaleX(${walkStepScale})` }} />
      </div>
      {renderNavButton("east")}
      <div /> {renderNavButton("south")} <div />
    </div>
  );
};

export default DirectionPad;
