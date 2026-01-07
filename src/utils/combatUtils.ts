import type {
  GameState,
  CombatAction,
  EquippedItem,
  EquippedWeapon,
  PlayerCombatAction,
  CombatOutcome,
  ResolveCombatTurnParams,
  SoundAsset
} from "../types";
import { ITEMS } from "../data/gameData";

export const isWindupAction = (action: PlayerCombatAction) => {
  return ["ATTACK", "BLOCK", "RIPOSTE"].includes(action);
};

export const getEnemyAction = (playerAction: PlayerCombatAction, currentEnemyAction?: CombatAction): CombatAction => {
  if (playerAction === "RIPOSTE") {
    return "STAGGER";
  }

  if (currentEnemyAction === "TELEGRAPH") {
    return "ATTACK";
  }

  const moves: CombatAction[] = ["ATTACK", "ATTACK", "ATTACK", "BLOCK", "IDLE"];
  return moves[Math.floor(Math.random() * moves.length)];
};

export const getLungeDelay = (action: string, isSuccessfulParry: boolean) => {
  if (action === "PARRY") return isSuccessfulParry ? 600 : 300;
  if (action === "RIPOSTE") return 200;
  if (["ATTACK", "BLOCK", "IDLE"].includes(action)) return 500;
  return 0;
};

export const isSuccessfulParry = (playerWeapon: EquippedWeapon | EquippedItem | null, gameState: GameState) => {
  const baseParry = 0.2;
  const weaponParry = playerWeapon?.stats.parryChance || 0;
  const playerArmorId = gameState.equippedItems.armor;
  const playerArmor = playerArmorId ? (ITEMS[playerArmorId] as EquippedItem) : null;
  const armorParry = playerArmor?.stats.parryChance || 0;
  const totalParryChance = baseParry + weaponParry + armorParry;
  return Math.random() < totalParryChance;
};


export const calculateDamage = (atk: number, def: number = 0) => {
  return Math.max(0, Math.floor(atk - def));
};

export const getCombatSound = (
  type: "attack" | "crit" | "block" | "clash",
  playerWeapon: EquippedWeapon | EquippedItem | null
): SoundAsset => {
  const sounds = playerWeapon?.sounds;
  switch (type) {
    case "attack": return sounds?.attack ?? { path: "sword-combat-attack.mp3" };
    case "crit": return sounds?.crit ?? { path: "sword-combat-crit.wav" };
    case "block": return sounds?.block ?? { path: "sword-combat-block.wav" };
    case "clash": return sounds?.clash ?? { path: "sword-combat-clash.wav" };
    default: return { path: "" };
  }
};

export const resolveStagger = (
  pAtk: number,
  eDef: number,
  playerWeapon: EquippedWeapon | EquippedItem | null,
  outcome: CombatOutcome
): CombatOutcome => {
  const dmg = calculateDamage(pAtk * 1.5, eDef * 0.5);
  const logMsg = `STAGGERED! You strike for ${dmg} damage!`;
  return {
    ...outcome,
    enemyDamageTaken: dmg,
    logMsg,
    logType: "success",
    combatResult: { type: "hit", message: logMsg },
    soundToPlay: getCombatSound("attack", playerWeapon),
    finalEnemyAction: "STAGGER_HIT"
  };
};

export const resolveAttackIdleEnemy = (
  pAtk: number,
  playerWeapon: EquippedWeapon | EquippedItem | null,
  outcome: CombatOutcome
): CombatOutcome => {
  const dmg = calculateDamage(pAtk, 0);
  const logMsg = `CRIT! You hit for ${dmg} damage!`;
  return {
    ...outcome,
    enemyDamageTaken: dmg,
    logMsg,
    logType: "success",
    combatResult: { type: "crit", message: logMsg },
    soundToPlay: getCombatSound("crit", playerWeapon)
  };
};

