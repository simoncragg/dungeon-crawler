import { useRef, useEffect } from "react";

import GameHUD from "./GameHUD";
import ItemModal from "./ItemModal";
import QuestLog from "./QuestLog";
import RoomHotspots from "./RoomHotspots";
import ShutterBlink from "./ShutterBlink";
import WeaponOverlay from "./WeaponOverlay";

import { useGame } from "../hooks/useGame";
import { useGameStore } from "../store/useGameStore";
import { getPreloadedUrl } from "../utils/assetLoader";

export default function Game() {
  const { gameState, actions } = useGameStore();
  const {
    viewingItemId,
    setViewingItemId,
    currentRoom,
    isWalking,
    handleMove,
    takeItem,
    dropItem,
    equipItem,
    unequipItem,
    handleUseItem,
    startCombat,
    handleCombatAction,
    videoRef,
    activeTransitionVideo,
    handleTransitionEnd,
    handleVideoTimeUpdate,
    isShutterActive,
    handleDropOnHotspot,
    visibleRoom,
    sceneTitleProps
  } = useGame();

  const { isEnemyRevealed, feedback } = gameState;
  const inCombat = gameState.combat?.inCombat;
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
    if (activeTransitionVideo && transitionVideoRef.current) {
      transitionVideoRef.current.volume = activeTransitionVideo.volume ?? 0.4;
      transitionVideoRef.current.currentTime = 0;
      transitionVideoRef.current.play().catch(err => {
        console.warn("Transition video play failed:", err);
      });
    }
  }, [activeTransitionVideo]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'd') {
        actions.setDebugMode(!gameState.isDebugMode);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState.isDebugMode, actions]);

  return (
    <div
      className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative"
      onDragOver={(e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      }}
      onDragEnter={(e) => e.preventDefault()}
    >

      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        <div className="absolute inset-0 z-0">
          <img
            src={getPreloadedUrl(visibleRoom.image)}
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

            <img
              src={getPreloadedUrl(visibleRoom.image)}
              alt={visibleRoom.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {visibleRoom.videoLoop && (
              <video
                ref={videoRef}
                src={getPreloadedUrl(visibleRoom.videoLoop.path)}
                autoPlay
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Active Transition Video */}
            {activeTransitionVideo && (
              <video
                ref={transitionVideoRef}
                src={getPreloadedUrl(activeTransitionVideo.path)}
                autoPlay
                muted={false}
                preload="auto"
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                onEnded={handleTransitionEnd}
                onTimeUpdate={handleVideoTimeUpdate}
              />
            )}
          </div>

          {/* Hotspots */}
          <RoomHotspots
            handleMove={handleMove}
            takeItem={takeItem}
            handleDropOnHotspot={handleDropOnHotspot}
          />

          {/* Enemy Sprite */}
          {
            currentRoom.enemy && (isEnemyRevealed || inCombat) && (
              <div className="absolute inset-0 z-20 flex items-end justify-center pointer-events-none">
                <div
                  key="enemy-sprite"
                  className={`transition-all duration-1000 ease-in drop-shadow-2xl ${gameState.combat?.enemyAction === 'DAMAGE' ? 'drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]' :
                    gameState.combat?.enemyAction === 'STAGGER_HIT' ? 'drop-shadow-[0_0_30px_rgba(255,0,0,0.9)] brightness-125' :
                      gameState.combat?.enemyAction === 'DEFEAT' ? 'animate-defeat' :
                        gameState.combat?.enemyAction === 'STAGGER' ? 'animate-stagger' :
                          (['IDLE', 'TELEGRAPH', 'BLOCK'].includes(gameState.combat?.enemyAction || '') || !gameState.combat) ? 'animate-breathe' : ''
                    }`}
                >
                  <img
                    src={getPreloadedUrl(gameState.combat?.enemyImage || `/images/enemies/${currentRoom.enemy.id}-idle.png`)}
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
        onMove={handleMove}
        onTakeItem={takeItem}
        onAttack={startCombat}
        onCombatAction={handleCombatAction}
        setViewingItemId={setViewingItemId}
        sceneTitleProps={sceneTitleProps}
      />

      {/* --- MODALS (Global Overlay) --- */}
      {
        viewingItemId && (
          <ItemModal
            itemId={viewingItemId}
            isEquipped={gameState.equippedItems.weapon === viewingItemId || gameState.equippedItems.armor === viewingItemId}
            onClose={() => setViewingItemId(null)}
            onUse={handleUseItem}
            onEquip={equipItem}
            onUnequip={unequipItem}
            onDrop={dropItem}
            canUnequip={gameState.inventory.items.some((i: string | null) => i === null)}
            isDroppable={!isWalking}
            isUsable={!isWalking}
          />
        )
      }

      {gameState.isQuestLogOpen && (
        <QuestLog
          questLog={gameState.questLog}
          onClose={() => actions.setQuestLogOpen(false)}
        />
      )}

      <ShutterBlink isActive={isShutterActive} />
    </div>
  );
}
