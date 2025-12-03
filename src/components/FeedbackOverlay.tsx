import { useEffect, useState } from "react";

interface FeedbackOverlayProps {
  message: string | null;
  delay?: number;
}

export default function FeedbackOverlay({ message, delay = 0 }: FeedbackOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);

  useEffect(() => {
    const showMessage = () => {
      setCurrentMessage(message);
      setIsVisible(true);
    };

    if (message) {
      if (delay > 0) {
        const timer = setTimeout(() => {
          showMessage();
        }, delay);
        return () => clearTimeout(timer);
      } else {
        showMessage();
      }
    } else {
      setIsVisible(false);
    }
  }, [message, delay]);

  if (!currentMessage) return null;

  return (
    <div
      className={`absolute inset-0 flex items-end justify-center pb-32 pointer-events-none z-50 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="bg-black/70 text-white px-6 py-4 rounded-lg backdrop-blur-sm border border-white/10 shadow-2xl max-w-md text-center transform scale-110">
        <p className="text-md font-sans tracking-wide text-shadow-lg">
          {currentMessage}
        </p>
      </div>
    </div>
  );
}
