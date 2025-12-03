import React from "react";
import { Footprints } from "lucide-react";

import type { Room, Direction } from "../types";
import NavButton from "./NavButton";

interface DirectionPadProps {
  currentRoom: Room;
  isWalking: boolean;
  lastMoveDirection: Direction;
  walkStepScale: number;
  onMove: (direction: Direction) => void;
}

const DirectionPad: React.FC<DirectionPadProps> = ({
  currentRoom,
  isWalking,
  lastMoveDirection,
  walkStepScale,
  onMove,
}) => {
  const renderNavButton = (direction: Direction) => (
    <NavButton
      direction={direction}
      currentRoom={currentRoom}
      isWalking={isWalking}
      onMove={onMove}
    />
  );

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-2 shrink-0 bg-stone-900/50 rounded-xl border-2 border-stone-700 self-center h-36 p-2 aspect-square shadow-xl">
      <div /> {renderNavButton("north")} <div />
      {renderNavButton("west")}
      <div
        className="flex items-center justify-center text-stone-600 w-full h-full transition-transform duration-300 ease-out"
        style={{
          transform: `rotate(${lastMoveDirection === "east"
            ? 90
            : lastMoveDirection === "south"
              ? 180
              : lastMoveDirection === "west"
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
