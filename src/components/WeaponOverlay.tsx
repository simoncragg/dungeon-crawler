import React from "react";
import { ITEMS } from "../data/gameData";
import type { CombatState } from "../types";

interface WeaponOverlayProps {
  weaponId: string | null;
  brightness?: number;
  combat?: CombatState;
}

const POSES = {
  CLASH: "translate(-118%, 2%) scale(1.5) rotate(-15deg)",
  BLOCK_PRE: "perspective(500px) translate(-220%, 18%) scale(2.0)",
  BLOCK_POST: "perspective(500px) translate(-220%, 40%) rotateX(-10deg) rotateZ(25deg) scale(2.0)",
};

interface WeaponOverlayResult {
  activePose: string;
  currentAnimation: string;
  transitionSpeed: string;
}

interface WeaponOverlayStrategy {
  name: string;
  matches: (combat: CombatState | undefined) => boolean;
  getResult: (combat: CombatState | undefined) => WeaponOverlayResult;
}

const weaponOverlayStrategies: WeaponOverlayStrategy[] = [
  {
    name: "Clash",
    matches: (combat) => {
      const resultType = combat?.lastResult?.type;
      const isClash = resultType === "clash";
      const isDefeated = combat?.enemyAction === "DEFEAT";
      return !!(isClash && !isDefeated);
    },
    getResult: () => ({
      activePose: POSES.CLASH,
      currentAnimation: "none",
      transitionSpeed: "0.1s",
    }),
  },
  {
    name: "Block",
    matches: (combat) => combat?.isProcessing === true && combat?.playerAction === "BLOCK",
    getResult: (combat) => {
      const resultType = combat?.lastResult?.type;
      const activePose = resultType === "block" ? POSES.BLOCK_POST : POSES.BLOCK_PRE;
      return {
        activePose,
        currentAnimation: "none",
        transitionSpeed: "0.1s",
      };
    },
  },
  {
    name: "Riposte",
    matches: (combat) => combat?.isProcessing === true && combat?.playerAction === "RIPOSTE",
    getResult: () => ({
      activePose: "",
      currentAnimation: "riposte 0.4s linear forwards",
      transitionSpeed: "0s",
    }),
  },
  {
    name: "Parry",
    matches: (combat) =>
      (combat?.isProcessing === true && combat?.playerAction === "PARRY") ||
      (combat?.lastResult?.type === "parry"),
    getResult: () => {
      return {
        activePose: "",
        currentAnimation: "parry 1.0s linear forwards",
        transitionSpeed: "0s",
      };
    },
  },
  {
    name: "Attack",
    matches: (combat) => combat?.isProcessing === true && combat?.playerAction === "ATTACK",
    getResult: () => ({
      activePose: "",
      currentAnimation: "strike 0.8s linear forwards",
      transitionSpeed: "0s",
    }),
  },
  {
    name: "Idle",
    matches: () => true,
    getResult: () => ({
      activePose: "",
      currentAnimation: "breathe 4s ease-in-out infinite",
      transitionSpeed: "0.5s",
    }),
  },
];

const WeaponOverlay = ({ weaponId, brightness = 0.3, combat }: WeaponOverlayProps) => {
  const equippedWeaponId = weaponId;

  if (!equippedWeaponId) return null;

  const weaponItem = ITEMS[equippedWeaponId];
  if (!weaponItem || !weaponItem.image) return null;

  const config = weaponItem.overlayConfig || {
    width: "300px",
    right: "5%",
    bottom: "5%",
    rotation: "0deg",
  };

  const activeStrategy = weaponOverlayStrategies.find(s => s.matches(combat))!;
  const { activePose, currentAnimation, transitionSpeed } = activeStrategy.getResult(combat);

  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 20,
    transition: `all ${transitionSpeed} ease-out`,
    right: config.right,
    bottom: config.bottom,
    width: config.width,
    animation: currentAnimation,
    transform: activePose,
    transformOrigin: "bottom right",
  };

  const imageStyle: React.CSSProperties = {
    width: "100%",
    height: "auto",
    display: "block",
    transform: `rotate(${config.rotation || "0deg"})`,
    transformOrigin: "bottom right",
    filter: `brightness(${brightness})`,
  };

  return (
    <div style={wrapperStyle}>
      <img
        src={weaponItem.image}
        alt={weaponItem.name}
        style={imageStyle}
        className="object-contain"
      />
    </div>
  );
}

export default WeaponOverlay;
