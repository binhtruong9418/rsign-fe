import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../components/LoadingSpinner';
import DocumentContentViewer from '../components/DocumentContentViewer';
import SingleSignatureView from '../components/sign/SingleSignatureView';
import Header from '../components/Header';
import SessionTimer from '../components/SessionTimer';
import { signingApi } from '../services/signingApi';
import { handleSigningError } from '../utils/errorHandler';
import { showToast } from '../utils/toast';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { DEFAULT_SIGNATURE_COLOR, DEFAULT_SIGNATURE_WIDTH } from '../constants/app';
import type { SessionDetailsResponse, Stroke, PendingSignature } from '../types';

type View = 'document' | 'sign';

/**
 * Signing Page
 * Supports both single and multiple signature workflows
 */
const SigningPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [sessionDetails, setSessionDetails] = useState<SessionDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('document');
  const [submitting, setSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // For multi-signature workflow
  const [currentSignatureIndex, setCurrentSignatureIndex] = useState(0);
  const [completedSignatures, setCompletedSignatures] = useState<string[]>([]);

  // Use body scroll lock when in sign view
  useBodyScrollLock(view === 'sign');

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
      const apiUrl = import.meta.env.VITE_API_URL;
      navigator.sendBeacon(`${apiUrl}/api/documents/sessions/${sessionId}/cancel`);
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
        showToast.error(data.reason || t('errors.cannot_sign', 'Cannot sign this document'));
        navigate('/dashboard');
        return;
      }

      setSessionDetails(data);
      setCompletedSignatures(data.completedSignatures || []);
    } catch (err: any) {
      handleSigningError(err, {
        onSessionExpired: () => {
          showToast.error(t('errors.session_expired', 'Session expired. Please try again.'));
          navigate('/dashboard');
        },
        onSessionNotFound: () => {
          showToast.error(t('errors.session_not_found', 'Session not found. Please try again.'));
          navigate('/dashboard');
        },
        onDeviceMismatch: () => {
          showToast.error(
            t(
              'errors.device_mismatch',
              'This session was created on a different device. Please create a new session on this device.'
            )
          );
          navigate('/dashboard');
        },
        onDefault: (message) => {
          showToast.error(message);
          navigate('/dashboard');
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSessionExpired = useCallback(() => {
    showToast.error(t('errors.session_expired', 'Session expired. Please create a new session.'));
    navigate('/dashboard');
  }, [navigate, t]);

  const handleSubmitSignature = async (strokesData: Stroke[]) => {
    if (!sessionId || !sessionDetails) return;

    const pendingSigs = sessionDetails.pendingSignatures;
    const currentSig = pendingSigs[currentSignatureIndex];

    if (!currentSig) {
      showToast.error('No signature to submit');
      return;
    }

    setSubmitting(true);

    try {
      // Generate idempotency key
      const idempotencyKey = crypto.randomUUID();

      // Submit signature (API expects signatures array format)
      const response = await signingApi.submitSignature(sessionId, {
        signatures: [{
          documentSignerId: currentSig.documentSignerId,
          signatureData: {
            strokes: strokesData,
            color: DEFAULT_SIGNATURE_COLOR,
            width: DEFAULT_SIGNATURE_WIDTH,
          },
        }],
        idempotencyKey,
      });

      if (response.success) {
        const newCompleted = [...completedSignatures, currentSig.documentSignerId];
        setCompletedSignatures(newCompleted);

        // Check if there are more signatures to sign
        const remainingSignatures = pendingSigs.length - (currentSignatureIndex + 1);

        if (remainingSignatures > 0) {
          // Move to next signature
          showToast.success(
            t('sign_document.signature_saved', 'Signature {{current}} of {{total}} saved!', {
              current: currentSignatureIndex + 1,
              total: pendingSigs.length,
            })
          );
          setCurrentSignatureIndex(prev => prev + 1);
          setView('document'); // Go back to review next signature zone
        } else {
          // All signatures completed
          showToast.success(t('sign_document.all_completed', 'All signatures submitted successfully!'));
          navigate('/signing-success', {
            state: {
              documentComplete: response.documentComplete,
              documentTitle: sessionDetails?.document.title,
              totalSignatures: pendingSigs.length,
            },
          });
        }
      }
    } catch (err: any) {
      handleSigningError(err, {
        onSessionExpired: () => {
          showToast.error(t('errors.session_expired', 'Session expired. Please create a new session.'));
          navigate('/dashboard');
        },
        onSigningInProgress: () => {
          // Retry after 1 second
          showToast.info(t('errors.signing_in_progress', 'Signing in progress, retrying...'));
          setTimeout(() => handleSubmitSignature(strokesData), 1000);
        },
        onTooManyAttempts: () => {
          showToast.error(t('errors.too_many_attempts', 'Too many attempts. Please create a new session.'));
          navigate('/dashboard');
        },
        onDefault: (message) => {
          showToast.error(message || t('errors.failed_to_sign', 'Failed to submit signature'));
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (view === 'sign') {
      setView('document');
    } else {
      setShowCancelConfirm(true);
    }
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

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-secondary-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-center text-red-500">{t('sign_document.missing_session_id', 'Missing session ID')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!sessionDetails) {
    return null;
  }

  const { session, document, pendingSignatures } = sessionDetails;
  const currentSignature = pendingSignatures[currentSignatureIndex];
  const isMultiSignature = pendingSignatures.length > 1;

  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col">
      <Header />

      {/* Session Timer - Only show in document view */}
      {view === 'document' && (
        <div className="bg-white border-b border-secondary-200 px-3 sm:px-4 py-2">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-secondary-600">
                {t('signing.session_active', 'Session Active')}
              </span>
              {isMultiSignature && (
                <span className="text-xs sm:text-sm font-medium text-primary-600">
                  {t('signing.progress', 'Progress')}: {completedSignatures.length} / {pendingSignatures.length}
                </span>
              )}
            </div>
            <SessionTimer expiresAt={session.expiresAt} onExpired={handleSessionExpired} />
          </div>
        </div>
      )}

      <div className="flex-grow flex flex-col items-center justify-start p-2 sm:p-4 lg:p-8">
        <div
          className={`w-full bg-white shadow-xl border border-secondary-200 flex flex-col rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 ${view === 'sign'
            ? 'h-[calc(100vh-6rem)] sm:h-[80vh] max-w-4xl'
            : 'h-[calc(100vh-6rem)] sm:h-[85vh] max-w-5xl'
            }`}
        >
          {view === 'document' ? (
            // Document Review View
            <div className="flex flex-col h-full min-h-0 bg-white sm:bg-transparent">
              <div className="flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-secondary-200 sm:border-0">
                <div className="flex items-start sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-secondary-900 truncate" title={document.title}>
                      <span className="hidden sm:inline">{t('sign_document.review_prefix', 'Review: ')}</span>{document.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-secondary-500 mt-0.5 sm:mt-1">
                      {isMultiSignature
                        ? t('sign_document.multi_review_instruction', 'Signature {{current}} of {{total}} - Review before signing', {
                          current: currentSignatureIndex + 1,
                          total: pendingSignatures.length,
                        })
                        : t('sign_document.review_instruction', 'Please review the document before signing')
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleBack}
                    className="ml-2 sm:ml-4 text-secondary-600 hover:text-secondary-900 text-xs sm:text-sm flex-shrink-0"
                  >
                    {t('common.back', 'Back')}
                  </button>
                </div>
              </div>

              <div className="flex-grow min-h-0 p-0 sm:p-2 lg:p-4 bg-secondary-50">
                <DocumentContentViewer
                  documentUri={document.originalFileUrl}
                  documentTitle={document.title}
                  className="h-full w-full shadow-sm bg-white rounded-none sm:rounded"
                  signatureZone={currentSignature?.signatureZone}
                />
              </div>

              <div className="flex-shrink-0 p-3 sm:p-4 border-t border-secondary-200 sm:border-t-0 bg-white sm:bg-transparent z-10">
                <button
                  onClick={() => setView('sign')}
                  className="w-full btn-primary text-sm sm:text-base lg:text-lg py-2.5 sm:py-3 shadow-lg sm:shadow-sm"
                >
                  {isMultiSignature
                    ? t('sign_document.sign_this_zone', 'Sign Zone {{current}} of {{total}}', {
                      current: currentSignatureIndex + 1,
                      total: pendingSignatures.length,
                    })
                    : t('sign_document.proceed_to_sign', 'Proceed to Sign')
                  }
                </button>
              </div>
            </div>
          ) : (
            // Single Signature View
            <SingleSignatureView
              onBack={handleBack}
              onSubmit={handleSubmitSignature}
              isSubmitting={submitting}
              documentTitle={document.title}
              signatureLabel={currentSignature?.signatureZone.label || `Signature ${currentSignatureIndex + 1}`}
              documentUrl={document.originalFileUrl}
              signatureZone={currentSignature?.signatureZone}
            />
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <h3 className="text-base sm:text-lg font-semibold text-secondary-900 mb-2">
              {t('signing.cancel_confirm_title', 'Cancel Signing?')}
            </h3>
            <p className="text-sm sm:text-base text-secondary-600 mb-4 sm:mb-6">
              {isMultiSignature && completedSignatures.length > 0
                ? t('signing.cancel_confirm_multi_message', 'You have completed {{count}} of {{total}} signatures. Are you sure you want to cancel?', {
                  count: completedSignatures.length,
                  total: pendingSignatures.length,
                })
                : t('signing.cancel_confirm_message', 'Are you sure you want to cancel? Your progress will be lost.')
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 btn-secondary text-sm sm:text-base py-2 sm:py-2.5">
                {t('common.no', 'No, Continue')}
              </button>
              <button onClick={confirmCancel} className="flex-1 btn-primary bg-red-600 hover:bg-red-700 text-sm sm:text-base py-2 sm:py-2.5">
                {t('common.yes', 'Yes, Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SigningPage;
