import { WORLD } from "./gameData";
import type { GameState } from "../types";

export const INITIAL_STATE: GameState = {
  currentRoomId: "start",
  perceivedRoomId: "start",
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
  rooms: WORLD,
  questLog: [
    { id: 0, type: "room-title", text: WORLD["start"].name },
    { id: 1, type: "room-description", text: WORLD["start"].description },
    { id: 2, type: "narration", text: WORLD["start"].narration?.text || "" },
  ],
  feedback: null,
  isQuestLogOpen: false,
  combat: null,
  attack: 5,
  defense: 0,
  latestDrop: null,
  isEnemyRevealed: false,
  recentDropId: null,
  isDropAnimating: false,
  isFirstVisit: true,
  unlockedDirection: null,
  isWalking: false,
  walkingDirection: null,
  isShutterActive: false,
  activeTransitionVideo: null,
  walkingInterval: undefined,
  isDebugMode: false,
  isGameOver: false,
  isGameCompleted: false
};
