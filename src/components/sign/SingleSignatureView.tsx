import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, X, Eye, EyeOff } from 'lucide-react';
import SignaturePad, { SignaturePadRef } from '../SignaturePad';
import DocumentContentViewer from '../DocumentContentViewer';
import { DEFAULT_SIGNATURE_COLOR, DEFAULT_SIGNATURE_WIDTH } from '../../constants/app';
import { useTranslation } from 'react-i18next';
import type { Stroke } from '../../types';

interface SingleSignatureViewProps {
    onBack: () => void;
    onSubmit: (signature: Stroke[]) => void;
    isSubmitting: boolean;
    documentTitle: string;
    signatureLabel?: string;
    documentUrl?: string; // Optional document URL for preview
    signatureZone?: {
        pageNumber?: number;
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

type ViewMode = 'signing' | 'preview';

const SingleSignatureView: React.FC<SingleSignatureViewProps> = ({
    onBack,
    onSubmit,
    isSubmitting,
    documentTitle,
    signatureLabel,
    documentUrl,
    signatureZone,
}) => {
    const { t } = useTranslation();
    const [signature, setSignature] = useState<Stroke[] | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('signing');
    const signaturePadRef = useRef<SignaturePadRef>(null);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [showDocPreview, setShowDocPreview] = useState(false);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [previewSignatureImage, setPreviewSignatureImage] = useState<string | null>(null);
    const [currentDocPage, setCurrentDocPage] = useState(1);

    // Track if user has drawn
    useEffect(() => {
        const checkDrawing = setInterval(() => {
            const sig = signaturePadRef.current?.getSignature();
            setHasDrawn(!!sig && sig.length > 0);
        }, 300);

        return () => clearInterval(checkDrawing);
    }, []);

    // Update signature preview when in document preview mode
    useEffect(() => {
        if (!showDocPreview || !hasDrawn) return;

        const updateSignaturePreview = () => {
            const sig = signaturePadRef.current?.getSignature();
            if (sig && sig.length > 0) {
                // Create a temporary canvas to render signature
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Get bounding box
                let minX = Infinity, minY = Infinity;
                let maxX = -Infinity, maxY = -Infinity;

                sig.forEach(stroke => {
                    stroke.points.forEach(point => {
                        minX = Math.min(minX, point.x);
                        minY = Math.min(minY, point.y);
                        maxX = Math.max(maxX, point.x);
                        maxY = Math.max(maxY, point.y);
                    });
                });

                const signatureWidth = maxX - minX;
                const signatureHeight = maxY - minY;
                const padding = 10;

                canvas.width = signatureWidth + padding * 2;
                canvas.height = signatureHeight + padding * 2;

                ctx.strokeStyle = DEFAULT_SIGNATURE_COLOR;
                ctx.lineWidth = DEFAULT_SIGNATURE_WIDTH;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                sig.forEach(stroke => {
                    if (stroke.points.length > 0) {
                        ctx.beginPath();
                        ctx.moveTo(
                            stroke.points[0].x - minX + padding,
                            stroke.points[0].y - minY + padding
                        );
                        for (let i = 1; i < stroke.points.length; i++) {
                            ctx.lineTo(
                                stroke.points[i].x - minX + padding,
                                stroke.points[i].y - minY + padding
                            );
                        }
                        ctx.stroke();
                    }
                });

                setSignatureDataUrl(canvas.toDataURL('image/png'));
            }
        };

        const interval = setInterval(updateSignaturePreview, 500);
        updateSignaturePreview();

        return () => clearInterval(interval);
    }, [showDocPreview, hasDrawn]);

    const handleSaveAndPreview = () => {
        const strokesData = signaturePadRef.current?.getSignature();
        if (!strokesData || strokesData.length === 0) {
            return;
        }

        setSignature(strokesData);

        // Generate signature image for preview
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Get bounding box
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            strokesData.forEach(stroke => {
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

            canvas.width = signatureWidth + padding * 2;
            canvas.height = signatureHeight + padding * 2;

            // Fill with transparent background
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = DEFAULT_SIGNATURE_COLOR;
            ctx.lineWidth = DEFAULT_SIGNATURE_WIDTH;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            strokesData.forEach(stroke => {
                if (stroke.points.length > 0) {
                    ctx.beginPath();
                    ctx.moveTo(
                        stroke.points[0].x - minX + padding,
                        stroke.points[0].y - minY + padding
                    );
                    for (let i = 1; i < stroke.points.length; i++) {
                        ctx.lineTo(
                            stroke.points[i].x - minX + padding,
                            stroke.points[i].y - minY + padding
                        );
                    }
                    ctx.stroke();
                }
            });

            setPreviewSignatureImage(canvas.toDataURL('image/png'));
        }

        setViewMode('preview');
    };

    const handleClearSignature = () => {
        signaturePadRef.current?.clear();
        setHasDrawn(false);
    };

    const handleEditSignature = () => {
        setViewMode('signing');
    };

    const handleFinalSubmit = () => {
        if (!signature) return;
        onSubmit(signature);
    };

    // Preview Mode
    if (viewMode === 'preview') {
        return (
            <div className="flex flex-col h-full bg-white">
                {/* Sticky Header */}
                <div className="sticky top-0 z-20 bg-white border-b border-secondary-200 px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleEditSignature}
                            className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-medium">{t('common.back', 'Back')}</span>
                        </button>
                        <div className="text-sm font-semibold text-green-600 flex items-center gap-1">
                            <Check size={18} />
                            {t('signing.ready', 'Ready')}
                        </div>
                    </div>
                    <h2 className="text-lg font-bold text-secondary-900 mt-2">
                        {t('signing.review_signature', 'Review Signature')}
                    </h2>
                </div>

                {/* Document Preview with Signature Overlay */}
                <div className="flex-grow overflow-y-auto px-4 py-6 bg-secondary-50">
                    {documentUrl && signatureZone && signature ? (
                        /* Document with signature overlay */
                        <div className="flex flex-col items-center gap-4">
                            {/* Status Card */}
                            <div className="w-full max-w-3xl bg-white rounded-lg border-2 border-green-300 p-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-green-100 text-green-700">
                                            <Check size={16} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-secondary-900 text-sm">
                                                {signatureLabel || t('signing.your_signature', 'Your Signature')}
                                            </p>
                                            <p className="text-xs text-secondary-600">
                                                {t('signing.ready_to_submit', 'Ready to submit')}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleEditSignature}
                                        className="text-sm text-primary-600 font-medium px-3 py-1 rounded-full bg-primary-50 hover:bg-primary-100"
                                    >
                                        {t('common.edit', 'Edit')}
                                    </button>
                                </div>
                            </div>

                            {/* Document with Signature Overlay */}
                            <div className="w-full max-w-3xl relative">
                                <DocumentContentViewer
                                    documentUri={documentUrl}
                                    documentTitle={documentTitle}
                                    className="rounded-lg shadow-lg border-2 border-secondary-200 min-h-[400px]"
                                    onPageChange={setCurrentDocPage}
                                />

                                {/* Signature Image Overlay - Only show on correct page */}
                                {previewSignatureImage && currentDocPage === (signatureZone.pageNumber || 1) && (
                                    <div
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: `calc(${signatureZone.x}% + 1rem)`,
                                            top: `calc(${signatureZone.y}% + 4rem)`,
                                            width: `${signatureZone.width}%`,
                                            height: `${signatureZone.height}%`,
                                        }}
                                    >
                                        <img
                                            src={previewSignatureImage}
                                            alt="Signature preview"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Fallback: Simple signature preview */
                        <div className="max-w-md mx-auto">
                            <div className="bg-white rounded-lg border-2 border-green-300 p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-green-100 text-green-700">
                                            <Check size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-secondary-900 text-base">
                                                {signatureLabel || t('signing.your_signature', 'Your Signature')}
                                            </p>
                                            <p className="text-sm text-secondary-600">
                                                {t('signing.ready_to_submit', 'Ready to submit')}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleEditSignature}
                                        className="text-sm text-primary-600 font-medium px-3 py-1 rounded-full bg-primary-50 hover:bg-primary-100"
                                    >
                                        {t('common.edit', 'Edit')}
                                    </button>
                                </div>

                                {signature && (
                                    <div className="border-2 border-secondary-200 rounded-lg p-3 bg-secondary-50">
                                        <canvas
                                            ref={(canvas) => {
                                                if (canvas && signature) {
                                                    const ctx = canvas.getContext('2d');
                                                    if (ctx) {
                                                        let minX = Infinity, minY = Infinity;
                                                        let maxX = -Infinity, maxY = -Infinity;

                                                        signature.forEach(stroke => {
                                                            stroke.points.forEach(point => {
                                                                minX = Math.min(minX, point.x);
                                                                minY = Math.min(minY, point.y);
                                                                maxX = Math.max(maxX, point.x);
                                                                maxY = Math.max(maxY, point.y);
                                                            });
                                                        });

                                                        const signatureWidth = maxX - minX;
                                                        const signatureHeight = maxY - minY;
                                                        const canvasWidth = 400;
                                                        const canvasHeight = 150;
                                                        canvas.width = canvasWidth;
                                                        canvas.height = canvasHeight;

                                                        const padding = 20;
                                                        const scaleX = (canvasWidth - padding * 2) / signatureWidth;
                                                        const scaleY = (canvasHeight - padding * 2) / signatureHeight;
                                                        const scale = Math.min(scaleX, scaleY);

                                                        const offsetX = (canvasWidth - signatureWidth * scale) / 2 - minX * scale;
                                                        const offsetY = (canvasHeight - signatureHeight * scale) / 2 - minY * scale;

                                                        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                                                        ctx.strokeStyle = DEFAULT_SIGNATURE_COLOR;
                                                        ctx.lineWidth = DEFAULT_SIGNATURE_WIDTH * scale;
                                                        ctx.lineCap = 'round';
                                                        ctx.lineJoin = 'round';

                                                        signature.forEach(stroke => {
                                                            if (stroke.points.length > 0) {
                                                                ctx.beginPath();
                                                                const firstPoint = stroke.points[0];
                                                                ctx.moveTo(
                                                                    firstPoint.x * scale + offsetX,
                                                                    firstPoint.y * scale + offsetY
                                                                );
                                                                for (let i = 1; i < stroke.points.length; i++) {
                                                                    const point = stroke.points[i];
                                                                    ctx.lineTo(
                                                                        point.x * scale + offsetX,
                                                                        point.y * scale + offsetY
                                                                    );
                                                                }
                                                                ctx.stroke();
                                                            }
                                                        });
                                                    }
                                                }
                                            }}
                                            className="w-full"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="sticky bottom-0 p-4 bg-white border-t border-secondary-200 shadow-lg">
                    <button
                        onClick={handleFinalSubmit}
                        disabled={!signature || isSubmitting}
                        className="w-full py-4 bg-primary-600 text-white rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors shadow-md disabled:shadow-none"
                    >
                        {isSubmitting
                            ? t('sign_components.signature_view.submitting', 'Submitting...')
                            : t('signing.submit_signature', 'Submit Signature')
                        }
                    </button>
                </div>
            </div>
        );
    }

    // Signing Mode
    return (
        <div className="flex flex-col h-full bg-white">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-white border-b border-secondary-200 shadow-sm">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-medium text-sm">{t('common.back', 'Back')}</span>
                        </button>
                        <div className="flex items-center gap-2">
                            {/* Document Preview Toggle */}
                            {documentUrl && signatureZone && hasDrawn && (
                                <button
                                    onClick={() => setShowDocPreview(!showDocPreview)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors"
                                >
                                    {showDocPreview ? (
                                        <>
                                            <EyeOff size={16} />
                                            <span className="hidden sm:inline">{t('signing.hide_preview', 'Hide Preview')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Eye size={16} />
                                            <span className="hidden sm:inline">{t('signing.show_on_doc', 'Preview on Doc')}</span>
                                        </>
                                    )}
                                </button>
                            )}
                            {signature && (
                                <div className="text-sm font-semibold text-green-600 flex items-center gap-1">
                                    <Check size={16} />
                                    {t('signing.saved', 'Saved')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Signature Info */}
                    <div className="bg-primary-50 rounded-lg p-3">
                        <h3 className="text-base font-bold text-primary-900">
                            {signatureLabel || t('signing.your_signature', 'Your Signature')}
                        </h3>
                        <p className="text-xs text-primary-700 mt-0.5">
                            {showDocPreview
                                ? t('signing.preview_mode_hint', 'Preview mode - Draw to see signature on document')
                                : t('signing.draw_signature_below', 'Draw your signature below')
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Signature Pad Area or Document Preview */}
            <div className="grow flex flex-col p-4 bg-secondary-50 overflow-hidden">
                {showDocPreview && documentUrl && signatureZone ? (
                    /* Document Preview with Signature Overlay */
                    <div className="grow flex items-center justify-center overflow-auto">
                        <div className="relative max-w-2xl lg:max-w-3xl max-h-full">
                            <img
                                src={documentUrl}
                                alt={documentTitle}
                                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg border-2 border-secondary-200"
                            />

                            {/* Signature Zone Overlay */}
                            <div
                                className="absolute border-4 border-primary-500 bg-primary-500/10 rounded"
                                style={{
                                    left: `${signatureZone.x}%`,
                                    top: `${signatureZone.y}%`,
                                    width: `${signatureZone.width}%`,
                                    height: `${signatureZone.height}%`,
                                }}
                            >
                                {/* Signature Preview */}
                                {signatureDataUrl && (
                                    <img
                                        src={signatureDataUrl}
                                        alt="Signature preview"
                                        className="w-full h-full object-contain p-1"
                                    />
                                )}

                                {/* Label */}
                                <div className="absolute -top-7 left-0 bg-primary-500 text-white text-xs px-2 py-1 rounded font-semibold shadow-md whitespace-nowrap">
                                    ✍️ {signatureLabel || t('signing.your_signature', 'Your Signature')}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Normal Signature Pad */
                    <div className="grow flex items-center justify-center">
                        <div className="w-full max-w-sm lg:max-w-md aspect-[3/2] lg:aspect-[5/3] bg-white border-4 border-primary-200 rounded-2xl shadow-lg overflow-hidden">
                            <SignaturePad
                                ref={signaturePadRef}
                                strokeColor={DEFAULT_SIGNATURE_COLOR}
                                strokeWidth={DEFAULT_SIGNATURE_WIDTH}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 p-4 bg-white border-t border-secondary-200 shadow-lg">
                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Clear Button */}
                    <button
                        onClick={handleClearSignature}
                        disabled={!hasDrawn}
                        className="w-full lg:w-auto lg:flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-secondary-300 text-secondary-700 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary-50 transition-colors"
                    >
                        <X size={20} />
                        <span className="hidden lg:inline">{t('sign_components.signature_view.clear', 'Clear')}</span>
                        <span className="lg:hidden">{t('sign_components.signature_view.clear', 'Clear')}</span>
                    </button>

                    {/* Save & Review */}
                    <button
                        onClick={handleSaveAndPreview}
                        disabled={!hasDrawn}
                        className="w-full lg:flex-[2] py-4 lg:py-3 bg-primary-600 text-white rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors shadow-md disabled:shadow-none"
                    >
                        {t('signing.save_and_review', '✓ Save & Review')}
                    </button>
                </div>

                {/* Preview Button (if already saved) */}
                {signature && (
                    <button
                        onClick={() => setViewMode('preview')}
                        className="w-full mt-3 py-3 bg-secondary-100 text-secondary-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-secondary-200 transition-colors"
                    >
                        <Eye size={18} />
                        {t('signing.view_preview', 'View Preview')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SingleSignatureView;
