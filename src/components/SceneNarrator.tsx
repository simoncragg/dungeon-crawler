import { useEffect, useState } from "react";
import type { Room } from "../types";

interface SceneNarratorProps {
  currentRoom: Room;
  onContinue: () => void;
}

export default function SceneNarrator({ currentRoom, onContinue }: SceneNarratorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    setIsExpanded(false);
    return () => setIsVisible(false);
  }, [currentRoom.id]);

  useEffect(() => {
    if (isExpanded) {
      const scrollTimer = setTimeout(() => setIsScrollable(true), 500);
      const narrativeTimer = setTimeout(() => setShowNarrative(true), 300);
      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(narrativeTimer);
      };
    } else {
      setIsScrollable(false);
      setShowNarrative(false);
    }
  }, [isExpanded]);

  const hasNarrative = currentRoom.narrative && currentRoom.narrative.length > 0;

  return (
    <div className={`flex flex-col items-center justify-end h-full transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div
        className={`
          relative w-full max-w-2xl 
          flex flex-col items-center transition-all duration-500 ease-in-out pt-8 [scrollbar-gutter:stable] overflow-hidden
          ${isExpanded ? 'h-[85vh] justify-start' : 'h-64 justify-start'}
        `}
      >
        {/* Gradient Layer (Always visible base) */}
        <div className={`absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/90 to-transparent pointer-events-none transition-all duration-500 rounded-b-3xl ${isExpanded ? 'rounded-t-3xl' : 'rounded-t-none'}`} />

        {/* Solid Layer (Fades in on expand) */}
        <div
          className={`
            absolute inset-0 bg-slate-950/95 shadow-top pointer-events-none transition-all duration-500 rounded-b-3xl
            ${isExpanded ? 'opacity-100 rounded-t-3xl' : 'opacity-0 rounded-t-none'}
          `}
        />

        {/* Content Container */}
        <div className="px-8 w-full flex flex-col items-center relative z-10 flex-1 min-h-0">

          <div className={`w-full flex justify-center shrink-0 transition-all duration-500 ${isExpanded ? 'border-b border-slate-800/50 pb-6 mb-6' : 'mb-4'}`}>
            <h2 className="text-3xl font-serif text-emerald-500 tracking-widest uppercase drop-shadow-lg text-center">
              {currentRoom.name}
            </h2>
          </div>

          {!isExpanded ? (
            <p className="text-xl text-slate-200 font-sans leading-relaxed drop-shadow-md text-center max-w-xl mt-4">
              {currentRoom.description}
            </p>
          ) : (
            <div className={`space-y-6 text-lg text-slate-300 font-sans leading-relaxed max-w-xl pb-6 mt-4 transition-opacity duration-700 w-full flex-1 ${showNarrative ? 'opacity-100' : 'opacity-0'} ${isScrollable ? 'overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent' : 'overflow-hidden'}`}>
              {currentRoom.narrative?.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div
          className={`
            w-full flex justify-center py-6 shrink-0 z-20 border-t border-slate-800/50 mt-auto transition-all duration-500
            ${isExpanded ? 'opacity-100 delay-500' : 'opacity-100'}
          `}
        >
          {isExpanded ? (
            <button
              onClick={onContinue}
              className="pointer-events-auto text-slate-500 hover:text-slate-300 transition-colors cursor-pointer p-2"
              aria-label="Close"
            >
              <span className="text-sm tracking-widest uppercase border-b border-transparent hover:border-slate-500/50 pb-1">Close</span>
            </button>
          ) : (
            <div className="flex items-center gap-4">
              {hasNarrative && (
                <>
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer p-2"
                    aria-label="More"
                  >
                    <span className="text-sm tracking-widest uppercase border-b border-transparent hover:border-emerald-400/50 pb-1 font-bold">More</span>
                  </button>
                  <span className="text-slate-600">|</span>
                </>
              )}
              <button
                onClick={onContinue}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-2"
                aria-label="Skip"
              >
                <span className="text-sm tracking-widest uppercase border-b border-transparent hover:border-white/50 pb-1">Skip</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Background click to dismiss */}
      <div className="absolute inset-0 -z-10" onClick={onContinue} />
    </div>
  );
}
