import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { Stroke } from '../types';

export interface SignatureViewerRef {
    download: () => void;
    playback: () => void;
}

interface SignatureViewerProps {
    strokes: Stroke[];
    documentTitle?: string;
}

const SignatureViewer = forwardRef<SignatureViewerRef, SignatureViewerProps>(({ strokes, documentTitle = 'signature' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const drawStaticSignature = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        if (!strokes || strokes.length === 0) return;

        const allPoints = strokes.flatMap(s => s.points);
        if (allPoints.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        };

        const minX = Math.min(...allPoints.map(p => p.x));
        const maxX = Math.max(...allPoints.map(p => p.x));
        const minY = Math.min(...allPoints.map(p => p.y));
        const maxY = Math.max(...allPoints.map(p => p.y));

        const signatureWidth = (maxX - minX) || 1;
        const signatureHeight = (maxY - minY) || 1;

        const padding = 20;
        const rect = canvas.getBoundingClientRect();
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;

        const scale = Math.min(
            (canvasWidth - padding * 2) / signatureWidth,
            (canvasHeight - padding * 2) / signatureHeight
        );

        const offsetX = (canvasWidth - signatureWidth * scale) / 2 - minX * scale;
        const offsetY = (canvasHeight - signatureHeight * scale) / 2 - minY * scale;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        strokes.forEach(stroke => {
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width * scale;
            ctx.beginPath();
            if (stroke.points.length > 0) {
                ctx.moveTo(stroke.points[0].x * scale + offsetX, stroke.points[0].y * scale + offsetY);
                for (let i = 1; i < stroke.points.length; i++) {
                    ctx.lineTo(stroke.points[i].x * scale + offsetX, stroke.points[i].y * scale + offsetY);
                }
                ctx.stroke();
            }
        });
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                ctx.scale(dpr, dpr);
            }
            if(!isPlaying) {
                drawStaticSignature(ctx, canvas);
            }
        }

        const observer = new ResizeObserver(resizeCanvas);
        observer.observe(canvas);
        resizeCanvas();

        return () => observer.disconnect();

    }, [strokes, isPlaying]);

    const handlePlayback = async () => {
        if (isPlaying || !strokes || strokes.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        setIsPlaying(true);

        const allPoints = strokes.flatMap(s => s.points);
        const minX = Math.min(...allPoints.map(p => p.x));
        const maxX = Math.max(...allPoints.map(p => p.x));
        const minY = Math.min(...allPoints.map(p => p.y));
        const maxY = Math.max(...allPoints.map(p => p.y));
        const signatureWidth = (maxX - minX) || 1;
        const signatureHeight = (maxY - minY) || 1;
        const padding = 20;
        const rect = canvas.getBoundingClientRect();
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;
        const scale = Math.min((canvasWidth - padding * 2) / signatureWidth, (canvasHeight - padding * 2) / signatureHeight);
        const offsetX = (canvasWidth - signatureWidth * scale) / 2 - minX * scale;
        const offsetY = (canvasHeight - signatureHeight * scale) / 2 - minY * scale;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const stroke of strokes) {
            if (stroke.points.length < 2) continue;

            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width * scale;
            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x * scale + offsetX, stroke.points[0].y * scale + offsetY);

            for (let i = 1; i < stroke.points.length; i++) {
                const p1 = stroke.points[i - 1];
                const p2 = stroke.points[i];
                const delay = p2.timestamp - p1.timestamp;
                await new Promise(resolve => setTimeout(resolve, Math.min(delay, 200)));
                ctx.lineTo(p2.x * scale + offsetX, p2.y * scale + offsetY);
                ctx.stroke();
            }
        }

        setTimeout(() => {
            setIsPlaying(false);
        }, 500);
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const downloadCanvas = document.createElement('canvas');
        downloadCanvas.width = canvas.width;
        downloadCanvas.height = canvas.height;
        const ctx = downloadCanvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
        ctx.drawImage(canvas, 0, 0);

        const link = document.createElement('a');
        link.download = `${documentTitle.replace(/\s+/g, '_')}-signature.png`;
        link.href = downloadCanvas.toDataURL('image/png');
        link.click();
    };

    useImperativeHandle(ref, () => ({
        download: handleDownload,
        playback: handlePlayback,
    }));

    return (
        <div className="relative w-full h-full">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
            />
        </div>
    );
});

export default SignatureViewer;
