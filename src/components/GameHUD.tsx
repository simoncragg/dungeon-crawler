import type { GameState, Room, Feedback, Direction, PlayerCombatAction } from "../types";
import { BookOpen } from "lucide-react";
import SceneTitle from "./SceneTitle";

import WorldMap from "./WorldMap";
import EquippedItems from "./EquippedItems";
import Inventory from "./Inventory";
import ActionPanel from "./ActionPanel";
import DirectionPad from "./DirectionPad";
import PlayerStats from "./PlayerStats";
import FeedbackOverlay from "./FeedbackOverlay";
import CombatOverlay from "./CombatOverlay";

interface SceneTitleProps {
  id: string;
  title: string;
  forceHide?: boolean;
}

interface GameHUDProps {
  gameState: GameState;
  currentRoom: Room;
  isWideScreen: boolean;
  isWalking: boolean;
  inCombat: boolean;
  showStats: boolean;
  isEnemyRevealed: boolean;
  hasInspected: boolean;
  attackPower: number;
  defensePower: number;
  feedback: Feedback;
  walkingDirection: Direction | null;
  walkStepScale: number;
  sceneTitleProps: SceneTitleProps;

  onMove: (direction: Direction) => void;
  onInspectRoom: () => void;
  onTakeItem: (itemId: string) => void;
  onAttack: () => void;
  onCombatAction: (action: PlayerCombatAction) => void;
  setQuestLogOpen: (open: boolean) => void;
  setViewingItemId: (id: string | null) => void;
}

export default function GameHUD({
  gameState,
  currentRoom,
  isWideScreen,
  isWalking,
  inCombat,
  showStats,
  isEnemyRevealed,
  hasInspected,
  attackPower,
  defensePower,
  feedback,
  walkingDirection,
  walkStepScale,
  sceneTitleProps,
  onMove,
  onInspectRoom,
  onTakeItem,
  onAttack,
  onCombatAction,
  setQuestLogOpen,
  setViewingItemId
}: GameHUDProps) {

  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
      <div className={`relative ${isWideScreen ? 'h-full aspect-video max-w-full' : 'w-full h-full'}`}>

        {/* Feedback Overlay */}
        <div className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-500 ${!inCombat ? "opacity-100" : "opacity-0"}`}>
          <FeedbackOverlay
            message={feedback?.message || null}
            delay={["damage", "warning"].includes(feedback?.type || "") ? 500 : 0}
          />
        </div>

        {/* Player Stats */}
        <div className={`absolute top-4 left-4 z-30 transition-opacity duration-1000 ${showStats && !inCombat ? "opacity-100" : "opacity-0"}`}>
          <PlayerStats
            health={gameState.health}
            maxHealth={gameState.maxHealth}
            attackPower={attackPower}
            defensePower={defensePower}
          />
        </div>

        {/* Quest Log Button */}
        <button
          onClick={() => setQuestLogOpen(true)}
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 p-2 bg-black/50 hover:bg-black/70 text-emerald-400 hover:text-emerald-300 rounded-full border border-emerald-900/50 transition-all hover:scale-110 shadow-lg backdrop-blur-sm ${!gameState.isQuestLogOpen && !inCombat ? "opacity-100 pointer-events-auto scale-100" : "opacity-0 pointer-events-none scale-90"}`}
          aria-label="Quest Log"
        >
          <BookOpen size={24} />
        </button>

        {/* Controls Layer */}
        <div className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-500 ${showStats && !inCombat ? "opacity-100" : "opacity-0"}`}>

          {/* Direction Pad */}
          <div className="absolute bottom-12 left-8 w-32 h-32 pointer-events-auto">
            <DirectionPad
              currentRoom={currentRoom}
              isWalking={isWalking}
              facingDirection={walkingDirection || currentRoom.facing}
              walkStepScale={walkStepScale}
              onMove={onMove}
            />
          </div>

          {/* Action Panel */}
          <div className="absolute top-8 right-8 w-64 pointer-events-auto">
            <ActionPanel
              currentRoom={currentRoom}
              isEnemyRevealed={isEnemyRevealed}
              hasInspected={hasInspected}
              isWalking={isWalking}
              onInspectRoom={onInspectRoom}
              onTakeItem={onTakeItem}
              onAttack={onAttack}
            />
          </div>

          {/* Inventory / Equipped */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 items-end h-16 pointer-events-auto">
            <EquippedItems
              equippedItems={gameState.equippedItems}
              onInspect={setViewingItemId}
            />
            <Inventory
              items={gameState.inventory.items}
              onInspect={setViewingItemId}
            />
          </div>
        </div>

        {/* World Map */}
        <div className={`absolute bottom-4 right-4 z-30 opacity-80 hover:opacity-100 transition-opacity pointer-events-auto ${inCombat ? 'hidden' : ''}`}>
          <WorldMap
            currentRoomId={gameState.mapOverrideRoomId || gameState.currentRoomId}
            visitedRooms={gameState.visitedRooms || []}
          />
        </div>

        {/* Combat Interface */}
        {gameState.combat && gameState.combat.inCombat && currentRoom.enemy && (
          <CombatOverlay
            combat={gameState.combat}
            enemy={currentRoom.enemy}
            player={{
              hp: gameState.health,
              maxHp: gameState.maxHealth,
              attack: attackPower,
              defense: defensePower
            }}
            onAction={onCombatAction}
          />
        )}

        {/* Scene Title */}
        <div className="absolute bottom-0 w-full flex flex-col justify-end pointer-events-none pb-32 px-4">
          <div className="flex flex-col items-center justify-end">
            <SceneTitle key={sceneTitleProps.id} {...sceneTitleProps} />
          </div>
        </div>

      </div>
    </div>
  );
}
