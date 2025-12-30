import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import SignaturePad, { SignaturePadRef } from '../SignaturePad';
import { DEFAULT_SIGNATURE_COLOR, DEFAULT_SIGNATURE_WIDTH } from '../../constants/app';
import { useTranslation } from 'react-i18next';
import type { SignatureZone, Stroke } from '../../types';

interface SignatureZoneWithData {
    documentSignerId: string;
    signatureZone: SignatureZone;
    signatureData?: Stroke[];
}

interface MultiSignatureViewProps {
    onBack: () => void;
    onSubmitAll: (signatures: Map<string, Stroke[]>) => void;
    isSubmitting: boolean;
    signatureZones: Array<{
        documentSignerId: string;
        signatureZone: SignatureZone;
    }>;
    documentTitle: string;
}

const MultiSignatureView: React.FC<MultiSignatureViewProps> = ({
    onBack,
    onSubmitAll,
    isSubmitting,
    signatureZones,
    documentTitle,
}) => {
    const { t } = useTranslation();
    const [currentZoneIndex, setCurrentZoneIndex] = useState(0);
    const [signatures, setSignatures] = useState<Map<string, Stroke[]>>(new Map());
    const signaturePadRef = useRef<SignaturePadRef>(null);

    const currentZone = signatureZones[currentZoneIndex];
    const totalZones = signatureZones.length;
    const signedCount = signatures.size;
    const allSigned = signedCount === totalZones;

    // Load saved signature when changing zones
    useEffect(() => {
        if (currentZone) {
            const savedSignature = signatures.get(currentZone.documentSignerId);
            if (savedSignature) {
                // Clear and redraw saved signature
                signaturePadRef.current?.clear();
                // Note: SignaturePad doesn't have a method to load strokes,
                // so we'll need to enhance it or just clear it
            } else {
                signaturePadRef.current?.clear();
            }
        }
    }, [currentZoneIndex]);

    const handleSaveCurrentSignature = () => {
        const strokesData = signaturePadRef.current?.getSignature();
        if (strokesData && strokesData.length > 0) {
            setSignatures(prev => new Map(prev).set(currentZone.documentSignerId, strokesData));
            return true;
        }
        return false;
    };

    const handleNext = () => {
        // Save current signature before moving
        handleSaveCurrentSignature();

        if (currentZoneIndex < totalZones - 1) {
            setCurrentZoneIndex(currentZoneIndex + 1);
        }
    };

    const handlePrevious = () => {
        // Save current signature before moving
        handleSaveCurrentSignature();

        if (currentZoneIndex > 0) {
            setCurrentZoneIndex(currentZoneIndex - 1);
        }
    };

    const handleZoneClick = (index: number) => {
        // Save current signature before switching
        handleSaveCurrentSignature();
        setCurrentZoneIndex(index);
    };

    const handleClearSignature = () => {
        signaturePadRef.current?.clear();
        // Remove from saved signatures
        setSignatures(prev => {
            const newMap = new Map(prev);
            newMap.delete(currentZone.documentSignerId);
            return newMap;
        });
    };

    const handleSubmitAll = () => {
        // Save current signature first
        handleSaveCurrentSignature();

        if (signatures.size !== totalZones) {
            return;
        }

        onSubmitAll(signatures);
    };

    const isZoneSigned = (documentSignerId: string) => {
        return signatures.has(documentSignerId);
    };

    return (
        <div className="flex flex-col h-full relative bg-secondary-50 sm:bg-white">
            {/* Header / Back Button Area */}
            <div className="absolute top-4 left-4 z-10">
                <button
                    onClick={onBack}
                    className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm text-secondary-600 hover:text-primary-600 pl-2 pr-3 py-2 rounded-full shadow-sm border border-secondary-200 transition-colors"
                    aria-label="Back to document"
                >
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">
                        {t('sign_components.signature_view.back', 'Back')}
                    </span>
                </button>
            </div>

            {/* Progress Indicator */}
            <div className="absolute top-4 right-4 z-10">
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-secondary-200">
                    <div className="flex items-center space-x-2">
                        <FileText size={16} className="text-primary-600" />
                        <span className="text-sm font-semibold text-secondary-700">
                            {signedCount}/{totalZones} {t('signing.signatures_completed', 'Signed')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Zone Navigation Pills - Mobile and Desktop */}
            <div className="pt-16 pb-3 px-4 bg-white border-b border-secondary-200">
                <div className="max-w-4xl mx-auto">
                    <p className="text-xs text-secondary-500 mb-2 text-center">
                        {t('signing.multi_sign_instruction', 'Sign all signature zones to complete')}
                    </p>
                    <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                        {signatureZones.map((zone, index) => {
                            const isCurrent = index === currentZoneIndex;
                            const isSigned = isZoneSigned(zone.documentSignerId);

                            return (
                                <button
                                    key={zone.documentSignerId}
                                    onClick={() => handleZoneClick(index)}
                                    className={`
                                        flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium
                                        transition-all whitespace-nowrap
                                        ${isCurrent
                                            ? 'bg-primary-600 text-white shadow-md scale-105'
                                            : isSigned
                                                ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                                                : 'bg-secondary-100 text-secondary-600 border border-secondary-300 hover:bg-secondary-200'
                                        }
                                    `}
                                >
                                    {isSigned && <Check size={14} />}
                                    <span className="hidden sm:inline">
                                        {zone.signatureZone.label || `${t('signing.signature', 'Signature')} ${index + 1}`}
                                    </span>
                                    <span className="sm:hidden">
                                        {index + 1}
                                    </span>
                                    <span className="text-xs opacity-75">
                                        (p.{zone.signatureZone.pageNumber})
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Current Zone Info */}
            <div className="px-4 py-3 bg-primary-50 border-b border-primary-100">
                <div className="max-w-4xl mx-auto text-center">
                    <h3 className="text-lg font-semibold text-primary-900">
                        {currentZone.signatureZone.label || `${t('signing.signature', 'Signature')} ${currentZoneIndex + 1}`}
                    </h3>
                    <p className="text-sm text-primary-700">
                        {t('signing.page', 'Page')} {currentZone.signatureZone.pageNumber} • {documentTitle}
                    </p>
                </div>
            </div>

            {/* Signature Area */}
            <div className="flex-grow flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                <div className="w-full aspect-square max-w-[500px] sm:max-w-none sm:w-full sm:h-full sm:aspect-auto bg-white border-2 border-primary-200 rounded-2xl sm:rounded-lg shadow-lg overflow-hidden relative">
                    <SignaturePad
                        ref={signaturePadRef}
                        strokeColor={DEFAULT_SIGNATURE_COLOR}
                        strokeWidth={DEFAULT_SIGNATURE_WIDTH}
                    />
                    {/* Helper text */}
                    <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                        <span className="text-xs text-secondary-400 bg-white/90 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm">
                            {isZoneSigned(currentZone.documentSignerId)
                                ? t('signing.signature_saved', 'Signature saved - you can modify it')
                                : t('sign_components.signature_view.sign_above', 'Draw your signature above')
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation & Action Buttons */}
            <div className="p-4 bg-white border-t border-secondary-200 shrink-0 z-20">
                <div className="max-w-4xl mx-auto space-y-3">
                    {/* Navigation buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrevious}
                            disabled={currentZoneIndex === 0}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-secondary-100 text-secondary-700 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary-200 transition-colors"
                        >
                            <ChevronLeft size={20} />
                            <span className="hidden sm:inline">{t('common.previous', 'Previous')}</span>
                        </button>

                        <button
                            onClick={handleClearSignature}
                            className="px-6 py-3 bg-white border-2 border-secondary-300 text-secondary-700 rounded-lg font-medium hover:bg-secondary-50 transition-colors"
                        >
                            {t('sign_components.signature_view.clear', 'Clear')}
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={currentZoneIndex === totalZones - 1}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-secondary-100 text-secondary-700 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary-200 transition-colors"
                        >
                            <span className="hidden sm:inline">{t('common.next', 'Next')}</span>
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Submit button */}
                    <button
                        onClick={handleSubmitAll}
                        disabled={!allSigned || isSubmitting}
                        className="w-full py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors shadow-lg disabled:shadow-none"
                    >
                        {isSubmitting
                            ? t('sign_components.signature_view.submitting', 'Submitting...')
                            : allSigned
                                ? t('signing.submit_all_signatures', 'Submit All Signatures')
                                : t('signing.complete_all_signatures', `Complete All Signatures (${signedCount}/${totalZones})`)
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MultiSignatureView;
