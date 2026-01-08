import React from "react";
import { useGameStore } from "../store/useGameStore";

const GameOver: React.FC = () => {
  const { restartGame } = useGameStore((state) => state.actions);

  return (
    <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center animate-blood-vignette overflow-hidden">
      <div className="flex flex-col items-center gap-32 animate-fade-in delay-700 opacity-0">
        <h1 className="text-8xl md:text-9xl font-medieval text-red-700 tracking-tighter animate-you-died drop-shadow-[0_0_30px_rgba(0,0,0,1)] uppercase">
          You Died
        </h1>

        <button
          onClick={restartGame}
          className="text-slate-200 hover:text-white transition-colors cursor-pointer p-2"
        >
          <span className="text-2xl tracking-[0.3em] uppercase border-b border-transparent hover:border-white/50 pb-1 font-medieval">
            PLAY AGAIN
          </span>
        </button>
      </div>
    </div>
  );
};

export default GameOver;
