import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText, Calendar, Users, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import DocumentContentViewer from '../components/DocumentContentViewer';
import { signingApi } from '../services/signingApi';
import { handleSigningError } from '../utils/errorHandler';
import { showToast } from '../utils/toast';
import type { MultiDocumentDetailsResponse } from '../types';

const MultiDocumentDetailPage: React.FC = () => {
    const { documentId } = useParams<{ documentId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [details, setDetails] = useState<MultiDocumentDetailsResponse | null>(null);
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

            const data = await signingApi.getMultiDocumentDetails(documentId);
            setDetails(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load document details');
            console.error('Failed to load document details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartMultiSigning = async () => {
        if (!documentId) return;

        setCreating(true);
        try {
            const { sessionId } = await signingApi.createMultiCheckoutSession(documentId);
            // Redirect to multi-signing page with sessionId
            navigate(`/multi-sign/${sessionId}`);
        } catch (err: any) {
            handleSigningError(err, {
                onDocumentLocked: () => {
                    showToast.error(
                        t(
                            'errors.document_locked',
                            'This document is currently being signed by another device. Please try again later.'
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

    const { document: docInfo, signatureZones } = details;
    const daysRemaining = getDaysRemaining(docInfo.deadline);
    const isUrgent = daysRemaining !== null && daysRemaining <= 3;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('common.back', 'Back')}
                </button>

                <h1 className="text-3xl font-bold text-secondary-900">{docInfo.title}</h1>
            </div>

            {/* Urgent Warning */}
            {isUrgent && (
                <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        <p className="text-orange-800 font-medium">
                            ⚠️ {t('document_detail.urgent_warning', 'This document expires in {{days}} days', { days: daysRemaining })}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - PDF Viewer */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                            {t('document_detail.document_preview', 'Document Preview')}
                        </h2>
                        <DocumentContentViewer
                            documentUri={docInfo.originalFileUrl}
                            documentTitle={docInfo.title}
                            className="h-full w-full"
                            signatureZones={signatureZones.map((sz) => sz.signatureZone)}
                        />
                    </div>
                </div>

                {/* Sidebar - Document Info & Actions */}
                <div className="space-y-6">
                    {/* Document Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                            {t('document_detail.information', 'Document Information')}
                        </h2>

                        <div className="space-y-4">
                            {/* Status */}
                            <div>
                                <label className="text-sm font-medium text-secondary-600">
                                    {t('document_detail.status', 'Status')}
                                </label>
                                <div className="mt-1">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        {docInfo.status}
                                    </span>
                                </div>
                            </div>

                            {/* Signature Zones Count */}
                            <div>
                                <label className="text-sm font-medium text-secondary-600 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    {t('signing.signature_zones', 'Signature Zones')}
                                </label>
                                <p className="mt-1 text-secondary-900 font-semibold text-lg">
                                    {signatureZones.length} {t('signing.zones_required', 'zones required')}
                                </p>
                            </div>

                            {/* Deadline */}
                            {docInfo.deadline && (
                                <div>
                                    <label className="text-sm font-medium text-secondary-600 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {t('document_detail.deadline', 'Deadline')}
                                    </label>
                                    <p className="mt-1 text-secondary-900">{formatDate(docInfo.deadline)}</p>
                                    {daysRemaining !== null && (
                                        <p className={`text-sm mt-1 ${isUrgent ? 'text-orange-600 font-medium' : 'text-secondary-600'}`}>
                                            ({daysRemaining} {t('document_detail.days_remaining', 'days remaining')})
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Created By */}
                            {docInfo.createdBy && (
                                <div>
                                    <label className="text-sm font-medium text-secondary-600">
                                        {t('document_detail.created_by', 'Created by')}
                                    </label>
                                    <p className="mt-1 text-secondary-900">
                                        {typeof docInfo.createdBy === 'string'
                                            ? docInfo.createdBy
                                            : docInfo.createdBy.fullName || docInfo.createdBy.email
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Signature Zones List */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                            {t('signing.zones_to_sign', 'Zones to Sign')}
                        </h2>
                        <div className="space-y-2">
                            {signatureZones.map((zone, index) => (
                                <div
                                    key={zone.documentSignerId}
                                    className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg"
                                >
                                    <div className="flex-shrink-0 w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-secondary-900 truncate">
                                            {zone.signatureZone.label || `${t('signing.signature', 'Signature')} ${index + 1}`}
                                        </p>
                                        <p className="text-xs text-secondary-600">
                                            {t('signing.page', 'Page')} {zone.signatureZone.pageNumber}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                            {t('document_detail.actions', 'Actions')}
                        </h2>

                        <div className="space-y-3">
                            <button
                                onClick={handleStartMultiSigning}
                                disabled={creating || !details.canUseMultiSign}
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                {creating ? (
                                    <>
                                        <LoadingSpinner />
                                        {t('document_detail.creating_session', 'Creating session...')}
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-5 h-5" />
                                        {t('signing.start_multi_signing', `Sign All (${signatureZones.length})`)}
                                    </>
                                )}
                            </button>
                        </div>

                        {!details.canUseMultiSign && (
                            <p className="text-sm text-secondary-600 mt-4 text-center">
                                {t('document_detail.cannot_sign', 'This document cannot be signed anymore')}
                            </p>
                        )}
                    </div>

                    {/* Help Text */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            💡 {t('signing.multi_help_text', `You will sign all ${signatureZones.length} signature zones in a single session. You have 30 minutes to complete.`)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiDocumentDetailPage;
