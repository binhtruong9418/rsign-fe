import React, { useState } from 'react';
import { XCircle, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from './LoadingSpinner';

interface DeclineModalProps {
    documentId: string;
    documentTitle: string;
    onSuccess?: () => void;
    onClose?: () => void;
}

export const DeclineModal: React.FC<DeclineModalProps> = ({
    documentId,
    documentTitle,
    onSuccess,
    onClose,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    const handleOpen = () => {
        setIsOpen(true);
        setReason('');
        setError('');
    };

    const handleClose = () => {
        if (loading) return;
        setIsOpen(false);
        setReason('');
        setError('');
        onClose?.();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (reason.length < 10) {
            setError(t('decline.error_too_short', 'Reason must be at least 10 characters'));
            return;
        }

        if (reason.length > 500) {
            setError(t('decline.error_too_long', 'Reason must be less than 500 characters'));
            return;
        }

        setLoading(true);

        try {
            const { signingApi } = await import('../services/signingApi');
            const data = await signingApi.declineDocument(documentId, reason);

            setIsOpen(false);
            onSuccess?.();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || t('decline.error_failed', 'Failed to decline document'));
        } finally {
            setLoading(false);
        }
    };

    const getCharCountColor = () => {
        if (reason.length < 10) return 'text-red-500';
        if (reason.length > 450) return 'text-orange-500';
        return 'text-secondary-500';
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={handleOpen}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm sm:text-base font-medium text-red-600 bg-white border-2 border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors duration-200"
            >
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                {t('decline.button', 'Decline Signature')}
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-secondary-200">
                            <h2 className="text-lg sm:text-xl font-bold text-secondary-900">
                                {t('decline.title', 'Decline Signature')}
                            </h2>
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="text-secondary-400 hover:text-secondary-600 disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-6">
                            {/* Warning */}
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
                                <div className="flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-yellow-900 mb-1">
                                            {t('decline.warning_title', 'You are about to decline:')}
                                        </p>
                                        <p className="text-sm text-yellow-800 font-semibold break-words">
                                            {documentTitle}
                                        </p>
                                        <p className="text-sm text-yellow-700 mt-2">
                                            {t('decline.warning_message', 'This action cannot be undone and will notify the document sender.')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-900 mb-2">
                                        {t('decline.reason_label', 'Reason for declining')} <span className="text-red-500">*</span>
                                    </label>

                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full border border-secondary-300 rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                                        placeholder={t('decline.reason_placeholder', 'Please provide a reason (minimum 10 characters)...')}
                                        maxLength={500}
                                        required
                                        disabled={loading}
                                    />

                                    <div className="flex justify-between items-center mt-2">
                                        {error && (
                                            <span className="text-red-500 text-sm">
                                                {error}
                                            </span>
                                        )}
                                        <span className={`text-xs ml-auto ${getCharCountColor()}`}>
                                            {reason.length}/500
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 px-4 py-2.5 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors text-sm font-medium"
                                        disabled={loading}
                                    >
                                        {t('common.cancel', 'Cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                        disabled={loading || reason.length < 10}
                                    >
                                        {loading ? (
                                            <>
                                                <LoadingSpinner />
                                                {t('decline.submitting', 'Declining...')}
                                            </>
                                        ) : (
                                            t('decline.confirm', 'Confirm Decline')
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DeclineModal;
