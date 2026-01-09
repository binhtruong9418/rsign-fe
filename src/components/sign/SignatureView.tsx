import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import SignaturePad, { SignaturePadRef } from '../SignaturePad';
import { DEFAULT_SIGNATURE_COLOR, DEFAULT_SIGNATURE_WIDTH } from '../../constants/app';
import { useTranslation } from 'react-i18next';

interface SignatureViewProps {
    onBack: () => void;
    onClear: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    signaturePadRef: React.RefObject<SignaturePadRef>;
    documentUrl?: string; // Optional document URL for preview
    documentTitle?: string;
    signatureZone?: {
        pageNumber: number;
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

const SignatureView: React.FC<SignatureViewProps> = ({
    onBack,
    onClear,
    onSubmit,
    isSubmitting,
    signaturePadRef,
    documentUrl,
    documentTitle,
    signatureZone,
}) => {
    const { t } = useTranslation();
    const [showPreview, setShowPreview] = useState(false);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

    // Update signature preview whenever signature changes
    useEffect(() => {
        if (!showPreview || !signaturePadRef.current) return;

        const updatePreview = () => {
            const strokes = signaturePadRef.current?.getSignature();
            if (strokes && strokes.length > 0) {
                try {
                    // Create temporary canvas to render signature
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    // Get bounding box
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    strokes.forEach(stroke => {
                        stroke.points.forEach(point => {
                            minX = Math.min(minX, point.x);
                            minY = Math.min(minY, point.y);
                            maxX = Math.max(maxX, point.x);
                            maxY = Math.max(maxY, point.y);
                        });
                    });

                    const width = maxX - minX + 40;
                    const height = maxY - minY + 40;
                    canvas.width = width;
                    canvas.height = height;

                    ctx.strokeStyle = DEFAULT_SIGNATURE_COLOR;
                    ctx.lineWidth = DEFAULT_SIGNATURE_WIDTH;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';

                    strokes.forEach(stroke => {
                        if (stroke.points.length > 0) {
                            ctx.beginPath();
                            ctx.moveTo(stroke.points[0].x - minX + 20, stroke.points[0].y - minY + 20);
                            for (let i = 1; i < stroke.points.length; i++) {
                                ctx.lineTo(stroke.points[i].x - minX + 20, stroke.points[i].y - minY + 20);
                            }
                            ctx.stroke();
                        }
                    });

                    setSignaturePreview(canvas.toDataURL('image/png'));
                } catch (e) {
                    console.error('Failed to generate signature preview:', e);
                }
            } else {
                setSignaturePreview(null);
            }
        };

        // Update preview every 500ms when in preview mode
        const interval = setInterval(updatePreview, 500);
        updatePreview(); // Initial update

        return () => clearInterval(interval);
    }, [showPreview, signaturePadRef]);

    const togglePreview = () => {
        setShowPreview(!showPreview);
    };

    return (
        <div className="flex flex-col h-full relative bg-secondary-50 sm:bg-white">
            {/* Header / Back Button Area */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <button
                    onClick={onBack}
                    className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm text-secondary-600 hover:text-primary-600 pl-2 pr-3 py-2 rounded-full shadow-sm border border-secondary-200 transition-colors"
                    aria-label="Back to document"
                >
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">{t('sign_components.signature_view.back')}</span>
                </button>

                {/* Preview Toggle Button - Only show if document URL is available */}
                {documentUrl && signatureZone && (
                    <button
                        onClick={togglePreview}
                        className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm text-secondary-600 hover:text-primary-600 px-3 py-2 rounded-full shadow-sm border border-secondary-200 transition-colors"
                        aria-label="Toggle preview"
                    >
                        {showPreview ? <EyeOff size={20} /> : <Eye size={20} />}
                        <span className="text-sm font-medium hidden sm:inline">
                            {showPreview ? t('sign_components.signature_view.hide_preview') : t('sign_components.signature_view.show_preview')}
                        </span>
                    </button>
                )}
            </div>

            {/* Signature Area or Document Preview */}
            <div className="flex-grow flex items-center justify-center p-4 sm:p-0 overflow-hidden">
                {showPreview && documentUrl && signatureZone ? (
                    /* Document Preview with Signature Overlay */
                    <div className="w-full h-full relative flex items-center justify-center bg-secondary-100">
                        <div className="relative max-w-4xl max-h-full">
                            {/* Document Image/PDF Preview */}
                            <img
                                src={documentUrl}
                                alt={documentTitle || 'Document'}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                            />

                            {/* Signature Zone Highlight */}
                            <div
                                className="absolute border-4 border-primary-500 bg-primary-500/5 rounded"
                                style={{
                                    left: `${signatureZone.x}%`,
                                    top: `${signatureZone.y}%`,
                                    width: `${signatureZone.width}%`,
                                    height: `${signatureZone.height}%`,
                                }}
                            >
                                {/* Signature Preview Overlay */}
                                {signaturePreview && (
                                    <img
                                        src={signaturePreview}
                                        alt="Signature preview"
                                        className="w-full h-full object-contain"
                                    />
                                )}

                                {/* Label */}
                                <div className="absolute -top-7 left-0 bg-primary-500 text-white text-xs px-2 py-1 rounded font-semibold shadow-md whitespace-nowrap">
                                    ✍️ {t('sign_components.signature_view.your_signature')}
                                </div>
                            </div>
                        </div>

                        {/* Helper Text */}
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <div className="inline-block bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-secondary-200">
                                <span className="text-sm text-secondary-600">
                                    {t('sign_components.signature_view.preview_mode')}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Mobile: Square & Centered. Desktop: Full size */
                    <div className="w-full aspect-square max-w-[400px] sm:max-w-none sm:w-full sm:h-full sm:aspect-auto bg-white border border-secondary-200 sm:border-0 rounded-2xl sm:rounded-none shadow-sm sm:shadow-none overflow-hidden relative">
                        <SignaturePad
                            ref={signaturePadRef}
                            strokeColor={DEFAULT_SIGNATURE_COLOR}
                            strokeWidth={DEFAULT_SIGNATURE_WIDTH}
                        />
                        {/* Helper text for mobile */}
                        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none sm:hidden">
                            <span className="text-xs text-secondary-400 bg-white/80 px-2 py-1 rounded-full backdrop-blur-sm">
                                {t('sign_components.signature_view.sign_above')}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Buttons Area */}
            <div className="p-4 bg-white border-t border-secondary-200 sm:border-t-0 flex gap-4 shrink-0 z-20">
                <button
                    onClick={onClear}
                    className="flex-1 btn-secondary py-3 text-base"
                >
                    {t('sign_components.signature_view.clear')}
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="flex-1 btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg sm:shadow-sm"
                >
                    {isSubmitting ? t('sign_components.signature_view.submitting') : t('sign_components.signature_view.sign')}
                </button>
            </div>
        </div>
    );
};

export default SignatureView;