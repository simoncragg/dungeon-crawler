import { useGameStore } from "../store/useGameStore";
import { Heart, Shield, Sword } from "lucide-react";
import StatChip from "./StatChip";

const PlayerStats: React.FC = () => {
  const { health, maxHealth, attack, defense } = useGameStore(state => state.gameState);
  return (
    <div className="flex items-center gap-2">
      <div className="w-32 bg-slate-900/50 h-10 rounded border border-slate-700 flex items-center px-3 gap-2 relative overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 bg-red-900/30 transition-all duration-300"
          style={{ width: `${(health / maxHealth) * 100}%` }}
        />
        <Heart size={16} className="text-red-400 relative z-10" fill="currentColor" />
        <div className="flex flex-col leading-none relative z-10">
          <span className="text-xs font-bold text-red-100">{health}</span>
          <span className="text-[10px] opacity-70 uppercase text-red-200">HP</span>
        </div>
      </div>

      <StatChip icon={Sword} value={attack} label="ATK" color="text-orange-400" />
      <StatChip icon={Shield} value={defense} label="DEF" color="text-blue-400" />
    </div>
  );
};

export default PlayerStats;
