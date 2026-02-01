import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText, Calendar, Users, Download, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import DocumentContentViewer, { SignatureImage } from '../components/DocumentContentViewer';
import SignaturePreview from '../components/SignaturePreview';
import { signingApi } from '../services/signingApi';
import api from '../services/api';
import { showToast } from '../utils/toast';
import type { CompletedDocumentDetail } from '../types';

/**
 * Completed Document Detail Page
 * Display completed document with signatures, activities, and download option
 */
const CompletedDocumentDetailPage: React.FC = () => {
    const { documentId } = useParams<{ documentId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [details, setDetails] = useState<CompletedDocumentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            const data = await signingApi.getCompletedDocumentDetail(documentId);


            setDetails(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load document details');
            console.error('Failed to load document details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (details?.signedFile) {
            window.open(details.signedFile, '_blank');
            showToast.success(t('completed_detail.download_started', 'Download started'));
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const locale = t('locale', 'en-US');
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !details) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                    <p className="text-red-700 font-medium mb-4">{error || 'Document not found'}</p>
                    <button onClick={() => navigate('/completed')} className="btn-primary">
                        {t('common.back', 'Back')}
                    </button>
                </div>
            </div>
        );
    }

    const { document } = details;
    const isCompleted = document.status === 'COMPLETED';
    const documentUrl = document.displayFileUrl;

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pb-10">
            {/* Header */}
            <div className="mb-3 sm:mb-6">
                <button
                    onClick={() => navigate('/completed')}
                    className="inline-flex items-center text-sm sm:text-base text-secondary-600 hover:text-secondary-900 mb-2 sm:mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    {t('common.back', 'Back')}
                </button>

                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-3xl font-bold text-secondary-900 wrap-break-word">{document.title}</h1>
                        <div className="flex items-center gap-2 mt-2">
                            {isCompleted ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                                    {t('completed_detail.completed', 'Completed')}
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                                    {t('completed_detail.pending', 'Waiting for others')}
                                    <span className="ml-1 opacity-75">
                                        ({details.metadata.completedSigners}/{details.metadata.totalSigners})
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>

                    {isCompleted && details.signedFile && (
                        <button
                            onClick={handleDownload}
                            className="w-full sm:w-auto btn-primary bg-green-600 hover:bg-green-700 inline-flex items-center justify-center gap-2 py-2.5 px-6 shadow-md shadow-green-600/20 active:scale-95 transition-all text-sm sm:text-base font-medium"
                        >
                            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="sm:inline">{t('completed_detail.download', 'Download Signed File')}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Document Preview - Left Column (2/3) */}
                <div className="lg:col-span-2 order-2 lg:order-1">
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden flex flex-col h-[800px]">
                        <div className="px-4 py-3 border-b border-secondary-200 bg-secondary-50 flex justify-between items-center">
                            <h2 className="text-sm font-semibold text-secondary-700">
                                {isCompleted
                                    ? t('completed_detail.document_signed', 'Signed Document')
                                    : t('completed_detail.document_preview', 'Document Preview')
                                }
                            </h2>
                        </div>
                        <div className="flex-grow min-h-0 bg-secondary-100/50">
                            <DocumentContentViewer
                                documentUri={documentUrl}
                                documentTitle={document.title}
                                className="h-full w-full rounded-none border-0"
                                signatureZones={details.signatures
                                    .filter(sig => sig.zone)
                                    .map(sig => ({
                                        pageNumber: sig.zone!.page,
                                        x: sig.zone!.position.x,
                                        y: sig.zone!.position.y,
                                        width: sig.zone!.position.w,
                                        height: sig.zone!.position.h,
                                        // Change label based on status
                                        label: sig.signature ? (isCompleted ? '' : 'Signed') : 'Pending',
                                    }))}
                                
                            />
                        </div>
                    </div>
                </div>

                {/* Info Sidebar - Right Column (1/3) */}
                <div className="space-y-3 sm:space-y-6 order-1 lg:order-2">
                    {/* Document Information */}
                    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
                        <h2 className="text-sm sm:text-lg font-semibold text-secondary-900 mb-2 sm:mb-4">
                            {t('completed_detail.information', 'Document Information')}
                        </h2>

                        <div className="space-y-2 sm:space-y-4">
                            {/* Completed Date */}
                            <div>
                                <label className="text-xs sm:text-sm font-medium text-secondary-600 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    {t('completed_detail.completed_at', 'Completed At')}
                                </label>
                                <p className="mt-1 text-xs sm:text-sm text-secondary-900">{formatDate(document.completedAt)}</p>
                            </div>

                            {/* Total Signers */}
                            <div>
                                <label className="text-xs sm:text-sm font-medium text-secondary-600 flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    {t('completed_detail.total_signers', 'Total Signers')}
                                </label>
                                <p className="mt-1 text-xs sm:text-sm text-secondary-900">
                                    {details.metadata.completedSigners} / {details.metadata.totalSigners}
                                </p>
                            </div>

                            {/* Created By */}
                            <div>
                                <label className="text-xs sm:text-sm font-medium text-secondary-600">
                                    {t('completed_detail.created_by', 'Created By')}
                                </label>
                                <p className="mt-1 text-xs sm:text-sm text-secondary-900">{details.metadata.createdBy.fullName}</p>
                                <p className="text-xs text-secondary-500">{details.metadata.createdBy.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* My Signatures */}
                    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
                        <h2 className="text-sm sm:text-lg font-semibold text-secondary-900 mb-2 sm:mb-4">
                            {t('completed_detail.my_signatures', 'My Signatures')}
                        </h2>

                        <div className="space-y-2 sm:space-y-4">
                            {details.signatures.map((sig) => (
                                <SignatureCard
                                    key={sig.id}
                                    signature={sig}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
                        <h2 className="text-sm sm:text-lg font-semibold text-secondary-900 mb-2 sm:mb-4">
                            {t('completed_detail.activity_timeline', 'Activity Timeline')}
                        </h2>

                        <div className="space-y-2">
                            {details.activities.map((activity, index) => (
                                <div key={index} className="flex gap-3 pb-3 border-b border-secondary-100 last:border-0">
                                    <div className="shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                            {activity.type === 'SIGNATURE_APPLIED' ? (
                                                <CheckCircle className="w-4 h-4 text-primary-600" />
                                            ) : (
                                                <FileText className="w-4 h-4 text-primary-600" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-secondary-900">{activity.description}</p>
                                        <p className="text-xs text-secondary-500 mt-0.5">{formatDate(activity.time)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Signature Card Component
 */
interface SignatureCardProps {
    signature: CompletedDocumentDetail['signatures'][0];
}

const SignatureCard: React.FC<SignatureCardProps> = ({ signature }) => {
    const { t } = useTranslation();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const locale = t('locale', 'en-US');
        const datePart = date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
        const timePart = date.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
        });
        return `${datePart}, ${timePart}`;
    };

    return (
        <div className="border border-secondary-200 rounded-lg p-3">
            {/* Signature Preview with Replay */}
            {signature.signature && (
                <SignaturePreview
                    signature={signature.signature}
                    className="mb-3"
                    showReplayButton={true}
                />
            )}

            {/* Signature Info */}
            <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                    <span className="text-secondary-600">{t('completed_detail.signed_at', 'Signed at')}</span>
                    <span className="text-secondary-900 font-medium">{formatDate(signature.signedAt)}</span>
                </div>

                {signature.zone && (
                    <div className="flex items-center justify-between">
                        <span className="text-secondary-600">{t('completed_detail.page', 'Page')}</span>
                        <span className="text-secondary-900 font-medium">{signature.zone.page}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompletedDocumentDetailPage;
