import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, X, Eye } from 'lucide-react';
import SignaturePad, { SignaturePadRef } from '../SignaturePad';
import DocumentContentViewer, { SignatureImage } from '../DocumentContentViewer';
import SignatureConfirmDialog from './SignatureConfirmDialog';
import { DEFAULT_SIGNATURE_COLOR, DEFAULT_SIGNATURE_WIDTH } from '../../constants/app';
import { useTranslation } from 'react-i18next';
import type { SignatureZone, Stroke } from '../../types';

interface SignatureViewProps {
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

const SignatureView: React.FC<SignatureViewProps> = ({
    onBack,
    onSubmitAll,
    isSubmitting,
    signatureZones,
    documentTitle,
    documentUrl,
}) => {
    const { t } = useTranslation();
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [signatures, setSignatures] = useState<Map<string, Stroke[]>>(new Map());
    const [signatureImages, setSignatureImages] = useState<Map<string, string>>(new Map());
    const [viewMode, setViewMode] = useState<ViewMode>('signing');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const signaturePadRef = useRef<SignaturePadRef>(null);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [currentDocPage, setCurrentDocPage] = useState(1);

    const totalZones = signatureZones.length;
    const signedCount = signatures.size;
    const allSigned = signedCount === totalZones;
    const selectedZone = signatureZones.find(z => z.documentSignerId === selectedZoneId);
    const isSingleSignature = totalZones === 1;

    // Auto-select the first zone if single signature mode
    useEffect(() => {
        if (isSingleSignature && !selectedZoneId && signatureZones.length > 0) {
            setSelectedZoneId(signatureZones[0].documentSignerId);
        }
    }, [isSingleSignature, selectedZoneId, signatureZones]);

    // Reset drawn state when zone changes
    useEffect(() => {
        setHasDrawn(false);
        signaturePadRef.current?.clear();
    }, [selectedZoneId]);

    // Track if user has drawn
    useEffect(() => {
        const checkDrawing = setInterval(() => {
            const signature = signaturePadRef.current?.getSignature();
            setHasDrawn(!!signature && signature.length > 0);
        }, 300);

        return () => clearInterval(checkDrawing);
    }, []);

    const handleSaveSignature = () => {
        if (!selectedZoneId) return;

        const strokesData = signaturePadRef.current?.getSignature();
        if (!strokesData || strokesData.length === 0) {
            return;
        }

        // Generate signature image with proper aspect ratio matching the signature zone
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx && selectedZone) {
            // Calculate bounding box of all strokes
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

            // Use a reasonable canvas size that maintains quality
            // We use 1200px width as base for higher quality, height calculated from signature zone aspect ratio
            const zoneAspectRatio = selectedZone.signatureZone.width / selectedZone.signatureZone.height;
            const baseWidth = 1200;
            const baseHeight = baseWidth / zoneAspectRatio;

            canvas.width = baseWidth;
            canvas.height = baseHeight;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate scaling to fit signature into canvas with minimal padding (10% of canvas size)
            const paddingPercent = 0.05; // 5% padding on each side
            const paddingX = canvas.width * paddingPercent;
            const paddingY = canvas.height * paddingPercent;
            const availableWidth = canvas.width - paddingX * 2;
            const availableHeight = canvas.height - paddingY * 2;

            const scaleX = availableWidth / signatureWidth;
            const scaleY = availableHeight / signatureHeight;
            const scale = Math.min(scaleX, scaleY); // Use smaller scale to fit in both dimensions

            // Center the signature
            const scaledWidth = signatureWidth * scale;
            const scaledHeight = signatureHeight * scale;
            const offsetX = (canvas.width - scaledWidth) / 2 - minX * scale;
            const offsetY = (canvas.height - scaledHeight) / 2 - minY * scale;

            // Draw signature with scaling and centering
            ctx.strokeStyle = DEFAULT_SIGNATURE_COLOR;
            ctx.lineWidth = DEFAULT_SIGNATURE_WIDTH * scale;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            strokesData.forEach(stroke => {
                if (stroke.points.length > 0) {
                    ctx.beginPath();
                    ctx.moveTo(
                        stroke.points[0].x * scale + offsetX,
                        stroke.points[0].y * scale + offsetY
                    );
                    for (let i = 1; i < stroke.points.length; i++) {
                        ctx.lineTo(
                            stroke.points[i].x * scale + offsetX,
                            stroke.points[i].y * scale + offsetY
                        );
                    }
                    ctx.stroke();
                }
            });

            setSignatureImages(prev => new Map(prev).set(selectedZoneId, canvas.toDataURL('image/png')));
        }

        // Save signature
        setSignatures(prev => new Map(prev).set(selectedZoneId, strokesData));

        // For single signature mode, go directly to preview after save
        // For multi signature mode, go back to list
        if (isSingleSignature) {
            setViewMode('preview');
        } else {
            setSelectedZoneId(null);
        }
    };

