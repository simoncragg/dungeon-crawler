import React from "react";
import type { LucideIcon } from "lucide-react";

interface ActionIconProps {
    icon: LucideIcon;
    onClick: () => void;
    disabled?: boolean;
    ariaLabel: string;
    iconClassName?: string;
    glowColor?: string;
    size?: number;
    iconSize?: number;
}

const ActionIcon: React.FC<ActionIconProps> = ({
    icon: Icon,
    onClick,
    disabled = false,
    ariaLabel,
    iconClassName = "",
    glowColor = "rgba(245,158,11,0.5)",
    size = 60,
    iconSize = 44,
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="group relative flex items-center justify-center p-4 transition-all duration-500 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            style={{ width: size, height: size }}
            aria-label={ariaLabel}
        >
            <div className="relative">
                <Icon
                    size={iconSize}
                    className={`text-amber-500/80 group-hover:text-amber-400 group-hover:scale-110 transition-[transform,color,filter] duration-500 ${iconClassName}`}
                    style={{
                        filter: `
              drop-shadow(0 0 10px ${glowColor})
              drop-shadow(0 0 20px ${glowColor.replace(/0\.5\)$/, "0.2)")})
            `
                    }}
                />
                <div className="absolute inset-0 bg-amber-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </button>
    );
};

export default ActionIcon;
