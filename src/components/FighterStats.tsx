import React from "react";
import { Shield, Sword } from "lucide-react";

interface FighterStatsProps {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  className?: string;
}

const FighterStats: React.FC<FighterStatsProps> = ({
  name,
  hp,
  maxHp,
  attack,
  defense,
  className = ""
}) => {
  return (
    <div className={`w-64 bg-slate-900/80 border border-slate-700 rounded-lg p-3 backdrop-blur-sm shadow-top pointer-events-auto flex flex-col gap-2 ${className}`}>

      <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider">
        <span>{name}</span>
        <span>HP {hp}/{maxHp}</span>
      </div>

      <div className="w-full h-3 bg-slate-800 border border-black rounded-sm overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-red-900 to-red-600 transition-all duration-500 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%` }}
        />
      </div>

      <div className="flex gap-4 font-mono text-sm mt-1">
        <div className="flex items-center gap-1 text-red-400">
          <Sword size={14} />
          <span className="font-bold">{attack}</span>
          <span className="text-[10px] opacity-70">ATK</span>
        </div>
        <div className="flex items-center gap-1 text-blue-400">
          <Shield size={14} />
          <span className="font-bold">{defense}</span>
          <span className="text-[10px] opacity-70">DEF</span>
        </div>
      </div>
    </div>
  );
};

export default FighterStats;