export const resolveAttackEnemyBlock = (
  pAtk: number,
  eDef: number,
  playerWeapon: EquippedWeapon | EquippedItem | null,
  outcome: CombatOutcome
): CombatOutcome => {
  const dmg = calculateDamage(pAtk, eDef);
  const logMsg = dmg > 0
    ? `Blocked! You hit for ${dmg} damage.`
    : "Blocked! No damage.";
  return {
    ...outcome,
    enemyDamageTaken: dmg,
    logMsg,
    logType: "info",
    combatResult: { type: "block", message: logMsg },
    soundToPlay: getCombatSound("block", playerWeapon)
  };
};

export const resolveAttackEnemyAttack = (
  pAtk: number,
  eAtk: number,
  playerWeapon: EquippedWeapon | EquippedItem | null,
  outcome: CombatOutcome
): CombatOutcome => {
  const pDmg = calculateDamage(eAtk * 0.5, 0);
  const eDmg = calculateDamage(pAtk * 0.5, 0);
  const logMsg = "CLASH! Weapons collide!";
  return {
    ...outcome,
    playerDamageTaken: pDmg,
    enemyDamageTaken: eDmg,
    logMsg,
    logType: "clash",
    combatResult: { type: "clash", message: logMsg },
    soundToPlay: getCombatSound("clash", playerWeapon)
  };
};

export const resolveAttack = (
  pAtk: number,
  eAtk: number,
  eDef: number,
  enemyAction: CombatAction,
  playerWeapon: EquippedWeapon | EquippedItem | null,
  outcome: CombatOutcome
): CombatOutcome => {
  switch (enemyAction) {
    case "IDLE": return resolveAttackIdleEnemy(pAtk, playerWeapon, outcome);
    case "BLOCK": return resolveAttackEnemyBlock(pAtk, eDef, playerWeapon, outcome);
    case "ATTACK": return resolveAttackEnemyAttack(pAtk, eAtk, playerWeapon, outcome);
  }

  return outcome;
};

export const resolveParrySuccess = (
  playerWeapon: EquippedWeapon | EquippedItem | null,
  outcome: CombatOutcome
): CombatOutcome => {
  const logMsg = "PARRIED! Enemy staggered!";
  return {
    ...outcome,
    logMsg,
    logType: "success",
    combatResult: { type: "parry", message: logMsg },
    riposteAvailable: true,
    finalEnemyAction: "STAGGER",
    soundToPlay: getCombatSound("clash", playerWeapon)
  };
};

export const resolveParryFail = (
  eAtk: number,
  pDef: number,
  outcome: CombatOutcome
): CombatOutcome => {
  const pDmg = calculateDamage(eAtk, pDef * 0.5);
  const logMsg = "Parry Failed! You took a heavy hit!";
  return {
    ...outcome,
    playerDamageTaken: pDmg,
    logMsg,
    logType: "damage",
    combatResult: { type: "miss", message: logMsg },
    soundToPlay: { path: "crit-damage.mp3" }
  };
};

export const resolveBlock = (
  enemyAction: CombatAction,
  eAtk: number,
  pDef: number,
  playerWeapon: EquippedWeapon | EquippedItem | null,
  outcome: CombatOutcome
): CombatOutcome => {
  if (enemyAction === "ATTACK") {
    const pDmg = calculateDamage(eAtk * 0.5, pDef);
    const logMsg = pDmg > 0
      ? `Blocked! Took ${pDmg} damage.`
      : "Perfect Block!";
    return {
      ...outcome,
      playerDamageTaken: pDmg,
      logMsg,
      logType: pDmg > 0 ? "damage" : "success",
      combatResult: { type: "block", message: logMsg },
      soundToPlay: getCombatSound("block", playerWeapon)
    };
  }

  const logMsg = "Both hesitated...";
  return {
    ...outcome,
    logMsg,
    logType: "miss",
    combatResult: { type: "miss", message: logMsg }
  };
};

