import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SignatureZone } from '../../types';

interface SignatureConfirmDialogProps {
    isOpen: boolean;
    isSubmitting: boolean;
    totalZones: number;
    signatureZones: Array<{
        documentSignerId: string;
        signatureZone: SignatureZone;
    }>;
    signatureImages: Map<string, string>;
    onCancel: () => void;
    onConfirm: () => void;
}

const SignatureConfirmDialog: React.FC<SignatureConfirmDialogProps> = ({
    isOpen,
    isSubmitting,
    totalZones,
    signatureZones,
    signatureImages,
    onCancel,
    onConfirm,
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) {
                    onCancel();
                }
            }}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
            >
                {/* Header */}
                <div className="bg-linear-to-r from-primary-600 to-primary-700 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0">
                            <Check size={20} className="text-white sm:h-6 sm:w-6" />
                        </div>
                        <h3 id="confirm-dialog-title" className="text-lg sm:text-xl font-bold text-white">
                            {t('signing.confirm_submit', 'Confirm Submission')}
                        </h3>
                    </div>
                </div>

                {/* Body */}
                <div className="px-4 py-4 sm:px-6 sm:py-6">
                    <p id="confirm-dialog-description" className="text-secondary-700 text-sm sm:text-base mb-4 leading-relaxed">
                        {t('signing.confirm_submit_short', 'Submit {{count}} signature(s)? This action cannot be undone.', { count: totalZones })}
                    </p>

                    {/* Signatures Summary with Previews */}
                    <div className="bg-secondary-50 rounded-xl p-3 sm:p-5 border border-secondary-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Check size={14} className="text-green-600 sm:h-4 sm:w-4" />
                            </div>
                            <span className="font-semibold text-secondary-900 text-sm sm:text-base">
                                {t('signing.signatures_ready', 'Signatures Ready')} ({totalZones})
                            </span>
                        </div>

                        {/* Scrollable list for many signatures */}
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 customize-scrollbar">
                            {signatureZones.map((zone, index) => {
                                const signatureImage = signatureImages.get(zone.documentSignerId);
                                return (
                                    <div
                                        key={zone.documentSignerId}
                                        className="flex items-center gap-3 bg-white p-2 sm:p-3 rounded-lg border border-secondary-200 shadow-sm"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                                    {index + 1}
                                                </span>
                                                <p className="font-medium text-secondary-900 text-sm truncate">
                                                    {zone.signatureZone.label || `${t('signing.signature', 'Signature')} ${index + 1}`}
                                                </p>
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-secondary-500 pl-7">
                                                {t('signing.page', 'Page')} {zone.signatureZone.pageNumber}
                                            </p>
                                        </div>
                                        {signatureImage && (
                                            <div className="w-24 h-12 sm:w-28 sm:h-14 bg-white border border-secondary-100 rounded flex items-center justify-center shrink-0 overflow-hidden">
                                                <img
                                                    src={signatureImage}
                                                    alt={`Signature ${index + 1}`}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-4 sm:px-6 sm:py-5 bg-secondary-50 border-t border-secondary-200 flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-3 sm:py-3.5 sm:px-4 bg-white border-2 border-secondary-300 text-secondary-700 text-sm sm:text-base rounded-xl font-semibold hover:bg-secondary-50 hover:border-secondary-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-3 sm:py-3.5 sm:px-4 bg-primary-600 text-white text-sm sm:text-base rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/30"
                    >
                        {isSubmitting
                            ? t('sign_components.signature_view.submitting', 'Submitting...')
                            : t('common.confirm', 'Confirm')
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignatureConfirmDialog;
