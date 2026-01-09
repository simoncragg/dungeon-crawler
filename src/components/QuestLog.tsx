import { useRef, useEffect } from "react";
import { X } from "lucide-react";
import useSoundFx from "../hooks/useSoundFx";
import type { LogEntry } from "../types";

interface QuestLogProps {
  questLog: LogEntry[];
  onClose: () => void;
}

export default function QuestLog({ questLog, onClose }: QuestLogProps) {
  const { playSoundFile } = useSoundFx();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    playSoundFile({ path: "inspect.mp3" }, { volume: 0.5 });
  }, [playSoundFile]);

  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const roomTitles = container.querySelectorAll('[data-room-title="true"]');

      if (roomTitles.length > 0) {
        const lastTitle = roomTitles[roomTitles.length - 1] as HTMLElement;
        const targetScroll = lastTitle.offsetTop - container.offsetTop;

        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [questLog]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      {/* Matched to ItemModal Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-slate-900/50 border border-emerald-900/30 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden backdrop-blur-md animate-in zoom-in-95 duration-300">
        {/* Centered Header without Icon */}
        <div className="relative flex items-center justify-center p-6 border-b border-white/5 shrink-0 bg-slate-900/80">
          <h2 className="text-xl font-medieval text-slate-400 tracking-[0.3em] uppercase mt-1 opacity-80">
            Quest Log
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area with massive bottom padding for anchoring */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 bg-black/60 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent pb-[40vh]"
        >
          {questLog.length === 0 ? (
            <p className="text-center text-slate-500 italic py-12 font-serif">The pages of your journey are yet to be written...</p>
          ) : (
            questLog.map((entry) => {
              switch (entry.type) {
                case "room-title":
                  return (
                    <div key={entry.id} data-room-title="true" className="pt-8 first:pt-0 mb-8 overflow-visible">
                      <h3 className="text-2xl font-medieval text-emerald-500 tracking-[0.2em] uppercase text-center mb-3">
                        {entry.text}
                      </h3>
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-900 to-transparent opacity-60" />
                    </div>
                  );
                case "room-description":
                  return (
                    <p key={entry.id} className="text-lg text-slate-300 leading-relaxed italic text-center px-4">
                      {entry.text}
                    </p>
                  );
                case "narration":
                  return (
                    <p key={entry.id} className="text-lg text-emerald-100/90 leading-relaxed text-center italic font-serif">
                      "{entry.text}"
                    </p>
                  );
                case "danger":
                case "warning":
                  return (
                    <p key={entry.id} className="text-red-400 font-bold tracking-tight text-center">
                      {entry.text}
                    </p>
                  );
                case "success":
                  return (
                    <p key={entry.id} className="text-emerald-400 font-bold tracking-tight text-center">
                      {entry.text}
                    </p>
                  );
                default:
                  return (
                    <p key={entry.id} className="text-slate-400 text-sm tracking-wide text-center uppercase opacity-60">
                      {entry.text}
                    </p>
                  );
              }
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/40 text-center border-t border-white/5 shrink-0">
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
