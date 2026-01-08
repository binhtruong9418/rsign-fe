import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayCircle } from 'lucide-react';
import { STORAGE_KEYS } from '../constants';

interface Point {
    x: number;
    y: number;
    timestamp: number;
}

interface Stroke {
    id: string;
    points: Point[];
}

interface SignatureData {
    previewUrl: string;
    playback?: {
        strokes: Stroke[];
        color: string;
        width: number;
    };
}

interface SignaturePreviewProps {
    signature: SignatureData;
    className?: string;
    showReplayButton?: boolean;
}

/**
 * SignaturePreview Component
 * Displays signature preview image and replay animation
 */
const SignaturePreview: React.FC<SignaturePreviewProps> = ({
    signature,
    className = '',
    showReplayButton = true,
}) => {
    const { t } = useTranslation();
    const [isPlaying, setIsPlaying] = useState(false);
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationTimeouts = useRef<NodeJS.Timeout[]>([]);

    const drawAnimation = () => {
        if (!signature.playback || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Clear any existing timeouts
        animationTimeouts.current.forEach(timeout => clearTimeout(timeout));
        animationTimeouts.current = [];

        const { strokes, color, width } = signature.playback;

        // Calculate canvas dimensions based on signature bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        strokes.forEach(stroke => {
            stroke.points.forEach(point => {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            });
        });

        const signatureWidth = maxX - minX;
        const signatureHeight = maxY - minY;
        const padding = 20;

        // Set canvas size with padding
        canvas.width = signatureWidth + padding * 2;
        canvas.height = signatureHeight + padding * 2;

        // Calculate scale to fit container (max height 100px)
        const containerMaxHeight = 100;
        const scale = Math.min(1, containerMaxHeight / canvas.height);

        // Apply transform to center and scale signature
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(-minX + padding, -minY + padding);

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Get all timestamps to calculate delays
        const allTimestamps: number[] = [];
        strokes.forEach(stroke => {
            stroke.points.forEach(point => {
                allTimestamps.push(point.timestamp);
            });
        });

        const startTime = Math.min(...allTimestamps);

        // Animate points based on their actual timestamps
        strokes.forEach(stroke => {
            stroke.points.forEach((point, pointIndex) => {
                const delay = point.timestamp - startTime;

                const timeout = setTimeout(() => {
                    if (pointIndex === 0) {
                        ctx.beginPath();
                        ctx.moveTo(point.x, point.y);
                    } else {
                        ctx.lineTo(point.x, point.y);
                        ctx.stroke();
                    }
                }, delay);

                animationTimeouts.current.push(timeout);
            });
        });

        // Stop playing after all points are drawn
        const maxDelay = Math.max(...allTimestamps) - startTime;
        const stopTimeout = setTimeout(() => {
            ctx.restore();
            setIsPlaying(false);
        }, maxDelay + 200);

        animationTimeouts.current.push(stopTimeout);
    };

    const playAnimation = () => {
        if (!signature.playback) return;
        setIsPlaying(true);
    };

    // Fetch preview image with JWT
    useEffect(() => {
        const fetchPreviewImage = async () => {
            try {
                const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
                const response = await fetch(`${import.meta.env.VITE_API_URL}${signature.previewUrl}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    setPreviewBlobUrl(blobUrl);
                }
            } catch (error) {
                console.error('Failed to fetch signature preview:', error);
            }
        };

        fetchPreviewImage();

        // Cleanup blob URL on unmount or when previewUrl changes
        return () => {
            if (previewBlobUrl) {
                URL.revokeObjectURL(previewBlobUrl);
            }
        };
    }, [signature.previewUrl]);

    // Draw animation when canvas is ready
    useEffect(() => {
        if (isPlaying && canvasRef.current) {
            // Small delay to ensure canvas is fully mounted
            setTimeout(() => drawAnimation(), 50);
        }
    }, [isPlaying]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            animationTimeouts.current.forEach(timeout => clearTimeout(timeout));
        };
    }, []);

    const hasPlayback = signature.playback && signature.playback.strokes.length > 0;

    return (
        <div className={className}>
            {/* Preview/Canvas Display - Fixed container height */}
            <div className="bg-secondary-50 rounded p-2 mb-2 h-32 flex items-center justify-center">
                {!isPlaying ? (
                    previewBlobUrl ? (
                        <img
                            src={previewBlobUrl}
                            alt="Signature preview"
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                        />
                    ) : (
                        <div className="text-secondary-400 text-xs">
                            {t('signature.loading', 'Loading...')}
                        </div>
                    )
                ) : (
                    <canvas
                        ref={canvasRef}
                        className="max-w-full max-h-full bg-white rounded"
                    />
                )}
            </div>

            {/* Replay Button */}
            {showReplayButton && hasPlayback && (
                <button
                    onClick={playAnimation}
                    disabled={isPlaying}
                    className="w-full btn-secondary text-xs py-1.5 inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <PlayCircle className="w-3.5 h-3.5" />
                    {isPlaying
                        ? t('signature.replaying', 'Playing...')
                        : t('signature.replay', 'Replay Signature')
                    }
                </button>
            )}
        </div>
    );
};

export default SignaturePreview;

