import React from "react";
import { Shield, Sword, Crosshair, Zap } from "lucide-react";

import type { CombatState, PlayerCombatAction } from "../types";
import FighterStats from "./FighterStats";

interface CombatScreenProps {
  combat: CombatState;
  enemy: {
    name: string;
    maxHp: number;
    hp: number;
    attack: number;
    defense: number;
    image?: string;
  };
  player: {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
  };
  onAction: (action: PlayerCombatAction) => void;
}

const CombatScreen: React.FC<CombatScreenProps> = ({
  combat,
  enemy,
  player,
  onAction,
}) => {

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">

      <FighterStats
        name="Player"
        hp={player.hp}
        maxHp={player.maxHp}
        attack={player.attack}
        defense={player.defense}
        className="absolute bottom-12 left-8"
      />

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-2 mb-2">
        <div className={`h-8 text-yellow-400 font-bold text-lg md:text-xl tracking-wide transition-all duration-300 drop-shadow-md mb-4 ${combat.lastResult ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {combat.lastResult?.message || "..."}
        </div>

        <div className="px-3 py-1 bg-black/70 border border-slate-800 rounded-full text-slate-500 text-sm font-mono tracking-[0.2em] mb-2">
          TURN {combat.round.toString().padStart(2, "0")}
        </div>

        {combat.canRiposte ? (
          <button
            disabled={combat.isProcessing}
            onClick={() => onAction("RIPOSTE")}
            className="flex items-center gap-3 px-10 py-5 bg-gradient-to-b from-yellow-800 to-yellow-900 border-2 border-yellow-500 rounded hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,200,0,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-yellow-100 font-medieval font-bold text-2xl animate-pulse"
          >
            <Zap size={28} />
            RIPOSTE
          </button>
        ) : (
          <div className="flex gap-4">
            <button
              disabled={combat.isProcessing}
              onClick={() => onAction("BLOCK")}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(0,100,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-blue-100 font-medieval font-bold"
            >
              <Shield size={18} />
              BLOCK
            </button>

            <button
              disabled={combat.isProcessing}
              onClick={() => onAction("PARRY")}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-b from-amber-900 to-amber-950 border-2 border-amber-800 rounded hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-[0_0_15px_rgba(255,165,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-amber-100 font-medieval font-bold"
            >
              <Crosshair size={18} />
              PARRY
            </button>

            <button
              disabled={combat.isProcessing}
              onClick={() => onAction("ATTACK")}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-b from-red-900 to-red-950 border-2 border-red-900 rounded hover:-translate-y-0.5 hover:border-red-500 hover:shadow-[0_0_15px_rgba(255,0,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-red-100 font-medieval font-bold"
            >
              <Sword size={18} />
              STRIKE
            </button>
          </div>
        )}
      </div>

      <FighterStats
        name={enemy.name}
        hp={enemy.hp}
        maxHp={enemy.maxHp}
        attack={enemy.attack}
        defense={enemy.defense}
        className="absolute bottom-4 right-4 md:bottom-8 md:right-8"
      />

    </div>
  );
};

export default CombatScreen;
