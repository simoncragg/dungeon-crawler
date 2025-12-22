import { useEffect, useState, useRef } from "react";
import { Gem } from "lucide-react";
import useSoundFx from "../hooks/useSoundFx";

interface IntroProps {
  onComplete: () => void;
}

export default function Intro({ onComplete }: IntroProps) {
  const { playNarration } = useSoundFx();
  const [isScalingDown, setIsScalingDown] = useState(false);
  const [isGemVisible, setIsGemVisible] = useState(false);
  const [subtitle, setSubtitle] = useState<string>("");
  const [isSubtitleVisible, setIsSubtitleVisible] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState("duration-1000");
  const [showSkip, setShowSkip] = useState(false);

  const stopAudioRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (audioEnded && minTimeElapsed) {
      onComplete();
    }
  }, [audioEnded, minTimeElapsed, onComplete]);

  useEffect(() => {
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 1500);

    const gemTimer = setTimeout(() => {
      setIsGemVisible(true);
    }, 200);

    const scaleTimer = setTimeout(() => {
      setIsScalingDown(true);
    }, 1200);

    const subtitleTimer1 = setTimeout(() => {
      setSubtitle("The cage is open.");
      setIsSubtitleVisible(true);

      stopAudioRef.current = playNarration("/audio/narration/intro.mp3", 0.3, () => {
        setAudioEnded(true);
      });
    }, 2500);

    const fadeOutTimer1 = setTimeout(() => {
      setIsSubtitleVisible(false);
    }, 6500);

    const subtitleTimer2 = setTimeout(() => {
      setSubtitle("The path is yours.");
      setIsSubtitleVisible(true);
    }, 7500);

    const fadeOutTimer2 = setTimeout(() => {
      setIsSubtitleVisible(false);
    }, 11500);

    const subtitleTimer3 = setTimeout(() => {
      setTransitionDuration("duration-75");
      setSubtitle("Wake up!");
      setIsSubtitleVisible(true);
    }, 12800);

    const minTimeTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 13500);


    return () => {
      if (stopAudioRef.current) stopAudioRef.current();
      clearTimeout(skipTimer);
      clearTimeout(gemTimer);
      clearTimeout(scaleTimer);
      clearTimeout(subtitleTimer1);
      clearTimeout(fadeOutTimer1);
      clearTimeout(subtitleTimer2);
      clearTimeout(fadeOutTimer2);
      clearTimeout(subtitleTimer3);
      clearTimeout(minTimeTimer);
    };
  }, [playNarration]);

  return (
    <>
      {/* Gem Animation Layer */}
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity duration-800 ease-in-out`}
      >
        <Gem
          size={80}
          className={`text-emerald-500 fill-emerald-500/10 animate-pulse glow-pulse-3 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isScalingDown || !isGemVisible ? "scale-0" : "scale-100"
            }`}
          style={{
            "--glow-color": "#10b981",
            "--glow-blur-sm": "20px",
            "--glow-blur-lg": "50px",
            "--glow-brightness": "1.2"
          } as React.CSSProperties}
          strokeWidth={1}
        />
      </div>

      {/* Subtitle Layer */}
      <div className={`fixed inset-0 z-[110] flex items-center justify-center pointer-events-none transition-opacity ${transitionDuration} ${isSubtitleVisible ? "opacity-100" : "opacity-0"
        }`}>
        <p
          className={`${subtitle === "Wake up!" ? "text-emerald-400 font-bold drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]" : "text-emerald-100/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"} text-xl md:text-3xl tracking-widest text-center max-w-4xl leading-relaxed px-8`}
        >
          {subtitle}
        </p>
      </div>

      {/* Skip Button */}
      <div className={`fixed bottom-12 left-0 right-0 z-[120] flex justify-center transition-opacity duration-1000 ${showSkip ? "opacity-100" : "opacity-0"}`}>
        <button
          onClick={onComplete}
          className="pointer-events-auto text-slate-600 hover:text-slate-400 transition-colors cursor-pointer p-2"
          aria-label="Skip Intro"
        >
          <span className="text-xs tracking-widest uppercase border-b border-transparent hover:border-slate-600/50 pb-1">Skip</span>
        </button>
      </div>
    </>
  );
}
