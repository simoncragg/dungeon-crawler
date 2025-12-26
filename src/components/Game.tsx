import { useRef, useEffect, useState } from "react";
import { useGame } from "../hooks/useGame";
import { useMediaQuery } from "../hooks/useMediaQuery";
import type { Hotspot } from "../types";
import { BookOpen } from "lucide-react";

import ItemModal from "./ItemModal";
import SceneTitle from "./SceneTitle";
import QuestLog from "./QuestLog";
import WorldMap from "./WorldMap";
import EquippedItems from "./EquippedItems";
import Inventory from "./Inventory";
import ActionPanel from "./ActionPanel";
import DirectionPad from "./DirectionPad";
import PlayerStats from "./PlayerStats";
import FeedbackOverlay from "./FeedbackOverlay";
import CombatOverlay from "./CombatOverlay";
import WeaponOverlay from "./WeaponOverlay";
import ShutterBlink from "./ShutterBlink";
import RoomHotspots from "./RoomHotspots";

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
    unequipItem,
    startCombat,
    handleCombatAction,
    useItem,
    feedback,
    setQuestLogOpen,
    videoRef,
    activeTransitionVideo,
    handleTransitionEnd,
    handleVideoTimeUpdate,
    isShutterActive,
    sceneTitleProps
  } = useGame();

  const inCombat = gameState.combat?.inCombat;
  const showStats = !gameState.isQuestLogOpen;
  const isShakeEffect = ["damage", "warning", "clash"].includes(feedback?.type || "");

  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isShakeEffect && viewportRef.current) {
      viewportRef.current.classList.remove("animate-shake");
      void viewportRef.current.offsetWidth;
      viewportRef.current.classList.add("animate-shake");
    }
  }, [feedback?.id, isShakeEffect]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = currentRoom.videoLoop?.volume ?? 1.0;
    }
  }, [videoRef, currentRoom.videoLoop]);

  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'd') {
        setIsDebugMode((prev: boolean) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isWideScreen = useMediaQuery('(min-aspect-ratio: 16/9)');

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative">

      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        <div className="absolute inset-0 z-0">
          <img
            src={currentRoom.image}
            alt=""
            className="w-full h-full object-cover opacity-50 blur-xl scale-110"
          />
        </div>

        <div
          ref={viewportRef}
          className="relative z-10 h-full aspect-video shadow-2xl overflow-hidden will-change-transform shrink-0 max-w-none"
        >
          {/* Background Video/Image */}
          <div className={`w-full h-full transition-all duration-1000 ${gameState.combat?.enemyAction === 'STAGGER' ? 'animate-ken-burns' : ''}`}>
            {currentRoom.videoLoop ? (
              <video
                ref={videoRef}
                src={currentRoom.videoLoop?.path}
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={currentRoom.image}
                alt={currentRoom.name}
                className="w-full h-full object-cover"
              />
            )}

            {activeTransitionVideo && (
              <div className="absolute inset-0 z-10">
                <video
                  src={activeTransitionVideo}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  onEnded={handleTransitionEnd}
                  onTimeUpdate={handleVideoTimeUpdate}
                />
              </div>
            )}
          </div>

          {/* Hotspots - MUST stay in Video Layer to align with world imagery */}
          <RoomHotspots
            hotspots={currentRoom.hotspots?.filter((h: Hotspot) => h.type === "door" || currentRoom.items.includes(h.itemId))}
            onHotspotClick={(hotspot) => {
              if (hotspot.type === "door") {
                handleMove(hotspot.direction);
              }
              if (hotspot.type === "item") takeItem(hotspot.itemId);
            }}
            disabled={isWalking || inCombat || gameState.isQuestLogOpen}
            debug={isDebugMode}
            itemsRevealed={hasInspected}
            isTransitioning={!!activeTransitionVideo}
          />

          {/* Enemy Sprite - Part of the world */}
          {
            currentRoom.enemy && (isEnemyRevealed || inCombat) && (
              <div className="absolute inset-0 z-20 flex items-end justify-center pointer-events-none">
                <div
                  key="enemy-sprite"
                  className={`transition-all duration-1000 ease-in drop-shadow-2xl ${gameState.combat?.enemyAction === 'DAMAGE' ? 'drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]' :
                    gameState.combat?.enemyAction === 'STAGGER_HIT' ? 'drop-shadow-[0_0_30px_rgba(255,0,0,0.9)] brightness-125' :
                      gameState.combat?.enemyAction === 'DEFEAT' ? 'animate-defeat' :
                        gameState.combat?.enemyAction === 'STAGGER' ? 'animate-stagger' :
                          (gameState.combat?.enemyAction === 'IDLE' || !gameState.combat) ? 'animate-idle' : ''
                    }`}
                >
                  <img
                    src={gameState.combat?.enemyImage || `/images/enemies/${currentRoom.enemy.id}-idle.png`}
                    alt={currentRoom.enemy.name}
                    className="h-[80vh] object-contain transition-all duration-100"
                  />
                </div>
              </div>
            )
          }

          {/* Weapon Overlay - Visuals */}
          <div className="absolute inset-0 z-25 pointer-events-none transition-opacity duration-500 opacity-100">
            <WeaponOverlay
              weaponId={gameState.equippedItems.weapon}
              brightness={currentRoom.heldItemBrightness}
              combat={gameState.combat || undefined}
            />
          </div>

          {/* Vignette - Environmental Effect */}
          <div
            className={`absolute inset-0 z-15 pointer-events-none transition-colors duration-300 ${(["damage"].includes(feedback?.type || ""))
              ? "bg-gradient-to-t from-red-900/60 via-red-900/10 to-red-900/30"
              : "bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30"
              }`}
          />
        </div>
      </div>

      {/* --- HUD LAYER (UI & Controls) --- */}
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
                onMove={handleMove}
              />
            </div>

            {/* Action Panel */}
            <div className="absolute top-8 right-8 w-64 pointer-events-auto">
              <ActionPanel
                currentRoom={currentRoom}
                isEnemyRevealed={isEnemyRevealed}
                hasInspected={hasInspected}
                isWalking={isWalking}
                onInspectRoom={inspectRoom}
                onTakeItem={takeItem}
                onAttack={startCombat}
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
              onAction={handleCombatAction}
            />
          )}

          {/* Scene Title - Now inside HUD Layer */}
          <div className="absolute bottom-0 w-full flex flex-col justify-end pointer-events-none pb-32 px-4">
            <div className="flex flex-col items-center justify-end">
              <SceneTitle {...sceneTitleProps} />
            </div>
          </div>

        </div>
      </div>

      {/* --- MODALS (Global Overlay) --- */}
      {
        viewingItemId && (
          <ItemModal
            itemId={viewingItemId}
            isEquipped={gameState.equippedItems.weapon === viewingItemId || gameState.equippedItems.armor === viewingItemId}
            onClose={() => setViewingItemId(null)}
            onUse={useItem}
            onEquip={equipItem}
            onUnequip={unequipItem}
            onDrop={dropItem}
            canUnequip={gameState.inventory.items.some(i => i === null)}
            isDroppable={!isWalking}
            isUsable={!isWalking}
          />
        )
      }

      {gameState.isQuestLogOpen && (
        <QuestLog
          questLog={gameState.questLog}
          onClose={() => setQuestLogOpen(false)}
        />
      )}

      <ShutterBlink isActive={isShutterActive} />
    </div>
  );
}
