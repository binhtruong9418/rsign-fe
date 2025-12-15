import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import DocumentContentViewer from '../components/DocumentContentViewer';
import SessionTimer from '../components/SessionTimer';
import { signingApi } from '../services/signingApi';
import { handleSigningError } from '../utils/errorHandler';
import type { SessionDetailsResponse, SignatureDataV2, Stroke } from '../types';

const SigningPageV2: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [sessionDetails, setSessionDetails] = useState<SessionDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signatureData, setSignatureData] = useState<SignatureDataV2 | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Load session on mount
  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  // Cancel session on beforeunload
  useEffect(() => {
    if (!sessionId) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';

      // Best-effort cancel using Beacon API
      const apiUrl = 'https://api.rsign.io.vn';
      navigator.sendBeacon(`${apiUrl}/documents/sessions/${sessionId}/cancel`);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId]);

  const loadSession = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const data = await signingApi.getSession(sessionId);

      if (!data.canSign) {
        alert(data.reason || t('errors.cannot_sign', 'Cannot sign this document'));
        navigate('/dashboard');
        return;
      }

      setSessionDetails(data);
    } catch (err: any) {
      handleSigningError(err, {
        onSessionExpired: () => {
          alert(t('errors.session_expired', 'Session expired. Please try again.'));
          navigate('/dashboard');
        },
        onSessionNotFound: () => {
          alert(t('errors.session_not_found', 'Session not found. Please try again.'));
          navigate('/dashboard');
        },
        onDeviceMismatch: () => {
          alert(
            t(
              'errors.device_mismatch',
              'This session was created on a different device. Please create a new session on this device.'
            )
          );
          navigate('/dashboard');
        },
        onDefault: (message) => {
          alert(message);
          navigate('/dashboard');
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSessionExpired = useCallback(() => {
    alert(t('errors.session_expired', 'Session expired. Please create a new session.'));
    navigate('/dashboard');
  }, [navigate, t]);

  const handleSign = async () => {
    if (!sessionId || !signatureData) {
      alert(t('errors.no_signature', 'Please draw your signature first'));
      return;
    }

    setSubmitting(true);

    try {
      // Generate idempotency key
      const idempotencyKey = crypto.randomUUID();

      const response = await signingApi.submitSignature(sessionId, {
        signatureData,
        idempotencyKey,
      });

      if (response.success) {
        navigate('/signing-success', {
          state: {
            documentComplete: response.documentComplete,
            documentTitle: sessionDetails?.document.title,
          },
        });
      }
    } catch (err: any) {
      handleSigningError(err, {
        onSessionExpired: () => {
          alert(t('errors.session_expired', 'Session expired. Please create a new session.'));
          navigate('/dashboard');
        },
        onSigningInProgress: () => {
          // Retry after 1 second
          setTimeout(() => handleSign(), 1000);
        },
        onTooManyAttempts: () => {
          alert(t('errors.too_many_attempts', 'Too many attempts. Please create a new session.'));
          navigate('/dashboard');
        },
        onDefault: (message) => {
          alert(message || t('errors.failed_to_sign', 'Failed to submit signature'));
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = async () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = async () => {
    if (!sessionId) return;

    try {
      await signingApi.cancelSession(sessionId);
    } catch (err) {
      console.error('Failed to cancel session:', err);
    } finally {
      navigate('/dashboard');
    }
  };

  const handleSignatureChange = (strokes: Stroke[]) => {
    if (strokes.length > 0) {
      setSignatureData({
        strokes,
        color: '#000000',
        width: 2,
      });
    } else {
      setSignatureData(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!sessionDetails) {
    return null;
  }

  const { session, document } = sessionDetails;

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('common.back', 'Back')}
              </button>
              <h1 className="text-xl font-semibold text-secondary-900">{document.title}</h1>
            </div>

            <SessionTimer expiresAt={session.expiresAt} onExpired={handleSessionExpired} />
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-medium">
              ⚠️ {t('signing.warning', 'Do not close this tab or navigate away during signing')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PDF Viewer */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              {t('signing.document', 'Document')}
            </h2>
            <DocumentContentViewer
              documentUri={document.originalFileUrl}
              documentTitle={document.title}
            />
          </div>

          {/* Signature Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              {t('signing.your_signature', 'Your Signature')}
            </h2>

            {/* Signature Canvas Placeholder */}
            <div className="border-2 border-dashed border-secondary-300 rounded-lg p-8 mb-6 bg-secondary-50">
              <p className="text-center text-secondary-600">
                {t('signing.draw_signature', 'Draw your signature here')}
              </p>
              {/* TODO: Integrate actual signature canvas component */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => handleSignatureChange([{ id: 'test', points: [{ x: 0, y: 0, timestamp: Date.now() }] }])}
                  className="btn-secondary text-sm"
                >
                  {t('signing.test_signature', 'Test Signature (Dev)')}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => setSignatureData(null)}
                disabled={!signatureData}
                className="w-full btn-secondary"
              >
                {t('signing.clear', 'Clear')}
              </button>

              <button
                onClick={handleSign}
                disabled={!signatureData || submitting}
                className="w-full btn-primary"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner />
                    {t('signing.submitting', 'Submitting...')}
                  </div>
                ) : (
                  t('signing.sign_document', 'Sign Document')
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 {t('signing.help', 'Draw your signature in the box above, then click "Sign Document" to complete the signing process.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              {t('signing.cancel_confirm_title', 'Cancel Signing?')}
            </h3>
            <p className="text-secondary-600 mb-6">
              {t('signing.cancel_confirm_message', 'Are you sure you want to cancel? Your progress will be lost.')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 btn-secondary">
                {t('common.no', 'No, Continue')}
              </button>
              <button onClick={confirmCancel} className="flex-1 btn-primary bg-red-600 hover:bg-red-700">
                {t('common.yes', 'Yes, Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SigningPageV2;
