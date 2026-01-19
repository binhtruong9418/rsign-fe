import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText, Calendar, Users, AlertCircle, PenTool, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import DocumentContentViewer from '../components/DocumentContentViewer';
import { signingApi } from '../services/signingApi';
import { handleSigningError } from '../utils/errorHandler';
import { showToast } from '../utils/toast';
import type { PendingDocumentDetail } from '../types';

/**
 * Pending Document Detail Page
 * For documents that are ready to be signed
 */
const DocumentDetailPage: React.FC = () => {
    const { documentId } = useParams<{ documentId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [details, setDetails] = useState<PendingDocumentDetail | null>(null);
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
            const data = await signingApi.getPendingDocumentDetail(documentId);
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
    const isUrgent = (daysRemaining !== null && daysRemaining <= 3) || document.isOverdue;
    const canSign = details.status.canSignNow;

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
            {/* Header */}
            <div className="mb-3 sm:mb-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-2 sm:mb-4 text-sm sm:text-base"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('common.back', 'Back')}
                </button>

                <h1 className="text-xl sm:text-3xl font-bold text-secondary-900 wrap-break-word">{document.title}</h1>
            </div>

            {/* Urgent Warning */}
            {isUrgent && canSign && (
                <div className="mb-3 sm:mb-6 bg-orange-50 border-l-4 border-orange-500 p-2 sm:p-4 rounded">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0" />
                        <p className="text-sm sm:text-base text-orange-800 font-medium">
                            ⚠️ {t('document_detail.urgent_warning', 'This document expires in {{days}} days', { days: daysRemaining })}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
                {/* Main Content - PDF Viewer */}
                <div className="lg:col-span-2 order-2 lg:order-1">
                    <div className="bg-white rounded-lg shadow-sm p-2 sm:p-6">
                        <h2 className="text-sm sm:text-lg font-semibold text-secondary-900 mb-2 sm:mb-4">
                            {t('document_detail.document_preview', 'Document Preview')}
                        </h2>
                        <DocumentContentViewer
                            documentUri={details.file}
                            documentTitle={document.title}
                            className="h-full w-full"
                        />
                    </div>
                </div>

                {/* Sidebar - Document Info & Actions */}
                <div className="space-y-3 sm:space-y-6 order-1 lg:order-2">
                    {/* Document Information */}
                    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
                        <h2 className="text-sm sm:text-lg font-semibold text-secondary-900 mb-2 sm:mb-4">
                            {t('document_detail.information', 'Document Information')}
                        </h2>

                        <div className="space-y-2 sm:space-y-4">
                            {/* Status */}
                            <div>
                                <label className="text-xs sm:text-sm font-medium text-secondary-600">
                                    {t('document_detail.status', 'Status')}
                                </label>
                                <div className="mt-1">
                                    <span className={`inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${document.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                        document.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                                            'bg-secondary-100 text-secondary-800'
                                        }`}>
                                        {document.status}
                                    </span>
                                </div>
                            </div>

                            {/* Signing Progress */}
                            <div className="bg-secondary-50 p-3 rounded-lg">
                                <label className="text-xs sm:text-sm font-medium text-secondary-900 flex items-center gap-2">
                                    <PenTool className="w-4 h-4" />
                                    {t('document_detail.my_signing_status', 'My Signing Status')}
                                </label>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <span className="text-secondary-600">
                                            {t('document_detail.signatures_required', 'Required')}
                                        </span>
                                        <span className="font-semibold text-primary-600">
                                            {details.status.totalRequired}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <span className="text-secondary-600">
                                            ✓ {t('document_detail.completed', 'Completed')}
                                        </span>
                                        <span className="font-semibold text-green-600">
                                            {details.status.completed}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <span className="text-secondary-600">
                                            ⏳ {t('document_detail.pending', 'Pending')}
                                        </span>
                                        <span className="font-semibold text-orange-600">
                                            {details.status.pending}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Overall Progress */}
                            <div className="bg-secondary-50 p-3 rounded-lg">
                                <label className="text-xs sm:text-sm font-medium text-secondary-900 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    {t('document_detail.overall_progress', 'Overall Progress')}
                                </label>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <span className="text-secondary-600">
                                            {t('document_detail.step', 'Step')}
                                        </span>
                                        <span className="font-semibold text-secondary-900">
                                            {details.progress.current} / {details.progress.total}
                                        </span>
                                    </div>
                                    <div className="w-full bg-secondary-200 rounded-full h-2">
                                        <div
                                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${details.progress.percentage}%` }}
                                        />
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-medium text-primary-600">
                                            {details.progress.percentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>

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
                                    {document.isOverdue && (
                                        <p className="text-xs sm:text-sm mt-1 text-red-600 font-medium">
                                            ⚠️ {t('document_detail.overdue', 'Overdue')}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Document Flow */}
                            <div>
                                <label className="text-xs sm:text-sm font-medium text-secondary-600">
                                    {t('document_detail.signing_flow', 'Signing Flow')}
                                </label>
                                <div className="mt-1">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                                        {document.flow}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current Step Signers (for Sequential flow) */}
                    {document.flow === 'SEQUENTIAL' && details.currentStepSigners.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
                            <h2 className="text-sm sm:text-lg font-semibold text-secondary-900 mb-2 sm:mb-4">
                                {t('document_detail.current_step_signers', 'Current Step Signers')}
                            </h2>
                            <div className="space-y-2 sm:space-y-3">
                                {details.currentStepSigners.map((signer, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2.5 sm:p-3 bg-secondary-50 rounded-lg"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-medium text-secondary-900 truncate">
                                                {signer.user.fullName}
                                            </p>
                                            <p className="text-xs text-secondary-600 truncate">
                                                {signer.user.email}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${signer.status === 'SIGNED' ? 'bg-green-100 text-green-700' :
                                            signer.status === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {signer.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Signature Zones */}
                    {details.zones.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
                            <h2 className="text-sm sm:text-lg font-semibold text-secondary-900 mb-2 sm:mb-4">
                                {t('document_detail.signature_zones', 'Signature Zones')}
                            </h2>
                            <div className="space-y-2">
                                {details.zones.map((zone, index) => (
                                    <div
                                        key={zone.id}
                                        className="flex items-center justify-between p-2.5 bg-secondary-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-secondary-600">
                                                #{index + 1}
                                            </span>
                                            <span className="text-xs text-secondary-900">
                                                {zone.label || `Zone ${index + 1}`}
                                            </span>
                                        </div>
                                        <span className="text-xs text-secondary-600">
                                            {t('document_detail.page', 'Page')} {zone.page}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
                        <h2 className="text-sm sm:text-lg font-semibold text-secondary-900 mb-2 sm:mb-4">
                            {t('document_detail.actions', 'Actions')}
                        </h2>

                        <div className="space-y-2 sm:space-y-3">
                            <button
                                onClick={handleStartSigning}
                                disabled={creating || !canSign}
                                className="w-full btn-primary flex items-center justify-center gap-2 text-sm sm:text-base py-3 sm:py-3"
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
                                {document.status === 'COMPLETED'
                                    ? t('document_detail.already_completed', 'This document has been completed')
                                    : t('document_detail.cannot_sign_now', 'You cannot sign this document right now. Please wait for your turn.')
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
