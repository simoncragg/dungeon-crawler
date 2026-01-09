import { useGameStore } from "../store/useGameStore";

const StageComplete: React.FC = () => {
  const { restartGame } = useGameStore((state) => state.actions);

  return (
    <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden">
      {/* Soft-edged Backdrop Filter */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] animate-fade-in"
        style={{ maskImage: 'radial-gradient(circle, black 30%, transparent 80%)', WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 80%)' }}
      />

      <div className="relative flex flex-col items-center gap-12 animate-fade-in">
        <div className="text-center space-y-8">
          <h1 className="text-6xl md:text-8xl font-medieval text-emerald-400 tracking-tighter drop-shadow-md uppercase">
            Stage Complete
          </h1>
          <div className="flex items-center justify-center gap-4 text-slate-400/90 font-medieval font-medium tracking-[0.5em] italic text-[13px] uppercase drop-shadow-[0_0_8px_rgba(0,0,0,1)]">
            <span className="w-8 h-px bg-white/10" />
            <span>The journey has only just begun</span>
            <span className="w-8 h-px bg-white/10" />
          </div>
        </div>

        <div className="max-w-xl text-center text-slate-200 text-xl leading-relaxed font-serif italic drop-shadow-md">
          “You step out into the dappled light of the Great Forest, free at last. The path is now yours, but where will it lead?”
        </div>

        <div className="flex flex-col items-center gap-10 mt-6">
          <div className="text-amber-500 font-medieval tracking-[0.4em] text-lg uppercase">
            Next Chapter Coming Soon
          </div>

          <button
            onClick={restartGame}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer p-2 group"
          >
            <span className="text-2xl tracking-[0.3em] font-medieval uppercase border-b border-transparent group-hover:border-white/50 pb-1 transition-all">
              PLAY AGAIN
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageComplete;
