import { ITEMS } from "../data/gameData";
import type { CombatAction } from "../types";

export const getStats = (equipped: { weapon: string | null; armor: string | null }) => {
  const attack = 5 + (equipped.weapon ? (ITEMS[equipped.weapon].stats?.attack || 0) : 0);
  const defense = 0 + (equipped.armor ? (ITEMS[equipped.armor].stats?.defense || 0) : 0);
  return { attack, defense };
};

export const getEnemyImage = (enemyId: string, action: CombatAction = "IDLE") => {
  if (action === "STAGGER_HIT" || action === "STAGGER") {
    return `/images/enemies/${enemyId}-stagger.png`;
  }
  return `/images/enemies/${enemyId}-${action.toLowerCase()}.png`;
};
