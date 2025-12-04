import { Volume2, Monitor } from "lucide-react";

interface TitleScreenProps {
  onStart: () => void;
}

export default function TitleScreen({ onStart }: TitleScreenProps) {

  return (
    <div className="absolute inset-0 z-50 flex flex-col h-full bg-slate-950/90 text-slate-100 font-sans overflow-hidden items-center justify-center">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/scenes/dark-hallway.png"
          alt=""
          className="w-full h-full object-cover opacity-50 blur-sm animate-ken-burns"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col items-center gap-12 p-8 max-w-2xl text-center">

        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-emerald-100 via-emerald-500 to-emerald-800 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] font-serif tracking-wider filter">
            DUNGEON
            <br />
            CRAWLER
          </h1>

          <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

          <p className="mt-16 text-slate-400 text-xl md:text-2xl italic font-serif tracking-wide text-shadow-sm">
            "The dungeon does not judge. It simply consumes."
          </p>
        </div>

        <button
          onClick={onStart}
          className="text-slate-200 hover:text-white transition-colors cursor-pointer p-2 mt-4"
        >
          <span className="text-2xl tracking-[0.2em] uppercase border-b border-transparent hover:border-white/50 pb-1">
            Enter
          </span>
        </button>

        <div className="flex items-center gap-2 text-emerald-500/60 text-xs font-sans tracking-widest uppercase mt-4">
          Optimised for desktop <Monitor size={16} className="-ml-0.5 -mt-0.5" /> • Better with sound <Volume2 size={16} className="-ml-0.5 -mt-0.5" />
        </div>

        <div className="text-slate-600 text-sm font-mono uppercase tracking-widest">
          v1.0.0 • Simon Cragg • 2025
        </div>
      </div>
    </div>
  );
}
