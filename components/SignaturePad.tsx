import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { Stroke, Point } from '../types';

export interface SignaturePadRef {
  clear: () => void;
  getSignature: () => Stroke[] | undefined;
}

interface SignaturePadProps {
  strokeColor?: string;
  strokeWidth?: number;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ strokeColor = '#FFFFFF', strokeWidth = 2 }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStroke = useRef<Stroke | null>(null);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const getCanvasContext = () => {
    return canvasRef.current?.getContext('2d');
  }

  const redrawAllStrokes = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokesRef.current.forEach(stroke => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCanvasContext();
    if (!ctx) return;

    const resizeCanvas = () => {
      if (!canvas.parentElement) return;
      const { width, height } = canvas.parentElement.getBoundingClientRect();
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
    observer.observe(canvas.parentElement);
    resizeCanvas();

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    redrawAllStrokes();
  }, [strokes]);

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

      const newStroke: Stroke = {
        id: crypto.randomUUID(),
        color: strokeColor,
        width: strokeWidth,
        points: [{ x: coords.x, y: coords.y, timestamp: performance.now() }],
      };
      currentStroke.current = newStroke;

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
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
    isDrawing.current = false;

    const finishedStroke = currentStroke.current;

    if (finishedStroke && finishedStroke.points.length > 1) {
      setStrokes(prevStrokes => [...prevStrokes, finishedStroke]);
    }
    currentStroke.current = null;
  };

  useImperativeHandle(ref, () => ({
    clear() {
      setStrokes([]);
      const canvas = canvasRef.current;
      const ctx = getCanvasContext();
      if (canvas && ctx) {
        const { width, height } = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, width, height);
      }
    },
    getSignature() {
      return strokes.length > 0 ? strokes : undefined;
    },
  }));

  return (
      <canvas
          ref={canvasRef}
          className="w-full h-full bg-white rounded-lg border-2 border-dashed border-gray-500 cursor-crosshair touch-none"
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
