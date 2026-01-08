import React from "react";
import { getPreloadedUrl } from "../utils/assetLoader";
import type { CombatState, Room } from "../types";

interface EnemyProps {
  enemy: NonNullable<Room["enemy"]>;
  isEnemyRevealed: boolean;
  inCombat: boolean;
  combat: CombatState | null;
}

const getEnemyClasses = (action?: string, inCombat?: boolean) => {
  const base = "transition-all duration-1000 ease-in drop-shadow-2xl";

  if (!inCombat) return `${base} animate-breathe`;

  switch (action) {
    case 'DAMAGE':
      return `${base} drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]`;
    case 'STAGGER_HIT':
      return `${base} drop-shadow-[0_0_30px_rgba(255,0,0,0.9)] brightness-125`;
    case 'DEFEAT':
      return `${base} animate-defeat`;
    case 'STAGGER':
      return `${base} animate-stagger`;
    case 'IDLE':
    case 'TELEGRAPH':
    case 'BLOCK':
      return `${base} animate-breathe`;
    default:
      return base;
  }
};

const Enemy: React.FC<EnemyProps> = ({
  enemy,
  isEnemyRevealed,
  inCombat,
  combat
}) => {
  if (!isEnemyRevealed && !inCombat) return null;

  const enemyAction = combat?.enemyAction;
  const enemyImage = combat?.enemyImage || `/images/enemies/${enemy.id}-idle.png`;

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center pointer-events-none">
      <div
        key="enemy-sprite"
        className={getEnemyClasses(enemyAction, !!combat)}
      >
        <img
          src={getPreloadedUrl(enemyImage)}
          alt={enemy.name}
          className="h-[80vh] object-contain transition-all duration-100"
        />
      </div>
    </div>
  );
};

export default Enemy;
