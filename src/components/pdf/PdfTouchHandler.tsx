import React, { useRef, useCallback, TouchEvent } from 'react';

interface PdfTouchHandlerProps {
    children: React.ReactNode;
    onZoom: (scale: number) => void;
    onPageChange: (direction: 'next' | 'prev') => void;
    currentScale: number;
    minScale: number;
    maxScale: number;
    enabled?: boolean;
    className?: string;
}

interface TouchState {
    initialDistance: number;
    initialScale: number;
    startX: number;
    startY: number;
    startTime: number;
}

export const PdfTouchHandler: React.FC<PdfTouchHandlerProps> = ({
    children,
    onZoom,
    onPageChange,
    currentScale,
    minScale,
    maxScale,
    enabled = true,
    className = '',
}) => {
    const touchStateRef = useRef<TouchState | null>(null);
    const lastTapRef = useRef<number>(0);

    const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enabled) return;

        if (e.touches.length === 2) {
            const distance = getDistance(e.touches[0], e.touches[1]);
            touchStateRef.current = {
                initialDistance: distance,
                initialScale: currentScale,
                startX: 0,
                startY: 0,
                startTime: Date.now(),
            };
        } else if (e.touches.length === 1) {
            const now = Date.now();
            const timeSinceLastTap = now - lastTapRef.current;

            if (timeSinceLastTap < 300) {
                const newScale = currentScale === 1 ? 2 : 1;
                onZoom(Math.max(minScale, Math.min(maxScale, newScale)));
            }

            lastTapRef.current = now;
            touchStateRef.current = {
                initialDistance: 0,
                initialScale: currentScale,
                startX: e.touches[0].clientX,
                startY: e.touches[0].clientY,
                startTime: now,
            };
        }
    }, [enabled, currentScale, minScale, maxScale, onZoom]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!enabled || !touchStateRef.current) return;

        if (e.touches.length === 2) {
            e.preventDefault();
            const distance = getDistance(e.touches[0], e.touches[1]);
            const scale = (distance / touchStateRef.current.initialDistance) * touchStateRef.current.initialScale;
            const clampedScale = Math.max(minScale, Math.min(maxScale, scale));
            onZoom(clampedScale);
        }
    }, [enabled, minScale, maxScale, onZoom]);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        if (!enabled || !touchStateRef.current) return;

        if (e.changedTouches.length === 1 && touchStateRef.current.initialDistance === 0) {
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStateRef.current.startX;
            const deltaY = Math.abs(touch.clientY - touchStateRef.current.startY);
            const deltaTime = Date.now() - touchStateRef.current.startTime;

            const isSwipe = Math.abs(deltaX) > 50 && deltaY < 50 && deltaTime < 300;

            if (isSwipe) {
                if (deltaX > 0) {
                    onPageChange('prev');
                } else {
                    onPageChange('next');
                }
            }
        }

        touchStateRef.current = null;
    }, [enabled, onPageChange]);

    if (!enabled) {
        return <>{children}</>;
    }

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
            className={className}
        >
            {children}
        </div>
    );
};
