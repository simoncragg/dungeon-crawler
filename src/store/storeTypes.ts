import type {
    GameState,
    LogEntry,
    PlayerCombatAction,
    CombatAction,
    CombatResult,
    Direction,
    SoundAsset
} from "../types";

export interface GameStore {
    gameState: GameState;
    actions: {
        // Inventory Actions
        takeItem: (itemId: string, autoEquip: boolean, logMessage: string) => void;
        dropItem: (itemId: string, logMessage: string) => void;
        equipItem: (itemId: string | undefined, inventoryIndex: number | undefined, slotType: "weapon" | "armor" | undefined, logMessage?: string) => void;
        unequipItem: (itemId: string | undefined, slotType: "weapon" | "armor" | undefined, inventoryIndex: number | undefined, logMessage?: string) => void;
        reorderInventory: (fromIndex: number, toIndex: number) => void;
        consumeItem: (itemId: string) => void;
        useConsumable: (itemId: string, effect: (state: GameState) => Partial<GameState>, logMessage: string) => void;

        // Exploration Actions
        move: (nextRoomId: string) => void;
        updateMapPosition: (roomId: string) => void;
        unlockDoor: (direction: Direction) => void;
        setRoomAudio: (roomId: string, audioLoop: SoundAsset | undefined) => void;
        clearUnlockHighlight: () => void;

        // Combat Actions
        startCombat: () => void;
        setCombatProcessing: (processing: boolean, playerAction?: PlayerCombatAction) => void;
        setEnemyAction: (action: CombatAction) => void;
        setCombatResult: (result: CombatResult) => void;
        combatRound: (params: { damageDealt: number; damageTaken: number; enemyName: string; logMessage: string; playerDied: boolean }) => void;
        combatRoundEnd: () => void;
        setCombatRiposte: (canRiposte: boolean) => void;
        enemyDefeat: (params: { enemyName: string; dropId: string | undefined; logMessages: string[]; feedbackMessage?: string; damageDealt: number }) => void;
        setEnemyRevealed: (revealed: boolean) => void;

        // Narrative Actions
        setQuestLogOpen: (open: boolean) => void;
        addLog: (message: string, logType?: LogEntry["type"]) => void;
        clearFeedback: () => void;
        setQuestLog: (log: LogEntry[]) => void;
        setPerceivedRoomId: (roomId: string) => void;

        // Inventory Actions (Additional)
        clearDropAnimation: () => void;
        setDropAnimating: (itemId: string) => void;
    };
}
