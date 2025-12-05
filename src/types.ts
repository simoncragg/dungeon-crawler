export type Direction = "north" | "south" | "east" | "west";

export type ItemType = "item" | "weapon" | "armor" | "consumable" | "key";

export type Item = {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  stats?: { attack?: number; defense?: number };
  effect?: (gameState: GameState) => Partial<GameState>;
  icon?: React.ElementType;
  enemy?: {
    name: string;
    maxHp: number;
    hp: number;
    damage: number;
    description: string;
    defeatMessage: string;
    drop?: string;
    image?: string;
  };
};

export type Room = {
  id: string;
  name: string;
  description: string;
  narrative?: string[];
  exits: Partial<Record<Direction, string>>;
  items: string[];
  lockedExits?: Partial<Record<Direction, { keyId: string; lockedMessage: string; unlockImage?: string }>>;
  coordinates: { x: number; y: number };
  shortName?: string;
  image: string;
  audioLoop?: string;
  enemy?: {
    name: string;
    maxHp: number;
    hp: number;
    damage: number;
    description: string;
    defeatMessage: string;
    drop?: string;
    image?: string;
  };
};

export type LogEntry = {
  id: number;
  type: "room-title" | "room-description" | "info" | "warning" | "danger" | "success" | "combat" | "system" | "damage";
  text: string;
};

export type Feedback = {
  message: string | null;
  type: string | null;
  id: number;
};

export type Inventory = {
  items: (string | null)[];
};

export type GameState = {
  currentRoomId: string;
  inventory: Inventory;
  equippedItems: {
    weapon: string | null;
    armor: string | null;
  };
  visitedRooms: string[];
  health: number;
  maxHealth: number;
  flags: Record<string, boolean>;
  lastMoveDirection: Direction;
  rooms: Record<string, Room>;
  questLog: LogEntry[];
  feedback: Feedback | null;
  isNarratorVisible: boolean;
};

export type GameAction =
  | { type: 'MOVE'; direction: Direction; nextRoomId: string }
  | { type: 'TAKE_ITEM'; itemId: string; autoEquip: boolean; logMessage: string }
  | { type: 'DROP_ITEM'; itemId: string; logMessage: string }
  | { type: 'EQUIP_ITEM'; itemId: string; logMessage: string }
  | { type: 'USE_CONSUMABLE'; itemId: string; effect: (state: GameState) => Partial<GameState>; logMessage: string }
  | { type: 'UNLOCK_DOOR'; direction: Direction; keyId: string; logMessage: string }
  | { type: 'COMBAT_ROUND'; damageDealt: number; damageTaken: number; enemyName: string; logMessage: string; playerDied: boolean }
  | { type: 'ENEMY_DEFEAT'; enemyName: string; dropId?: string; logMessage: string; damageDealt: number }
  | { type: 'ADD_LOG'; message: string; logType?: LogEntry['type'] }
  | { type: 'SET_QUEST_LOG'; log: LogEntry[] }
  | { type: 'CLEAR_FEEDBACK' }
  | { type: 'SET_NARRATOR_VISIBLE'; visible: boolean };