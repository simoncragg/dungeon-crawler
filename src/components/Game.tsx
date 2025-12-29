import { useRef, useEffect, useState } from "react";
import { useGame } from "../hooks/useGame";
import { useMediaQuery } from "../hooks/useMediaQuery";
import type { Hotspot } from "../types";

import ItemModal from "./ItemModal";
import QuestLog from "./QuestLog";
import WeaponOverlay from "./WeaponOverlay";
import ShutterBlink from "./ShutterBlink";
import RoomHotspots from "./RoomHotspots";
import GameHUD from "./GameHUD";

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
    activeTransitionVolume,
    handleTransitionEnd,
    handleVideoTimeUpdate,
    isShutterActive,
    sceneTitleProps,
    recentDropId,
    isDropAnimating
  } = useGame();

  const inCombat = gameState.combat?.inCombat;
  const showStats = !gameState.isQuestLogOpen;
  const isShakeEffect = ["damage", "warning", "clash"].includes(feedback?.type || "");

  const viewportRef = useRef<HTMLDivElement>(null);
  const transitionVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isShakeEffect && viewportRef.current) {
      viewportRef.current.classList.remove("animate-shake");
      void viewportRef.current.offsetWidth;
      viewportRef.current.classList.add("animate-shake");
    }
  }, [feedback?.id, isShakeEffect]);

  useEffect(() => {
    if (transitionVideoRef.current) {
      transitionVideoRef.current.volume = activeTransitionVolume;
    }
  }, [activeTransitionVolume, activeTransitionVideo]);


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
                  ref={transitionVideoRef}
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
            recentDropId={recentDropId}
            isDropAnimating={isDropAnimating}
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
      <GameHUD
        gameState={gameState}
        currentRoom={currentRoom}
        isWideScreen={isWideScreen}
        isWalking={isWalking}
        inCombat={inCombat || false}
        showStats={showStats}
        isEnemyRevealed={isEnemyRevealed}
        hasInspected={hasInspected}
        attackPower={attackPower}
        defensePower={defensePower}
        feedback={feedback}
        walkingDirection={walkingDirection || null}
        walkStepScale={walkStepScale}
        sceneTitleProps={sceneTitleProps}
        onMove={handleMove}
        onInspectRoom={inspectRoom}
        onTakeItem={takeItem}
        onAttack={startCombat}
        onCombatAction={handleCombatAction}
        setQuestLogOpen={setQuestLogOpen}
        setViewingItemId={setViewingItemId}
      />

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
