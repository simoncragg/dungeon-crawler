import { WORLD } from "./gameData";
import type { GameState } from "../types";

export const INITIAL_STATE: GameState = {
  currentRoomId: "start",
  inventory: {
    items: [null, null, null, null]
  },
  equippedItems: {
    weapon: null,
    armor: null
  },
  visitedRooms: ["start"],
  health: 100,
  maxHealth: 100,
  flags: {},
  lastMoveDirection: "north",
  rooms: WORLD,
  questLog: [
    { id: 0, type: "room-title", text: WORLD["start"].name },
    { id: 1, type: "room-description", text: WORLD["start"].description },
  ],
  feedback: null,
  isNarratorVisible: true,
  combat: null,
  attack: 5,
  defense: 0
};
