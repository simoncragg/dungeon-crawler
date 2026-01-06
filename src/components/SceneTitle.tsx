import { useEffect, useState } from "react";

interface SceneTitleProps {
    title: string;
    forceHide?: boolean;
}

export default function SceneTitle({ title, forceHide }: SceneTitleProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [hasBeenHidden, setHasBeenHidden] = useState(false);

    useEffect(() => {
        if (hasBeenHidden) return;

        const showTimer = setTimeout(() => setIsVisible(true), 100);
        const hideTimer = setTimeout(() => {
            setIsVisible(false);
            setHasBeenHidden(true);
        }, 3000);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [hasBeenHidden]);

    // Derive visibility to respond instantly to forceHide
    const show = isVisible && !forceHide;

    return (
        <div className={`transition-opacity ${forceHide ? "duration-0" : "duration-500"} ${show ? "opacity-100" : "opacity-0"}`}>
            <h2 className="text-3xl font-medieval text-emerald-500 tracking-widest uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,1)] text-center">
                {title}
            </h2>
        </div>
    );
}
