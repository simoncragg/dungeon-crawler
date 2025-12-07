import React from "react";
import { Shield, Sword } from "lucide-react";

import type { CombatState } from "../types";
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
  onAction: (action: "ATTACK" | "BLOCK") => void;
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

        <div className="flex gap-4">
          <button
            disabled={combat.isProcessing}
            onClick={() => onAction("BLOCK")}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(0,100,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-blue-100 font-medieval font-bold"
          >
            <Shield size={18} />
            BLOCK
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
