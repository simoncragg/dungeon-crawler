import { useState, useEffect } from "react";

/**
 * Hook to provide device-specific detection (UA, touch, dimensions).
 * This is used to optimize the UI for specific device categories (e.g. phones).
 */
export const useDeviceDetection = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isPhone, setIsPhone] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            const userAgent = (navigator.userAgent || navigator.vendor || (window as any).opera) || "";

            // Detection for iPhone, iPod, and Android phones
            const isMobileUA = /android|iphone|ipod/i.test(userAgent.toLowerCase());

            // Check for touch points - mobile emulation usually sets this
            const hasTouch = navigator.maxTouchPoints > 0;

            // Dimensions check
            const width = window.innerWidth;
            const height = window.innerHeight;
            const smallestDimension = Math.min(width, height);

            // iPad mini's smallest dimension is 768px, so < 600px is a safe bet for "phones".
            const isPhoneSize = smallestDimension < 600;

            setIsMobile(isMobileUA || (hasTouch && smallestDimension < 1024));
            setIsPhone(isMobileUA || (hasTouch && isPhoneSize));
            setIsLandscape(width > height);
        };

        checkDevice();
        window.addEventListener("resize", checkDevice);
        return () => window.removeEventListener("resize", checkDevice);
    }, []);

    return { isMobile, isPhone, isLandscape };
};
