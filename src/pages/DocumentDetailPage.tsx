import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText, Calendar, Users, User, AlertCircle, MapPin, PenTool } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import DocumentContentViewer from '../components/DocumentContentViewer';
import { signingApi } from '../services/signingApi';
import { handleSigningError } from '../utils/errorHandler';
import { showToast } from '../utils/toast';
import type { DocumentDetails } from '../types';

/**
 * Document Detail Page
 * Supports both single and multiple signature documents
 */
const DocumentDetailPage: React.FC = () => {
    const { documentId } = useParams<{ documentId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [details, setDetails] = useState<DocumentDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (documentId) {
            loadDocumentDetails();
        }
    }, [documentId]);

    const loadDocumentDetails = async () => {
        if (!documentId) return;

        try {
            setLoading(true);
            setError(null);
            const data = await signingApi.getDocumentDetails(documentId);
            setDetails(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load document details');
            console.error('Failed to load document details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSigning = async () => {
        if (!documentId) return;

        setCreating(true);
        try {
            const { sessionId } = await signingApi.createCheckoutSession(documentId);

            // Navigate to unified signing page
            navigate(`/sign/${sessionId}`, {
                state: {
                    documentId,
                }
            });
        } catch (err: any) {
            handleSigningError(err, {
                onDocumentLocked: () => {
                    showToast.error(
                        t(
                            'errors.document_locked',
                            'This document is currently being signed on another device. Please try again in 5 seconds.'
                        )
                    );
                },
                onDefault: (message) => {
                    showToast.error(message || t('errors.failed_to_start_signing', 'Failed to start signing session'));
                },
            });
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getDaysRemaining = (deadline?: string) => {
        if (!deadline) return null;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const days = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return days;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !details) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error || 'Document not found'}</p>
                <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    const document = details.document;
    const daysRemaining = document.deadline ? getDaysRemaining(document.deadline) : null;
    const isUrgent = daysRemaining !== null && daysRemaining <= 3;
    const canSign = details.status === 'PENDING';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-3 sm:mb-4 text-sm sm:text-base"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('common.back', 'Back')}
                </button>

                <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 wrap-break-word">{document.title}</h1>
            </div>

            {/* Urgent Warning */}
            {isUrgent && canSign && (
                <div className="mb-4 sm:mb-6 bg-orange-50 border-l-4 border-orange-500 p-3 sm:p-4 rounded mx-4 sm:mx-0">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0" />
                        <p className="text-sm sm:text-base text-orange-800 font-medium">
                            ⚠️ {t('document_detail.urgent_warning', 'This document expires in {{days}} days', { days: daysRemaining })}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Main Content - PDF Viewer */}
                <div className="lg:col-span-2 order-2 lg:order-1">
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                        <h2 className="text-base sm:text-lg font-semibold text-secondary-900 mb-3 sm:mb-4">
                            {t('document_detail.document_preview', 'Document Preview')}
                        </h2>
                        <DocumentContentViewer
                            documentUri={document.originalFileUrl}
                            documentTitle={document.title}
                            className="h-full w-full"
                        />
                    </div>
                </div>

                {/* Sidebar - Document Info & Actions */}
                <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
                    {/* Document Information */}
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                        <h2 className="text-base sm:text-lg font-semibold text-secondary-900 mb-3 sm:mb-4">
                            {t('document_detail.information', 'Document Information')}
                        </h2>

                        <div className="space-y-3 sm:space-y-4">
                            {/* Status */}
                            <div>
                                <label className="text-xs sm:text-sm font-medium text-secondary-600">
                                    {t('document_detail.status', 'Status')}
                                </label>
                                <div className="mt-1">
                                    <span className={`inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${details.status === 'SIGNED' ? 'bg-green-100 text-green-800' :
                                        details.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                                            'bg-secondary-100 text-secondary-800'
                                        }`}>
                                        {details.status}
                                    </span>
                                </div>
                            </div>
                            {/* My Signing Status - Temporarily disabled due to type limitations */}
                            {/* {details.mySigningStatus && (
                                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                    <label className="text-xs sm:text-sm font-semibold text-blue-900 flex items-center gap-2">
                                        <PenTool className="w-4 h-4" />
                                        {t('document_detail.my_status', 'My Status')}
                                    </label>
                                    <div className="mt-3 space-y-2">
                                        <div className="bg-white p-2.5 rounded border border-blue-100">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs sm:text-sm text-secondary-600">
                                                    {t('document_detail.total_signatures_required', 'Total signatures required')}
                                                </span>
                                                <span className="text-base sm:text-lg font-bold text-blue-600">
                                                    {details.mySigningStatus.totalRequired}
                                                </span>
                                            </div>
                                            <p className="text-xs text-secondary-500 italic">
                                                {t('document_detail.signatures_explanation', '(You need to sign this many signatures)')}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs sm:text-sm text-secondary-600">
                                                {t('document_detail.completed_signatures', 'Completed')}
                                            </span>
                                            <span className="text-xs sm:text-sm font-semibold text-green-600">
                                                {details.mySigningStatus.completed} {t('document_detail.signatures_unit', 'signatures')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs sm:text-sm text-secondary-600">
                                                {t('document_detail.pending_signatures', 'Remaining')}
                                            </span>
                                            <span className="text-xs sm:text-sm font-semibold text-orange-600">
                                                {details.mySigningStatus.pending} {t('document_detail.signatures_unit', 'signatures')}
                                            </span>
                                        </div>
                                        {details.mySigningStatus.status === 'WAITING' && (
                                            <div className="bg-orange-50 border border-orange-200 p-2 rounded mt-2">
                                                <p className="text-xs sm:text-sm text-orange-700 font-medium">
                                                    ⏳ {t('document_detail.waiting_previous', 'Waiting for previous signer')}
                                                </p>
                                            </div>
                                        )}
                                        {details.mySigningStatus.status === 'COMPLETED' && (
                                            <div className="bg-green-50 border border-green-200 p-2 rounded mt-2">
                                                <p className="text-xs sm:text-sm text-green-700 font-medium">
                                                    ✓ {t('document_detail.all_completed', 'Completed all signatures')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )} */}

                            {/* Deadline */}
                            {document.deadline && (
                                <div>
                                    <label className="text-xs sm:text-sm font-medium text-secondary-600 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        {t('document_detail.deadline', 'Deadline')}
                                    </label>
                                    <p className="mt-1 text-xs sm:text-sm text-secondary-900">{formatDate(document.deadline)}</p>
                                    {daysRemaining !== null && (
                                        <p className={`text-xs sm:text-sm mt-1 ${isUrgent ? 'text-orange-600 font-medium' : 'text-secondary-600'}`}>
                                            ({daysRemaining} {t('document_detail.days_remaining', 'days remaining')})
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Other sections temporarily disabled due to type limitations */}
                    {/* Signing Mode & Flow
                    <div>
                        <label className="text-xs sm:text-sm font-medium text-secondary-600">
                            {t('document_detail.signing_type', 'Signing Type')}
                        </label>
                        <div className="mt-1 flex flex-wrap gap-2">
                            <span className="text-xs px-2 py-1 bg-secondary-100 text-secondary-700 rounded">
                                {details.signingMode}
                            </span>
                            <span className="text-xs px-2 py-1 bg-secondary-100 text-secondary-700 rounded">
                                {details.signingFlow}
                            </span>
                        </div>
                    </div>
                    */}

                    {/* Other Signers - Temporarily disabled
                    {details.otherSigners && details.otherSigners.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                            <h2 className="text-base sm:text-lg font-semibold text-secondary-900 mb-3 sm:mb-4">
                                {t('document_detail.other_signers', 'Other Signers')}
                            </h2>
                            ...
                        </div>
                    )}
                    */}

                    {/* Actions */}
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                        <h2 className="text-base sm:text-lg font-semibold text-secondary-900 mb-3 sm:mb-4">
                            {t('document_detail.actions', 'Actions')}
                        </h2>

                        <div className="space-y-2 sm:space-y-3">
                            <button
                                onClick={handleStartSigning}
                                disabled={creating || !canSign}
                                className="w-full btn-primary flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
                            >
                                {creating ? (
                                    <>
                                        <LoadingSpinner />
                                        {t('document_detail.creating_session', 'Creating session...')}
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                        {t('document_detail.start_signing', 'Start Signing')}
                                    </>
                                )}
                            </button>
                        </div>

                        {!canSign && (
                            <p className="text-xs sm:text-sm text-secondary-600 mt-3 sm:mt-4 text-center">
                                {details.status === 'SIGNED'
                                    ? t('document_detail.already_signed', 'You have completed your signature')
                                    : t('document_detail.cannot_sign', 'This document cannot be signed at this time')
                                }
                            </p>
                        )}
                    </div>

                    {/* Help Text */}
                    <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm text-blue-800">
                            💡 {t('document_detail.help_text', 'Click "Start Signing" to begin. You will have 30 minutes to complete the signature.')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentDetailPage;
