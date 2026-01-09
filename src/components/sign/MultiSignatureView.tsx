import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, X, Eye } from 'lucide-react';
import SignaturePad, { SignaturePadRef } from '../SignaturePad';
import DocumentContentViewer from '../DocumentContentViewer';
import { DEFAULT_SIGNATURE_COLOR, DEFAULT_SIGNATURE_WIDTH } from '../../constants/app';
import { useTranslation } from 'react-i18next';
import type { SignatureZone, Stroke } from '../../types';

interface MultiSignatureViewProps {
    onBack: () => void;
    onSubmitAll: (signatures: Map<string, Stroke[]>) => void;
    isSubmitting: boolean;
    signatureZones: Array<{
        documentSignerId: string;
        signatureZone: SignatureZone;
    }>;
    documentTitle: string;
    sessionExpiresAt: number;
    documentUrl?: string;
}

type ViewMode = 'signing' | 'preview';

const MultiSignatureView: React.FC<MultiSignatureViewProps> = ({
    onBack,
    onSubmitAll,
    isSubmitting,
    signatureZones,
    documentTitle,
    documentUrl,
}) => {
    const { t } = useTranslation();
    const [currentZoneIndex, setCurrentZoneIndex] = useState(0);
    const [signatures, setSignatures] = useState<Map<string, Stroke[]>>(new Map());
    const [signatureImages, setSignatureImages] = useState<Map<string, string>>(new Map());
    const [viewMode, setViewMode] = useState<ViewMode>('signing');
    const signaturePadRef = useRef<SignaturePadRef>(null);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [currentDocPage, setCurrentDocPage] = useState(1);

    const currentZone = signatureZones[currentZoneIndex];
    const totalZones = signatureZones.length;
    const signedCount = signatures.size;
    const allSigned = signedCount === totalZones;
    const isLastZone = currentZoneIndex === totalZones - 1;

    // Reset drawn state when zone changes
    useEffect(() => {
        setHasDrawn(false);
        signaturePadRef.current?.clear();
    }, [currentZoneIndex]);

    // Track if user has drawn
    useEffect(() => {
        const checkDrawing = setInterval(() => {
            const signature = signaturePadRef.current?.getSignature();
            setHasDrawn(!!signature && signature.length > 0);
        }, 300);

        return () => clearInterval(checkDrawing);
    }, []);

    const handleSaveAndNext = () => {
        const strokesData = signaturePadRef.current?.getSignature();
        if (!strokesData || strokesData.length === 0) {
            return;
        }

        // Generate signature image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = DEFAULT_SIGNATURE_COLOR;
            ctx.lineWidth = DEFAULT_SIGNATURE_WIDTH;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            strokesData.forEach(stroke => {
                if (stroke.points.length > 0) {
                    ctx.beginPath();
                    ctx.moveTo(stroke.points[0].x - minX + padding, stroke.points[0].y - minY + padding);
                    for (let i = 1; i < stroke.points.length; i++) {
                        ctx.lineTo(stroke.points[i].x - minX + padding, stroke.points[i].y - minY + padding);
                    }
                    ctx.stroke();
                }
            });
            setSignatureImages(prev => new Map(prev).set(currentZone.documentSignerId, canvas.toDataURL('image/png')));
        }

        // Save signature
        setSignatures(prev => new Map(prev).set(currentZone.documentSignerId, strokesData));

        // Move to next or preview
        if (isLastZone) {
            setViewMode('preview');
        } else {
            setCurrentZoneIndex(currentZoneIndex + 1);
        }
    };

    const handleSkip = () => {
        if (!isLastZone) {
            setCurrentZoneIndex(currentZoneIndex + 1);
        }
    };

    const handleClearSignature = () => {
        signaturePadRef.current?.clear();
        setHasDrawn(false);
    };

    const handleEditZone = (index: number) => {
        setCurrentZoneIndex(index);
        setViewMode('signing');
    };

    const handleFinalSubmit = () => {
        if (signatures.size !== totalZones) {
            return;
        }
        onSubmitAll(signatures);
    };

    const isZoneSigned = (documentSignerId: string) => {
        return signatures.has(documentSignerId);
    };

    // Preview Mode - Document with all signatures overlaid
    if (viewMode === 'preview') {
        return (
            <div className="flex flex-col h-full bg-white">
                {/* Sticky Header */}
                <div className="sticky top-0 z-20 bg-white border-b border-secondary-200 px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setViewMode('signing')}
                            className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900"
                        >
                            <ArrowLeft size={20} />
                            <span className="font-medium">{t('common.back', 'Back')}</span>
                        </button>
                        <div className="text-sm font-semibold text-green-600 flex items-center gap-1">
                            <Check size={16} />
                            {signedCount}/{totalZones} {t('signing.signed', 'Signed')}
                        </div>
                    </div>
                    <h2 className="text-lg font-bold text-secondary-900 mt-2">
                        {t('signing.review_signatures', 'Review Signatures')}
                    </h2>
                </div>

                {/* Document Preview with All Signatures */}
                <div className="flex-grow overflow-y-auto px-4 py-6 bg-secondary-50">
                    {documentUrl ? (
                        <div className="flex flex-col items-center gap-4">
                            {/* Status Summary */}
                            <div className="w-full max-w-3xl bg-white rounded-lg border-2 border-green-300 p-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-green-100 text-green-700">
                                        <Check size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-secondary-900 text-sm">
                                            {allSigned
                                                ? t('signing.all_signatures_complete', 'All signatures completed')
                                                : t('signing.signatures_progress', '{{count}} of {{total}} signatures', { count: signedCount, total: totalZones })
                                            }
                                        </p>
                                        <p className="text-xs text-secondary-600">
                                            {allSigned
                                                ? t('signing.ready_to_submit', 'Ready to submit')
                                                : t('signing.complete_remaining', 'Complete remaining signatures')
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Document with Multiple Signature Overlays */}
                            <div className="w-full max-w-3xl relative">
                                <DocumentContentViewer
                                    documentUri={documentUrl}
                                    documentTitle={documentTitle}
                                    className="rounded-lg shadow-lg border-2 border-secondary-200 min-h-[400px]"
                                    onPageChange={setCurrentDocPage}
                                />

                                {/* Signature Images Overlays - Only show on correct page */}
                                {signatureZones.map((zone) => {
                                    const signatureImage = signatureImages.get(zone.documentSignerId);
                                    if (!signatureImage || zone.signatureZone.pageNumber !== currentDocPage) return null;

                                    return (
                                        <div
                                            key={zone.documentSignerId}
                                            className="absolute pointer-events-none"
                                            style={{
                                                left: `calc(${zone.signatureZone.x}% + 1rem)`,
                                                top: `calc(${zone.signatureZone.y}% + 4rem)`,
                                                width: `${zone.signatureZone.width}%`,
                                                height: `${zone.signatureZone.height}%`,
                                            }}
                                        >
                                            <img
                                                src={signatureImage}
                                                alt={`Signature ${zone.signatureZone.label}`}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Fallback: List view if no document URL */
                        <div className="space-y-3">
                            {signatureZones.map((zone, index) => {
                                const signatureData = signatures.get(zone.documentSignerId);
                                const isSigned = !!signatureData;

                                return (
                                    <div
                                        key={zone.documentSignerId}
                                        className={`bg-white rounded-lg border-2 p-4 ${isSigned ? 'border-green-300' : 'border-orange-300'}`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${isSigned ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {isSigned ? <Check size={18} /> : index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-secondary-900 text-sm">
                                                        {zone.signatureZone.label || `${t('signing.signature', 'Signature')} ${index + 1}`}
                                                    </p>
                                                    <p className="text-xs text-secondary-600">
                                                        {t('signing.page', 'Page')} {zone.signatureZone.pageNumber}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleEditZone(index)}
                                                className="text-xs text-primary-600 font-medium px-3 py-1 rounded-full bg-primary-50 hover:bg-primary-100"
                                            >
                                                {isSigned ? t('common.edit', 'Edit') : t('signing.add', 'Add')}
                                            </button>
                                        </div>

                                        {isSigned && signatureData && (
                                            <div className="border-2 border-secondary-200 rounded-lg p-3 bg-secondary-50">
                                                <canvas
                                                    ref={(canvas) => {
                                                        if (canvas && signatureData) {
                                                            const ctx = canvas.getContext('2d');
                                                            if (ctx) {
                                                                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                                                                signatureData.forEach(stroke => {
                                                                    stroke.points.forEach(point => {
                                                                        minX = Math.min(minX, point.x);
                                                                        minY = Math.min(minY, point.y);
                                                                        maxX = Math.max(maxX, point.x);
                                                                        maxY = Math.max(maxY, point.y);
                                                                    });
                                                                });
                                                                const signatureWidth = maxX - minX;
                                                                const signatureHeight = maxY - minY;
                                                                const canvasWidth = 320;
                                                                const canvasHeight = 120;
                                                                canvas.width = canvasWidth;
                                                                canvas.height = canvasHeight;
                                                                const padding = 15;
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
                                                                signatureData.forEach(stroke => {
                                                                    if (stroke.points.length > 0) {
                                                                        ctx.beginPath();
                                                                        const firstPoint = stroke.points[0];
                                                                        ctx.moveTo(firstPoint.x * scale + offsetX, firstPoint.y * scale + offsetY);
                                                                        for (let i = 1; i < stroke.points.length; i++) {
                                                                            const point = stroke.points[i];
                                                                            ctx.lineTo(point.x * scale + offsetX, point.y * scale + offsetY);
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

                                        {!isSigned && (
                                            <p className="text-xs text-orange-600 mt-2">
                                                {t('signing.not_signed_yet', 'Not signed yet')}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="sticky bottom-0 p-4 bg-white border-t border-secondary-200 shadow-lg">
                    <button
                        onClick={handleFinalSubmit}
                        disabled={!allSigned || isSubmitting}
                        className="w-full py-4 bg-primary-600 text-white rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors shadow-md disabled:shadow-none"
                    >
                        {isSubmitting
                            ? t('sign_components.signature_view.submitting', 'Submitting...')
                            : allSigned
                                ? t('signing.submit_all', `Submit All (${totalZones})`)
                                : t('signing.complete_all_first', `Complete All First (${signedCount}/${totalZones})`)
                        }
                    </button>
                </div>
            </div>
        );
    }

    // Signing Mode (Mobile Optimized)
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
                        <div className="text-sm font-semibold text-primary-600">
                            {signedCount}/{totalZones} {t('signing.saved', 'Saved')}
                        </div>
                    </div>

                    {/* Current Zone Info */}
                    <div className="bg-primary-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-primary-600 font-medium uppercase">
                                    {t('signing.zone', 'Zone')} {currentZoneIndex + 1}/{totalZones}
                                </p>
                                <h3 className="text-base font-bold text-primary-900 mt-0.5">
                                    {currentZone.signatureZone.label || `${t('signing.signature', 'Signature')} ${currentZoneIndex + 1}`}
                                </h3>
                                <p className="text-xs text-primary-700 mt-0.5">
                                    {t('signing.page', 'Page')} {currentZone.signatureZone.pageNumber}
                                </p>
                            </div>
                            {isZoneSigned(currentZone.documentSignerId) && (
                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                    <Check size={24} className="text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Zone Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {signatureZones.map((zone, index) => {
                            const isCurrent = index === currentZoneIndex;
                            const isSigned = isZoneSigned(zone.documentSignerId);

                            return (
                                <button
                                    key={zone.documentSignerId}
                                    onClick={() => setCurrentZoneIndex(index)}
                                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${isCurrent
                                        ? 'bg-primary-600 text-white scale-110 shadow-lg'
                                        : isSigned
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-secondary-100 text-secondary-600'
                                        }`}
                                >
                                    {isSigned ? <Check size={16} /> : index + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Signature Pad Area */}
            <div className="flex-grow flex flex-col p-4 bg-secondary-50">
                <div className="flex-grow flex items-center justify-center">
                    <div className="w-full max-w-lg aspect-[4/3] bg-white border-4 border-primary-200 rounded-2xl shadow-lg overflow-hidden">
                        <SignaturePad
                            ref={signaturePadRef}
                            strokeColor={DEFAULT_SIGNATURE_COLOR}
                            strokeWidth={DEFAULT_SIGNATURE_WIDTH}
                        />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 p-4 bg-white border-t border-secondary-200 shadow-lg space-y-3">
                {/* Clear & Skip */}
                <div className="flex gap-3">
                    <button
                        onClick={handleClearSignature}
                        disabled={!hasDrawn}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-secondary-300 text-secondary-700 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary-50 transition-colors"
                    >
                        <X size={20} />
                        {t('sign_components.signature_view.clear', 'Clear')}
                    </button>

                    {!isLastZone && !isZoneSigned(currentZone.documentSignerId) && (
                        <button
                            onClick={handleSkip}
                            className="px-6 py-3 bg-secondary-100 text-secondary-700 rounded-xl font-semibold hover:bg-secondary-200 transition-colors"
                        >
                            {t('common.skip', 'Skip')}
                        </button>
                    )}
                </div>

                {/* Save & Next / Review */}
                <button
                    onClick={handleSaveAndNext}
                    disabled={!hasDrawn}
                    className="w-full py-4 bg-primary-600 text-white rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors shadow-md disabled:shadow-none"
                >
                    {isLastZone
                        ? t('signing.save_and_review', '✓ Save & Review')
                        : t('signing.save_and_next', `✓ Save & Next (${currentZoneIndex + 2}/${totalZones})`)
                    }
                </button>

                {/* Preview All Button (only if some signed) */}
                {signedCount > 0 && (
                    <button
                        onClick={() => setViewMode('preview')}
                        className="w-full py-3 bg-secondary-100 text-secondary-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-secondary-200 transition-colors"
                    >
                        <Eye size={18} />
                        {t('signing.preview_all', `Preview All (${signedCount}/${totalZones})`)}
                    </button>
                )}
            </div>
        </div>
    );
};

export default MultiSignatureView;
