import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText, Calendar, MapPin, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import DocumentContentViewer from '../components/DocumentContentViewer';
import { signingApi } from '../services/signingApi';
import { handleSigningError } from '../utils/errorHandler';
import type { DocumentDetailsV2 } from '../types';

const DocumentDetailPageV2: React.FC = () => {
  const { documentSignerId } = useParams<{ documentSignerId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [details, setDetails] = useState<DocumentDetailsV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (documentSignerId) {
      loadDocumentDetails();
    }
  }, [documentSignerId]);

  const loadDocumentDetails = async () => {
    if (!documentSignerId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await signingApi.getDocumentDetails(documentSignerId);
      setDetails(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load document details');
      console.error('Failed to load document details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSigning = async () => {
    if (!documentSignerId) return;

    setCreating(true);
    try {
      const { sessionId } = await signingApi.createCheckoutSession(documentSignerId);
      // Redirect to signing page with sessionId
      navigate(`/sign/${sessionId}`);
    } catch (err: any) {
      handleSigningError(err, {
        onDocumentLocked: () => {
          alert(
            t(
              'errors.document_locked',
              'This document is currently being signed by another device. Please try again later.'
            )
          );
        },
        onDefault: (message) => {
          alert(message || t('errors.failed_to_start_signing', 'Failed to start signing session'));
        },
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDecline = async () => {
    if (!documentSignerId) return;

    const reason = prompt(t('document_detail.decline_reason', 'Reason for declining (optional):'));
    if (reason === null) return; // User cancelled

    try {
      await signingApi.declineDocument(documentSignerId, reason || undefined);
      alert(t('document_detail.declined_success', 'Document declined successfully'));
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || t('errors.failed_to_decline', 'Failed to decline document'));
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

  const daysRemaining = getDaysRemaining(details.document.deadline);
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

        <h1 className="text-3xl font-bold text-secondary-900">{details.document.title}</h1>
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
              documentUri={details.document.originalFileUrl}
              documentTitle={details.document.title}
              className="h-full w-full"
              signatureZone={details.signatureZone}
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
                    {details.status}
                  </span>
                </div>
              </div>

              {/* Deadline */}
              {details.document.deadline && (
                <div>
                  <label className="text-sm font-medium text-secondary-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('document_detail.deadline', 'Deadline')}
                  </label>
                  <p className="mt-1 text-secondary-900">{formatDate(details.document.deadline)}</p>
                  {daysRemaining !== null && (
                    <p className={`text-sm mt-1 ${isUrgent ? 'text-orange-600 font-medium' : 'text-secondary-600'}`}>
                      ({daysRemaining} {t('document_detail.days_remaining', 'days remaining')})
                    </p>
                  )}
                </div>
              )}

              {/* Signature Location */}
              <div>
                <label className="text-sm font-medium text-secondary-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t('document_detail.signature_location', 'Signature Location')}
                </label>
                <p className="mt-1 text-secondary-900">
                  {t('document_detail.page_number', 'Page {{page}}', { page: details.signatureZone.pageNumber })}
                </p>
                {details.signatureZone.label && (
                  <p className="text-sm text-secondary-600 mt-1">{details.signatureZone.label}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              {t('document_detail.actions', 'Actions')}
            </h2>

            <div className="space-y-3">
              <button
                onClick={handleStartSigning}
                disabled={creating || details.status !== 'PENDING'}
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
                    {t('document_detail.start_signing', 'Start Signing')}
                  </>
                )}
              </button>

              <button
                onClick={handleDecline}
                disabled={details.status !== 'PENDING'}
                className="w-full btn-secondary"
              >
                {t('document_detail.decline', 'Decline Document')}
              </button>
            </div>

            {details.status !== 'PENDING' && (
              <p className="text-sm text-secondary-600 mt-4 text-center">
                {t('document_detail.cannot_sign', 'This document cannot be signed anymore')}
              </p>
            )}
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 {t('document_detail.help_text', 'Click "Start Signing" to begin the signing process. You will have 30 minutes to complete the signature.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailPageV2;