export const resolveParry = (
  enemyAction: CombatAction,
  eAtk: number,
  pDef: number,
  playerWeapon: EquippedWeapon | EquippedItem | null,
  outcome: CombatOutcome
): CombatOutcome => {
  if (enemyAction === "ATTACK") {
    return outcome.successfulParry
      ? resolveParrySuccess(playerWeapon, outcome)
      : resolveParryFail(eAtk, pDef, outcome);
  }

  const logMsg = "Parry failed... nothing to parry.";
  return {
    ...outcome,
    logMsg,
    logType: "miss",
    combatResult: { type: "miss", message: logMsg }
  };
};

export const resolveRiposte = (
  pAtk: number,
  playerWeapon: EquippedWeapon | EquippedItem | null,
  outcome: CombatOutcome
): CombatOutcome => {
  const critChance = (playerWeapon as EquippedWeapon)?.stats?.critChance || 0;
  const isCrit = Math.random() < critChance;
  const multiplier = isCrit ? 2.0 : 1.5;
  const enemyDamageTaken = calculateDamage(pAtk * multiplier, 0);
  const logMsg = isCrit
    ? `RIPOSTE! Critical Hit for ${enemyDamageTaken} damage!`
    : `Riposte hit for ${enemyDamageTaken} damage!`;

  return {
    ...outcome,
    enemyDamageTaken,
    logMsg,
    logType: "success",
    combatResult: { type: isCrit ? "crit" : "hit", message: logMsg },
    soundToPlay: getCombatSound(isCrit ? "crit" : "attack", playerWeapon),
    finalEnemyAction: "STAGGER_HIT"
  };
};

export const resolveIdle = (
  enemyAction: CombatAction,
  eAtk: number,
  outcome: CombatOutcome
): CombatOutcome => {
  if (enemyAction === "ATTACK") {
    const pDmg = calculateDamage(eAtk, 0);
    const logMsg = `You stood still! Took ${pDmg} damage!`;
    return {
      ...outcome,
      playerDamageTaken: pDmg,
      logMsg,
      logType: "danger",
      combatResult: { type: "miss", message: logMsg },
      soundToPlay: { path: "crit-damage.mp3" }
    };
  } else {
    return {
      ...outcome,
      logMsg: "You both wait for an opening...",
      logType: "info"
    };
  }
};

export const resolveCombatTurn = ({
  playerAction,
  enemyAction,
  gameState,
  playerWeapon,
  enemy,
  successfulParry
}: ResolveCombatTurnParams): CombatOutcome => {
  const outcome: CombatOutcome = {
    playerDamageTaken: 0,
    enemyDamageTaken: 0,
    logMsg: "",
    logType: "combat",
    combatResult: null,
    riposteAvailable: false,
    soundToPlay: { path: "" },
    finalEnemyAction: enemyAction,
    successfulParry
  };

  const pAtk = gameState.attack;
  const pDef = gameState.defense;
  const eAtk = enemy.attack;
  const eDef = enemy.defense;

  if (enemyAction === "STAGGER" && playerAction !== "IDLE") {
    return resolveStagger(pAtk, eDef, playerWeapon, outcome);
  }

  let finalOutcome: CombatOutcome;

  switch (playerAction) {
    case "RIPOSTE":
      finalOutcome = resolveRiposte(pAtk, playerWeapon, outcome);
      break;
    case "ATTACK":
      finalOutcome = resolveAttack(pAtk, eAtk, eDef, enemyAction, playerWeapon, outcome);
      break;
    case "BLOCK":
      finalOutcome = resolveBlock(enemyAction, eAtk, pDef, playerWeapon, outcome);
      break;
    case "PARRY":
      finalOutcome = resolveParry(enemyAction, eAtk, pDef, playerWeapon, outcome);
      break;
    default:
      finalOutcome = resolveIdle(enemyAction, eAtk, outcome);
      break;
  }

  const isFatal = enemy.hp - finalOutcome.enemyDamageTaken <= 0;
  if (isFatal && finalOutcome.enemyDamageTaken > 0) {
    finalOutcome.soundToPlay = getCombatSound("attack", playerWeapon);
  }

  return finalOutcome;
};
