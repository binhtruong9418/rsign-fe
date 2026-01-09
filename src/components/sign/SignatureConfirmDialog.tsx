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
                <div className="bg-linear-to-r from-primary-600 to-primary-700 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Check size={24} className="text-white" />
                        </div>
                        <h3 id="confirm-dialog-title" className="text-xl font-bold text-white">
                            {t('signing.confirm_submit', 'Confirm Submission')}
                        </h3>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    <p id="confirm-dialog-description" className="text-secondary-700 text-base mb-5 leading-relaxed">
                        {t('signing.confirm_submit_message', 'You are about to submit {{count}} signature(s). Once submitted, you cannot modify them. Are you sure you want to continue?', { count: totalZones })}
                    </p>

                    {/* Signatures Summary with Previews */}
                    <div className="bg-secondary-50 rounded-xl p-5 border border-secondary-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Check size={16} className="text-green-600" />
                            </div>
                            <span className="font-semibold text-secondary-900 text-base">
                                {t('signing.signatures_ready', 'Signatures Ready')} ({totalZones})
                            </span>
                        </div>

                        {/* Scrollable list for many signatures */}
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {signatureZones.map((zone, index) => {
                                const signatureImage = signatureImages.get(zone.documentSignerId);
                                return (
                                    <div
                                        key={zone.documentSignerId}
                                        className="flex items-center gap-3 bg-white p-3 rounded-lg border border-secondary-200 hover:border-green-300 transition-colors"
                                    >
                                        <span className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-secondary-900 truncate">
                                                {zone.signatureZone.label || `${t('signing.signature', 'Signature')} ${index + 1}`}
                                            </p>
                                            <p className="text-xs text-secondary-500 mt-0.5">
                                                {t('signing.page', 'Page')} {zone.signatureZone.pageNumber}
                                            </p>
                                        </div>
                                        {signatureImage && (
                                            <div className="w-20 h-12 bg-white border border-secondary-200 rounded flex items-center justify-center shrink-0">
                                                <img
                                                    src={signatureImage}
                                                    alt={`Signature ${index + 1}`}
                                                    className="max-w-full max-h-full object-contain p-1"
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
                <div className="px-6 py-5 bg-secondary-50 border-t border-secondary-200 flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 px-4 bg-white border-2 border-secondary-300 text-secondary-700 rounded-xl font-semibold hover:bg-secondary-50 hover:border-secondary-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 px-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/30"
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
