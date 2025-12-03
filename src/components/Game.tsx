import { useGame } from "../hooks/useGame";
import { BookOpen } from "lucide-react";

import ItemModal from "./ItemModal";

import SceneNarrator from "./SceneNarrator";
import WorldMap from "./WorldMap";
import EquippedItems from "./EquippedItems";
import Inventory from "./Inventory";
import ActionPanel from "./ActionPanel";
import DirectionPad from "./DirectionPad";
import PlayerStats from "./PlayerStats";
import FeedbackOverlay from "./FeedbackOverlay";

export default function Game() {
  const {
    gameState,
    hasInspected,
    viewingItemId,
    setViewingItemId,
    isWalking,
    walkingDirection,
    walkStepScale,
    isEnemyRevealed,
    attackPower,
    defensePower,
    currentRoom,
    handleMove,
    inspectRoom,
    takeItem,
    dropItem,
    equipItem,
    attackEnemy,
    useItem,
    feedback,
    setNarratorVisible
  } = useGame();

  const showStats = !gameState.isNarratorVisible;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden relative">

      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 z-0">
            <img
              src={currentRoom.image}
              alt=""
              className="w-full h-full object-cover opacity-50 blur-xl scale-110"
            />
          </div>

          <div
            key={feedback?.id || "no-feedback"}
            className={`relative z-10 h-full aspect-video shadow-2xl overflow-hidden ${["damage", "warning"].includes(feedback?.type || "") ? "animate-shake" : ""}`}
          >
            <img
              src={currentRoom.image}
              alt={currentRoom.name}
              className="w-full h-full object-cover"
            />

            <FeedbackOverlay
              message={feedback?.message || null}
              delay={["damage", "warning"].includes(feedback?.type || "") ? 500 : 0}
            />

            <div className={`absolute top-4 left-4 z-30 transition-opacity duration-1000 ${showStats ? "opacity-100" : "opacity-0"}`}>
              <PlayerStats
                health={gameState.health}
                maxHealth={gameState.maxHealth}
                attackPower={attackPower}
                defensePower={defensePower}
              />
            </div>

            {/* Restore Narrator Button */}
            {!gameState.isNarratorVisible && (
              <button
                onClick={() => setNarratorVisible(true)}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 p-2 bg-black/50 hover:bg-black/70 text-emerald-400 hover:text-emerald-300 rounded-full border border-emerald-900/50 transition-all hover:scale-110 shadow-lg backdrop-blur-sm"
                aria-label="Show Narrative"
              >
                <BookOpen size={24} />
              </button>
            )}

            <div className={`absolute inset-0 z-30 transition-opacity duration-500 ${showStats ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>

              <div className="absolute bottom-12 left-8 w-32 h-32">
                <DirectionPad
                  currentRoom={currentRoom}
                  isWalking={isWalking}
                  lastMoveDirection={walkingDirection || gameState.lastMoveDirection}
                  walkStepScale={walkStepScale}
                  onMove={handleMove}
                />
              </div>

              <div className="absolute top-8 right-8 w-64">
                <ActionPanel
                  currentRoom={currentRoom}
                  isEnemyRevealed={isEnemyRevealed}
                  hasInspected={hasInspected}
                  isWalking={isWalking}
                  onInspectRoom={inspectRoom}
                  onTakeItem={takeItem}
                  onAttack={attackEnemy}
                />
              </div>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 items-end h-16">
                <EquippedItems
                  equippedItems={gameState.equippedItems}
                  isWalking={isWalking}
                  onInspect={setViewingItemId}
                />
                <Inventory
                  items={gameState.inventory.items}
                  isWalking={isWalking}
                  onInspect={setViewingItemId}
                />
              </div>
            </div>

            {
              currentRoom.enemy && currentRoom.enemy.image && isEnemyRevealed && (
                <div className="absolute inset-0 z-20 flex items-end justify-center pointer-events-none">
                  <img
                    src={currentRoom.enemy.image}
                    alt={currentRoom.enemy.name}
                    className="h-4/5 object-contain drop-shadow-2xl animate-idle"
                  />
                </div>
              )
            }

            < div className="absolute bottom-4 right-4 z-30 opacity-80 hover:opacity-100 transition-opacity" >
              <WorldMap
                currentRoomId={gameState.currentRoomId}
                visitedRooms={gameState.visitedRooms || []}
              />
            </div>

            {/* Vignette filter */}
            <div
              className={`absolute inset-0 z-20 pointer-events-none transition-colors duration-300 ${["damage"].includes(feedback?.type || "")
                ? "bg-gradient-to-t from-red-900/60 via-red-900/10 to-red-900/30"
                : "bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30"
                }`}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col h-full justify-end pointer-events-none">

        <div className={`shrink-0 pb-4 px-4 min-h-[200px] flex flex-col justify-end ${gameState.isNarratorVisible ? "pointer-events-auto" : "pointer-events-none"}`}>
          {gameState.isNarratorVisible && (
            <SceneNarrator
              currentRoom={currentRoom}
              onContinue={() => setNarratorVisible(false)}
            />
          )}
        </div>
      </div>

      {
        viewingItemId && (
          <ItemModal
            itemId={viewingItemId}
            isEquipped={gameState.equippedItems.weapon === viewingItemId || gameState.equippedItems.armor === viewingItemId}
            onClose={() => setViewingItemId(null)}
            onUse={useItem}
            onEquip={equipItem}
            onDrop={dropItem}
          />
        )
      }

    </div >
  );
}