    const handleClearSignature = () => {
        signaturePadRef.current?.clear();
        setHasDrawn(false);
    };

    const handleDeleteSignature = (zoneId: string) => {
        const newSignatures = new Map(signatures);
        const newImages = new Map(signatureImages);
        newSignatures.delete(zoneId);
        newImages.delete(zoneId);
        setSignatures(newSignatures);
        setSignatureImages(newImages);
    };

    const handleFinalSubmit = () => {
        if (signatures.size !== totalZones) {
            return;
        }
        setShowConfirmDialog(true);
    };

    const handleConfirmSubmit = () => {
        onSubmitAll(signatures);
        setShowConfirmDialog(false);
    };

    const isZoneSigned = (documentSignerId: string) => {
        return signatures.has(documentSignerId);
    };

    // Preview Mode - Document with all signatures overlaid
    if (viewMode === 'preview') {
        return (
            <>
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
                    <div className="grow overflow-y-auto px-4 py-6 bg-secondary-50">
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
                                <div className="w-full max-w-3xl">
                                    {/* Prepare signature images for DocumentContentViewer */}
                                    <DocumentContentViewer
                                        documentUri={documentUrl}
                                        documentTitle={documentTitle}
                                        className="rounded-lg shadow-lg border-2 border-secondary-200 min-h-[400px]"
                                        onPageChange={setCurrentDocPage}
                                        signatureZones={signatureZones.map(zone => ({
                                            pageNumber: zone.signatureZone.pageNumber,
                                            x: zone.signatureZone.x,
                                            y: zone.signatureZone.y,
                                            width: zone.signatureZone.width,
                                            height: zone.signatureZone.height,
                                            label: zone.signatureZone.label,
                                        }))}
                                        signatureImages={Array.from(signatures.entries()).map(([documentSignerId, _]) => {
                                            const zone = signatureZones.find(z => z.documentSignerId === documentSignerId);
                                            const imgData = signatureImages.get(documentSignerId);
                                            if (!zone || !imgData) return null;
                                            return {
                                                pageNumber: zone.signatureZone.pageNumber,
                                                x: zone.signatureZone.x,
                                                y: zone.signatureZone.y,
                                                width: zone.signatureZone.width,
                                                height: zone.signatureZone.height,
                                                imageData: imgData,
                                            } as SignatureImage;
                                        }).filter((img): img is SignatureImage => img !== null)}
                                    />
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
                                                    onClick={() => setSelectedZoneId(zone.documentSignerId)}
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

                {/* Render confirmation dialog */}
                <SignatureConfirmDialog
                    isOpen={showConfirmDialog}
                    isSubmitting={isSubmitting}
                    totalZones={totalZones}
                    signatureZones={signatureZones}
                    signatureImages={signatureImages}
                    onCancel={() => setShowConfirmDialog(false)}
                    onConfirm={handleConfirmSubmit}
                />
            </>
        );
    }

