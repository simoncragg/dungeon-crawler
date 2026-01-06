import { useEffect, useState } from "react";
import { UI_SETTINGS } from "../data/constants";

interface SceneTitleProps {
    title: string;
    forceHide?: boolean;
}

export default function SceneTitle({ title, forceHide }: SceneTitleProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [hasBeenHidden, setHasBeenHidden] = useState(false);

    useEffect(() => {
        if (hasBeenHidden) return;

        const showTimer = setTimeout(() => setIsVisible(true), UI_SETTINGS.SCENE_TITLE_FADE_IN);
        const hideTimer = setTimeout(() => {
            setIsVisible(false);
            setHasBeenHidden(true);
        }, UI_SETTINGS.SCENE_TITLE_DISPLAY_DURATION);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [hasBeenHidden]);

    const show = isVisible && !forceHide;

    return (
        <div className={`transition-opacity ${forceHide ? "duration-0" : "duration-500"} ${show ? "opacity-100" : "opacity-0"}`}>
            <h2 className="text-3xl font-medieval text-emerald-500 tracking-widest uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,1)] text-center">
                {title}
            </h2>
        </div>
    );
}
