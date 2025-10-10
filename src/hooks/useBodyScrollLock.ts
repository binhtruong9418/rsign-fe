import { useEffect } from "react";

export const useBodyScrollLock = (isLocked: boolean) => {
    useEffect(() => {
        // Guard against document.body being undefined in some environments to prevent crashes.
        if (typeof document !== "undefined" && document.body) {
            if (isLocked) {
                document.body.style.overflow = "hidden";
            } else {
                document.body.style.overflow = "auto";
            }

            // Cleanup function to restore scrolling when component unmounts
            return () => {
                if (document.body) {
                    document.body.style.overflow = "auto";
                }
            };
        }
    }, [isLocked]);
};
