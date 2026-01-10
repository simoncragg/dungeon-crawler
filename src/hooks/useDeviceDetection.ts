import { useState, useEffect } from "react";

/**
 * Hook to provide device-specific detection (UA, touch, dimensions).
 * This is used to optimize the UI for specific device categories (e.g. phones).
 */
export const useDeviceDetection = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            const userAgent = (navigator.userAgent || navigator.vendor || window.opera) || "";

            // Detection for iPhone, iPod, and Android phones
            const isMobileUA = /android|iphone|ipod/i.test(userAgent.toLowerCase());

            // Check for touch points - mobile emulation usually sets this
            const hasTouch = navigator.maxTouchPoints > 0;

            // Phones have at least one small dimension (usually < 500px)
            // Even in landscape, the height of a phone is small.
            // iPad mini's smallest dimension is 768px, so < 600px is a safe bet for "phones".
            const isPhoneSized = Math.min(window.innerWidth, window.innerHeight) < 600;

            setIsMobile(isMobileUA || (hasTouch && isPhoneSized));
        };

        checkDevice();
        window.addEventListener("resize", checkDevice);
        return () => window.removeEventListener("resize", checkDevice);
    }, []);

    return { isMobile };
};
