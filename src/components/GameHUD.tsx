import { BookOpen } from "lucide-react";

import type { PlayerCombatAction, Direction } from "../types";

import ActionPanel from "./ActionPanel";
import CombatOverlay from "./CombatOverlay";
import DirectionPad from "./DirectionPad";
import EquippedItems from "./EquippedItems";
import FeedbackOverlay from "./FeedbackOverlay";
import Inventory from "./Inventory";
import PlayerStats from "./PlayerStats";
import SceneTitle from "./SceneTitle";
import WorldMap from "./WorldMap";

import { useDeviceDetection } from "../hooks/useDeviceDetection";
import { useGameStore } from "../store/useGameStore";
import { useMediaQuery } from "../hooks/useMediaQuery";

interface GameHUDProps {
  sceneTitleProps: { id: string; title: string; forceHide: boolean };
  backDirection: Direction | undefined;
  onMove: (dir: Direction) => void;
  onTakeItem: (id: string) => void;
  onAttack: () => void;
  onCombatAction: (action: PlayerCombatAction) => void;
  setViewingItemId: (id: string | null) => void;
}

export default function GameHUD({
  sceneTitleProps,
  backDirection,
  onMove,
  onTakeItem,
  onAttack,
  onCombatAction,
  setViewingItemId,
}: GameHUDProps) {
  const isWideScreen = useMediaQuery('(min-aspect-ratio: 16/9)');
  const { isMobile } = useDeviceDetection();
  const { gameState, actions } = useGameStore();

  const currentRoom = gameState.rooms[gameState.perceivedRoomId] || gameState.rooms[gameState.currentRoomId];
  const inCombat = gameState.combat?.inCombat || false;
  const showStats = !gameState.isQuestLogOpen;
  const { feedback } = gameState;

  const canGoBack = !!backDirection && !inCombat && !gameState.isQuestLogOpen && !gameState.isWalking && !gameState.isShutterActive;

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
          <PlayerStats />
        </div>

        {/* Quest Log Button */}
        <button
          onClick={() => actions.setQuestLogOpen(true)}
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 p-2 bg-black/50 hover:bg-black/70 text-emerald-400 hover:text-emerald-300 rounded-full border border-emerald-900/50 transition-all hover:scale-110 shadow-lg backdrop-blur-sm ${!gameState.isQuestLogOpen && (!inCombat || gameState.isGameOver) ? "opacity-100 pointer-events-auto scale-100" : "opacity-0 pointer-events-none scale-90"}`}
          aria-label="Quest Log"
        >
          <BookOpen size={24} />
        </button>

        {/* Controls Layer */}
        <div className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-500 ${showStats && !inCombat ? "opacity-100" : "opacity-0"}`}>

          {/* Direction Pad - Hidden on mobile phones */}
          {!isMobile && (
            <div className="absolute bottom-12 left-8 w-32 h-32 pointer-events-auto">
              <DirectionPad onMove={onMove} />
            </div>
          )}

          {/* Action Panel */}
          <div className="absolute top-8 right-4 w-64 pointer-events-auto">
            <ActionPanel onTakeItem={onTakeItem} onAttack={onAttack} />
          </div>

          {/* Inventory / Equipped */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 items-end h-16 pointer-events-auto">
            <EquippedItems
              onInspect={setViewingItemId}
              onEquipFromInventory={(idx, slot) => actions.equipItem(undefined, idx, slot)}
            />
            <Inventory
              onInspect={setViewingItemId}
              onMoveItem={actions.reorderInventory}
              onUnequipToInventory={(slot, idx) => actions.unequipItem(undefined, slot, idx)}
            />
          </div>
        </div>

        {/* World Map - Hidden on mobile phones */}
        {!isMobile && (
          <div className={`absolute bottom-4 right-4 z-30 opacity-80 hover:opacity-100 transition-opacity pointer-events-auto ${inCombat ? 'hidden' : ''}`}>
            <WorldMap
              currentRoomId={gameState.mapOverrideRoomId || gameState.currentRoomId}
              visitedRooms={gameState.visitedRooms || []}
            />
          </div>
        )}

        {/* Back Hotspot */}
        {canGoBack && (
          <button
            onClick={() => backDirection && onMove(backDirection)}
            className="absolute bottom-0 left-0 w-full h-[15%] z-10 pointer-events-auto cursor-default peer"
            aria-label="Go Back"
          />
        )}

        {/* Combat Interface */}
        {gameState.combat && gameState.combat.inCombat && currentRoom.enemy && !gameState.isGameOver && (
          <CombatOverlay
            enemy={currentRoom.enemy}
            onAction={onCombatAction}
          />
        )}

        {/* Scene Title */}
        {!gameState.isGameOver && (
          <div className="absolute bottom-0 w-full flex flex-col justify-end pointer-events-none pb-32 px-4">
            <div className="flex flex-col items-center justify-end">
              <SceneTitle key={sceneTitleProps.id} {...sceneTitleProps} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
