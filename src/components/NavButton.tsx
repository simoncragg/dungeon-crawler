
import type { Room, Direction } from "../types";

interface NavButtonProps {
  direction: Direction;
  currentRoom: Room;
  isWalking: boolean;
  onMove: (dir: Direction) => void;
}

const NavButton = ({ direction, currentRoom, isWalking, onMove }: NavButtonProps) => {
  const isAvailable = !!currentRoom.exits[direction] && !isWalking;
  return (
    <button
      onClick={() => onMove(direction)}
      disabled={!isAvailable}
      className={`flex items-center justify-center w-full h-full rounded-md text-xl font-medieval font-bold uppercase shadow-sm transition-all active:scale-95 ${isAvailable
        ? "bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600"
        : "bg-stone-900/50 text-stone-700 border border-stone-800 cursor-not-allowed"
        }`}
    >
      {direction === "north" ? "N" : direction === "south" ? "S" : direction === "east" ? "E" : "W"}
    </button>
  );
};

export default NavButton;
