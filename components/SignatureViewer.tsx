import React, { useRef, useEffect, useState } from 'react';
import { Stroke, Point } from '../types';
import { Play } from 'lucide-react';

interface SignatureViewerProps {
    strokes: Stroke[];
}

interface PointWithStrokeProps extends Point {
    color: string;
    width: number;
    strokeId: string;
}

const SignatureViewer: React.FC<SignatureViewerProps> = ({ strokes }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const animationFrameId = useRef<number | null>(null);

    const getCanvasContext = () => {
        return canvasRef.current?.getContext('2d');
    };

    const drawStaticSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = getCanvasContext();
        if (!ctx) return;

        const { width, height } = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, width, height);

        strokes.forEach(stroke => {
            if (stroke.points.length < 2) return;
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        });
    };

    const replaySignature = () => {
        if (isPlaying || !strokes || strokes.length === 0) return;
        setIsPlaying(true);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = getCanvasContext();
        if (!ctx) return;

        const { width, height } = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, width, height);

        const allPoints: PointWithStrokeProps[] = strokes.flatMap(stroke =>
            stroke.points.map(p => ({ ...p, color: stroke.color, width: stroke.width, strokeId: stroke.id }))
        );

        if (allPoints.length < 2) {
            drawStaticSignature();
            setIsPlaying(false);
            return;
        }

        allPoints.sort((a, b) => a.timestamp - b.timestamp);

        const totalDuration = allPoints[allPoints.length - 1].timestamp - allPoints[0].timestamp;
        const animationDuration = Math.min(totalDuration, 3000); // Max 3 seconds replay
        const speedFactor = totalDuration > 0 ? totalDuration / animationDuration : 1;

        let startTime: number | null = null;
        let lastPointIndex = 0;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsedTime = timestamp - startTime;

            const currentTimestampInSignature = allPoints[0].timestamp + (elapsedTime * speedFactor);

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = lastPointIndex; i < allPoints.length - 1; i++) {
                if (allPoints[i+1].timestamp <= currentTimestampInSignature) {
                    const p1 = allPoints[i];
                    const p2 = allPoints[i+1];

                    if (p1.strokeId === p2.strokeId) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = p1.color;
                        ctx.lineWidth = p1.width;
                        ctx.stroke();
                    }
                    lastPointIndex = i;
                } else {
                    break;
                }
            }

            if (currentTimestampInSignature < allPoints[allPoints.length - 1].timestamp) {
                animationFrameId.current = requestAnimationFrame(animate);
            } else {
                drawStaticSignature();
                setIsPlaying(false);
            }
        };
        animationFrameId.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !containerRef.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            const { width, height } = containerRef.current.getBoundingClientRect();
            if (width === 0 || height === 0) return;
            const dpr = window.devicePixelRatio || 1;

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            ctx.scale(dpr, dpr);
            drawStaticSignature();
        };

        const observer = new ResizeObserver(resizeCanvas);
        observer.observe(containerRef.current);
        resizeCanvas();

        return () => {
            observer.disconnect();
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [strokes]);

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <canvas ref={canvasRef} />
            <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                {!isPlaying && (
                    <button
                        onClick={replaySignature}
                        className="bg-black bg-opacity-50 text-white rounded-full p-4 hover:bg-opacity-75 transition-opacity opacity-50 hover:opacity-100 disabled:opacity-20"
                        disabled={!strokes || strokes.length === 0}
                        aria-label="Replay Signature"
                    >
                        <Play size={48} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SignatureViewer;
