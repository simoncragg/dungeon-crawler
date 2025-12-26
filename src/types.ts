export type Direction = "north" | "south" | "east" | "west";

export type ItemType = "item" | "weapon" | "armor" | "consumable" | "key";

export type GlowEffect = {
  color: string;
  blur?: string;
  pulse?: boolean;
  offsetY?: string;
  intensity?: 1 | 2 | 3;
};

export type SoundAsset = {
  path: string;
  volume?: number;
};

export type NarrationAsset = SoundAsset & {
  text?: string;
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
  rooms: Record<string, Room>;
  questLog: LogEntry[];
  feedback: Feedback | null;
  isQuestLogOpen: boolean;
  combat: CombatState | null;
  // Stats
  attack: number;
  defense: number;
  mapOverrideRoomId?: string;
};

export type WeaponOverlayConfig = {
  width: string;
  right: string;
  bottom: string;
  rotation?: string;
};

export type BaseStats = {
  attack?: number;
  defense?: number;
  parryChance?: number;
};

export type WeaponStats = BaseStats & {
  critChance: number;
};

export type Item = {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  stats?: BaseStats | WeaponStats;
  effect?: (gameState: GameState) => Partial<GameState>;
  icon?: React.ElementType;
  image?: string;
  modalStyle?: {
    scale?: number;
    rotation?: string;
  };
  slotStyle?: {
    scale?: number;
    rotation?: string;
  };
  glow?: GlowEffect;
  overlayConfig?: WeaponOverlayConfig;
  sounds?: {
    take?: string;
    attack?: string;
    block?: string;
    crit?: string;
    clash?: string;
    windup?: string;
    unequip?: string;
  };
};

export type EquippedItem = Item & {
  stats: Required<BaseStats>;
};

export type EquippedWeapon = Item & {
  stats: Required<WeaponStats>;
};

export type BaseHotspot = {
  top: string;
  left: string;
  width: string;
  height: string;
  label?: string;
  scale?: number;
};

export type DoorHotspot = BaseHotspot & {
  type: "door";
  direction: Direction;
};

export type ItemHotspot = BaseHotspot & {
  type: "item";
  itemId: string;
  rotation?: string;
  brightness?: number;
};

export type Hotspot = DoorHotspot | ItemHotspot;

export type Room = {
  id: string;
  name: string;
  description: string;
  exits: Partial<Record<Direction, string>>;
  items: string[];
  lockedExits?: Partial<Record<Direction, { keyId: string; lockedMessage: string; unlockImage?: string }>>;
  coordinates: { x: number; y: number };
  shortName?: string;
  image: string;
  videoLoop?: SoundAsset;
  heldItemBrightness?: number;
  narration?: NarrationAsset;
  transitionVideos?: Partial<Record<Direction, string>>;
  audioLoop?: SoundAsset;
  enemy?: {
    id: string;
    name: string;
    maxHp: number;
    hp: number;
    attack: number;
    defense: number;
    description: string;
    defeatMessage: string;
    drop?: string;
  };
  hotspots?: Hotspot[];
  facing: Direction;
  isSignposted?: boolean;
};

export type LogEntry = {
  id: number;
  type: "room-title" | "room-description" | "narration" | "info" | "warning" | "danger" | "success" | "combat" | "system" | "damage" | "clash" | "miss";
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

export type PlayerCombatAction = "ATTACK" | "BLOCK" | "PARRY" | "RIPOSTE" | "IDLE";
export type CombatAction = PlayerCombatAction | "DAMAGE" | "DEFEAT" | "STAGGER" | "TELEGRAPH" | "STAGGER_HIT";

export type CombatResultType = "crit" | "hit" | "block" | "clash" | "parry" | "miss";

export type CombatResult = {
  type: CombatResultType;
  message: string;
};

export interface CombatOutcome {
  playerDamageTaken: number;
  enemyDamageTaken: number;
  logMsg: string;
  logType: LogEntry["type"];
  combatResult: CombatResult | null;
  riposteAvailable: boolean;
  soundToPlay: string;
  finalEnemyAction: CombatAction;
  successfulParry: boolean;
}

export interface ResolveCombatTurnParams {
  playerAction: PlayerCombatAction;
  enemyAction: CombatAction;
  gameState: GameState;
  playerWeapon: EquippedWeapon | EquippedItem | null;
  enemy: { hp: number; attack: number; defense: number; name: string };
  successfulParry: boolean;
}

export type CombatState = {
  inCombat: boolean;
  round: number;
  isProcessing: boolean;
  playerAction?: CombatAction;
  enemyAction: CombatAction;
  enemyId: string;
  enemyImage: string;
  lastResult: CombatResult | null;
  canRiposte?: boolean;
};

export type GameAction =
  | { type: "MOVE"; nextRoomId: string }
  | { type: "TAKE_ITEM"; itemId: string; autoEquip: boolean; logMessage: string }
  | { type: "DROP_ITEM"; itemId: string; logMessage: string }
  | { type: "EQUIP_ITEM"; itemId: string; logMessage: string }
  | { type: "USE_CONSUMABLE"; itemId: string; effect: (state: GameState) => Partial<GameState>; logMessage: string }
  | { type: "UNLOCK_DOOR"; direction: Direction; keyId: string; logMessage: string }
  | { type: "COMBAT_ROUND"; damageDealt: number; damageTaken: number; enemyName: string; logMessage: string; playerDied: boolean }
  | { type: "ENEMY_DEFEAT"; enemyName: string; dropId?: string; logMessage: string; damageDealt: number }
  | { type: "ADD_LOG"; message: string; logType?: LogEntry["type"] }
  | { type: "SET_QUEST_LOG"; log: LogEntry[] }
  | { type: "CLEAR_FEEDBACK" }
  | { type: "SET_QUEST_LOG_OPEN"; open: boolean }
  | { type: "START_COMBAT" }
  | { type: "COMBAT_ROUND_END" }
  | { type: "SET_COMBAT_PROCESSING"; processing: boolean; playerAction?: PlayerCombatAction }
  | { type: "SET_ENEMY_ACTION"; action: CombatAction }
  | { type: "UNEQUIP_ITEM"; itemId: string; logMessage: string }
  | { type: "SET_COMBAT_RESULT"; result: CombatResult }
  | { type: "SET_COMBAT_RIPOSTE"; canRiposte: boolean }
  | { type: "UPDATE_MAP_POSITION"; roomId: string };