    // Signing Mode - Show list if no signature selected, or show pad if signature selected
    if (!selectedZoneId) {
        return (
            <>
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
                                    {signedCount}/{totalZones} {t('signing.signed', 'Signed')}
                                </div>
                            </div>

                            <h2 className="text-lg font-bold text-secondary-900">
                                {t('signing.sign_all_zones', 'Sign All Required Zones')}
                            </h2>
                            <p className="text-xs text-secondary-600 mt-1">
                                {allSigned
                                    ? t('signing.all_complete_can_preview', 'All signatures complete. You can preview and submit.')
                                    : t('signing.click_zone_to_sign', 'Click on each zone to add your signature')
                                }
                            </p>
                        </div>
                    </div>

                    {/* Signature List */}
                    <div className="grow overflow-y-auto px-4 py-4 bg-secondary-50 space-y-3">
                        {signatureZones.map((zone, index) => {
                            const isSigned = isZoneSigned(zone.documentSignerId);
                            const signatureImage = signatureImages.get(zone.documentSignerId);

                            return (
                                <div
                                    key={zone.documentSignerId}
                                    className={`bg-white rounded-lg border-2 p-4 shadow-sm transition-all ${isSigned ? 'border-green-300' : 'border-orange-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        {/* Zone Info */}
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-base ${isSigned ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {isSigned ? <Check size={20} /> : index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-secondary-900">
                                                    {zone.signatureZone.label || `${t('signing.signature', 'Signature')} ${index + 1}`}
                                                </h3>
                                                <p className="text-xs text-secondary-600 mt-0.5">
                                                    {t('signing.page', 'Page')} {zone.signatureZone.pageNumber}
                                                </p>

                                                {/* Preview signature if signed */}
                                                {isSigned && signatureImage && (
                                                    <div className="mt-2 border-2 border-secondary-200 rounded-lg p-2 bg-secondary-50">
                                                        <img
                                                            src={signatureImage}
                                                            alt={`Signature ${index + 1}`}
                                                            className="h-16 object-contain"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => setSelectedZoneId(zone.documentSignerId)}
                                                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors whitespace-nowrap"
                                            >
                                                {isSigned ? t('common.edit', 'Edit') : t('signing.sign', 'Sign')}
                                            </button>
                                            {isSigned && (
                                                <button
                                                    onClick={() => handleDeleteSignature(zone.documentSignerId)}
                                                    className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
                                                >
                                                    {t('common.delete', 'Delete')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="sticky bottom-0 p-4 bg-white border-t border-secondary-200 shadow-lg space-y-3">
                        {signedCount > 0 && (
                            <button
                                onClick={() => setViewMode('preview')}
                                className="w-full py-3 bg-secondary-100 text-secondary-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-secondary-200 transition-colors"
                            >
                                <Eye size={20} />
                                {t('signing.preview_document', 'Preview Document')}
                            </button>
                        )}

                        {allSigned && (
                            <button
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-primary-600 text-white rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors shadow-md disabled:shadow-none"
                            >
                                {isSubmitting
                                    ? t('sign_components.signature_view.submitting', 'Submitting...')
                                    : t('signing.submit_all', `Submit All (${totalZones})`)
                                }
                            </button>
                        )}
                    </div>
                </div>

                {/* Render confirmation dialog */}
                <SignatureConfirmDialog
                    isOpen={showConfirmDialog}
                    isSubmitting={isSubmitting}
                    totalZones={totalZones}
                    signatureZones={signatureZones}
                    signatureImages={signatureImages}
                    onCancel={() => setShowConfirmDialog(false)}
                    onConfirm={handleConfirmSubmit}
                />
            </>
        );
    }

    // Signature Pad View (when a zone is selected)
    return (
        <>
            <div className="flex flex-col h-full bg-white">
                {/* Sticky Header */}
                <div className="sticky top-0 z-20 bg-white border-b border-secondary-200 shadow-sm">
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                            <button
                                onClick={() => {
                                    if (isSingleSignature) {
                                        // In single signature mode, go back to document review
                                        onBack();
                                    } else {
                                        // In multi signature mode, go back to list
                                        setSelectedZoneId(null);
                                    }
                                }}
                                className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900"
                            >
                                <ArrowLeft size={20} />
                                <span className="font-medium text-sm">{t('common.back', 'Back')}</span>
                            </button>
                            <div className="text-sm font-semibold text-primary-600">
                                {signedCount}/{totalZones} {t('signing.signed', 'Signed')}
                            </div>
                        </div>

                        {/* Current Zone Info */}
                        {selectedZone && (
                            <div className="bg-primary-50 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-primary-600 font-medium uppercase">
                                            {t('signing.signing_zone', 'Signing Zone')}
                                        </p>
                                        <h3 className="text-base font-bold text-primary-900 mt-0.5">
                                            {selectedZone.signatureZone.label || t('signing.signature', 'Signature')}
                                        </h3>
                                        <p className="text-xs text-primary-700 mt-0.5">
                                            {t('signing.page', 'Page')} {selectedZone.signatureZone.pageNumber}
                                        </p>
                                    </div>
                                    {isZoneSigned(selectedZone.documentSignerId) && (
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                            <Check size={24} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Signature Pad Area */}
                <div className="grow flex flex-col p-4 bg-secondary-50 min-h-0">
                    <div className="grow flex items-center justify-center min-h-0">
                        <div className="w-full max-w-2xl max-h-full aspect-4/3 bg-white border-4 border-primary-200 rounded-2xl shadow-lg overflow-hidden">
                            <SignaturePad
                                ref={signaturePadRef}
                                strokeColor={DEFAULT_SIGNATURE_COLOR}
                                strokeWidth={DEFAULT_SIGNATURE_WIDTH}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="sticky bottom-0 p-4 bg-white border-t border-secondary-200 shadow-lg">
                    <div className="flex flex-col lg:flex-row gap-3">
                        {/* Clear */}
                        <button
                            onClick={handleClearSignature}
                            disabled={!hasDrawn}
                            className="w-full lg:w-auto lg:flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-secondary-300 text-secondary-700 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary-50 transition-colors"
                        >
                            <X size={20} />
                            {t('sign_components.signature_view.clear', 'Clear')}
                        </button>

                        {/* Save */}
                        <button
                            onClick={handleSaveSignature}
                            disabled={!hasDrawn}
                            className="w-full lg:flex-2 py-4 lg:py-3 bg-primary-600 text-white rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors shadow-md disabled:shadow-none"
                        >
                            <Check size={20} className="inline mr-2" />
                            {t('common.save', 'Save')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Render confirmation dialog */}
            <SignatureConfirmDialog
                isOpen={showConfirmDialog}
                isSubmitting={isSubmitting}
                totalZones={totalZones}
                signatureZones={signatureZones}
                signatureImages={signatureImages}
                onCancel={() => setShowConfirmDialog(false)}
                onConfirm={handleConfirmSubmit}
            />
        </>
    );
};

export default SignatureView;
