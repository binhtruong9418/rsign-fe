import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { Stroke, Point } from '../types';

export interface SignaturePadRef {
  clear: () => void;
  getSignature: () => Stroke[] | undefined;
}

const SignaturePad = forwardRef<SignaturePadRef>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStroke = useRef<Stroke | null>(null);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const getCanvasContext = () => {
    return canvasRef.current?.getContext('2d');
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCanvasContext();
    if (!ctx) return;

    const redrawAllStrokes = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      strokesRef.current.forEach(stroke => {
        ctx.beginPath();
        if (stroke.points.length > 0) {
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
        }
      });
    };

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const needsResize = canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr);

      if (needsResize) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.scale(dpr, dpr);
        redrawAllStrokes();
      }
    };

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    resizeCanvas();

    return () => {
      observer.disconnect();
    };
  }, []);

  const getCoordinates = (event: MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const point = event instanceof MouseEvent ? event : event.touches[0];
    if (!point) return;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top
    };
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const ctx = getCanvasContext();
    const coords = getCoordinates(event.nativeEvent);
    if (ctx && coords) {
      isDrawing.current = true;
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);

      const newStroke: Stroke = {
        id: crypto.randomUUID(),
        color: '#FFFFFF',
        width: 2,
        points: [{ x: coords.x, y: coords.y, timestamp: performance.now() }],
      };
      currentStroke.current = newStroke;
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!isDrawing.current) return;
    const ctx = getCanvasContext();
    const coords = getCoordinates(event.nativeEvent);
    if (ctx && coords && currentStroke.current) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      currentStroke.current.points.push({
        x: coords.x,
        y: coords.y,
        timestamp: performance.now(),
      });
    }
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    const ctx = getCanvasContext();
    if (ctx) {
      ctx.closePath();
      isDrawing.current = false;

      // Fix: Capture the stroke before setting state to avoid a race condition
      const finishedStroke = currentStroke.current;

      if (finishedStroke && finishedStroke.points.length > 1) {
        setStrokes(prevStrokes => [...prevStrokes, finishedStroke]);
      }
      currentStroke.current = null;
    }
  };

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      const ctx = getCanvasContext();
      if (canvas && ctx) {
        const { width, height } = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, width, height);
      }
      setStrokes([]);
    },
    getSignature() {
      return strokes.length > 0 ? strokes : undefined;
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-dark-card rounded-lg border-2 border-dashed border-gray-500 cursor-crosshair touch-none"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
    />
  );
});

export default SignaturePad;