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

export type VideoAsset = {
  path: string;
  volume?: number;
};

export type NarrationAsset = SoundAsset & {
  text?: string;
};

export type GameState = {
  currentRoomId: string;
  perceivedRoomId: string;
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
  attack: number;
  defense: number;
  mapOverrideRoomId?: string;
  latestDrop: { itemId: string; timestamp: number } | null;
  isEnemyRevealed: boolean;
  recentDropId: string | null;
  isDropAnimating: boolean;
  isFirstVisit: boolean;
  unlockedDirection: Direction | null;
  isWalking: boolean;
  walkingDirection: Direction | null;
  isShutterActive: boolean;
  activeTransitionVideo: VideoAsset | null;
  isDebugMode: boolean;
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
    take?: SoundAsset;
    attack?: SoundAsset;
    block?: SoundAsset;
    crit?: SoundAsset;
    clash?: SoundAsset;
    windup?: SoundAsset;
    unequip?: SoundAsset;
    use?: SoundAsset;
  };
  useVideos?: Record<string, VideoAsset>;
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
  glow?: GlowEffect;
};

export type Hotspot = DoorHotspot | ItemHotspot;

export type Room = {
  id: string;
  name: string;
  description: string;
  exits: Partial<Record<Direction, string>>;
  items: string[];
  lockedExits?: Partial<Record<Direction, { keyId: string; lockedMessage: string; unlockImage?: string; unlockMessage?: string; unlockVideo?: VideoAsset; unlockAudioLoop?: SoundAsset }>>;
  coordinates: { x: number; y: number };
  shortName?: string;
  image: string;
  videoLoop?: VideoAsset;
  heldItemBrightness?: number;
  narration?: NarrationAsset;
  transitionVideos?: Partial<Record<Direction, VideoAsset>>;
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
  soundToPlay: SoundAsset;
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
  | { type: "EQUIP_ITEM"; itemId?: string; inventoryIndex?: number; slotType?: "weapon" | "armor"; logMessage?: string }
  | { type: "USE_CONSUMABLE"; itemId: string; effect: (state: GameState) => Partial<GameState>; logMessage: string }
  | { type: "UNLOCK_DOOR"; direction: Direction; keyId: string }
  | { type: "COMBAT_ROUND"; damageDealt: number; damageTaken: number; enemyName: string; logMessage: string; playerDied: boolean }
  | { type: "ENEMY_DEFEAT"; enemyName: string; dropId?: string; logMessages: string[]; feedbackMessage?: string; damageDealt: number }
  | { type: "ADD_LOG"; message: string; logType?: LogEntry["type"] }
  | { type: "SET_QUEST_LOG"; log: LogEntry[] }
  | { type: "CLEAR_FEEDBACK" }
  | { type: "SET_QUEST_LOG_OPEN"; open: boolean }
  | { type: "START_COMBAT" }
  | { type: "COMBAT_ROUND_END" }
  | { type: "SET_COMBAT_PROCESSING"; processing: boolean; playerAction?: PlayerCombatAction }
  | { type: "SET_ENEMY_ACTION"; action: CombatAction }
  | { type: "UNEQUIP_ITEM"; itemId?: string; slotType?: "weapon" | "armor"; inventoryIndex?: number; logMessage?: string }
  | { type: "SET_COMBAT_RESULT"; result: CombatResult }
  | { type: "SET_COMBAT_RIPOSTE"; canRiposte: boolean }
  | { type: "UPDATE_MAP_POSITION"; roomId: string }
  | { type: "SET_ENEMY_REVEALED"; revealed: boolean }
  | { type: "SET_DROP_ANIMATING"; itemId: string }
  | { type: "CLEAR_DROP_ANIMATION" }
  | { type: "CLEAR_UNLOCK_HIGHLIGHT" }
  | { type: "SET_ROOM_AUDIO"; roomId: string; audioLoop: SoundAsset | null }
  | { type: "REORDER_INVENTORY"; fromIndex: number; toIndex: number }
  | { type: "CONSUME_ITEM"; itemId: string }
  | { type: "SET_WALKING"; isWalking: boolean }
  | { type: "SET_SHUTTER"; active: boolean }
  | { type: "SET_TRANSITION_VIDEO"; video: VideoAsset | null }
  | { type: "SET_DEBUG_MODE"; enabled: boolean }
