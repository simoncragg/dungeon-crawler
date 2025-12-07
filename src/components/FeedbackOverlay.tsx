import { useEffect, useState } from "react";

interface FeedbackOverlayProps {
  message: string | null;
  delay?: number;
}

export default function FeedbackOverlay({ message, delay = 0 }: FeedbackOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (message) {
        setCurrentMessage(message);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }, message ? delay : 0);

    return () => clearTimeout(timer);
  }, [message, delay]);

  if (!currentMessage) return null;

  return (
    <div
      className={`absolute inset-0 flex items-end justify-center pb-32 pointer-events-none z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="max-w-3xl transform scale-100 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
        <p className="text-2xl font-black text-yellow-400 tracking-widest text-center px-4 leading-relaxed">
          {currentMessage}
        </p>
      </div>
    </div>
  );
}
