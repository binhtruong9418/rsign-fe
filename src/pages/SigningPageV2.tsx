import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import DocumentContentViewer from '../components/DocumentContentViewer';
import SignaturePad, { SignaturePadRef } from '../components/SignaturePad';
import Header from '../components/Header';
import SessionTimer from '../components/SessionTimer';
import { signingApi } from '../services/signingApi';
import { handleSigningError } from '../utils/errorHandler';
import { showToast } from '../utils/toast';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { DEFAULT_SIGNATURE_COLOR, DEFAULT_SIGNATURE_WIDTH } from '../constants/app';
import type { SessionDetailsResponse, Stroke } from '../types';

type View = 'document' | 'sign';

const SigningPageV2: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const signaturePadRef = useRef<SignaturePadRef>(null);

  const [sessionDetails, setSessionDetails] = useState<SessionDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('document');
  const [submitting, setSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
      const apiUrl = 'https://api-beta.rsign.io.vn';
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
        showToast.error(data.reason || t('errors.cannot_sign', 'Cannot sign this document'));
        navigate('/dashboard');
        return;
      }

      setSessionDetails(data);
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

  const handleSubmitSignature = async () => {
    if (!sessionId) return;

    const strokesData = signaturePadRef.current?.getSignature();
    if (!strokesData || strokesData.length === 0) {
      showToast.warning(t('sign_document.provide_signature', 'Please draw your signature first'));
      return;
    }

    setSubmitting(true);

    try {
      // Generate idempotency key
      const idempotencyKey = crypto.randomUUID();

      // strokesData is already in correct Stroke[] format from SignaturePad
      const response = await signingApi.submitSignature(sessionId, {
        signatureData: {
          strokes: strokesData,  // Already has id and points
          color: DEFAULT_SIGNATURE_COLOR,
          width: DEFAULT_SIGNATURE_WIDTH,
        },
        idempotencyKey,
      });

      if (response.success) {
        showToast.success(t('sign_document.success', 'Signature submitted successfully!'));
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
          showToast.error(t('errors.session_expired', 'Session expired. Please create a new session.'));
          navigate('/dashboard');
        },
        onSigningInProgress: () => {
          // Retry after 1 second
          showToast.info(t('errors.signing_in_progress', 'Signing in progress, retrying...'));
          setTimeout(() => handleSubmitSignature(), 1000);
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

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
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

  const { session, document } = sessionDetails;

  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col">
      <Header />
      
      {/* Session Timer - Only show in document view */}
      {view === 'document' && (
        <div className="bg-white border-b border-secondary-200 px-4 py-2">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-sm text-secondary-600">
              {t('signing.session_active', 'Session Active')}
            </span>
            <SessionTimer expiresAt={session.expiresAt} onExpired={handleSessionExpired} />
          </div>
        </div>
      )}

      <div className="flex-grow flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8">
        <div
          className={`w-full bg-white shadow-xl border border-secondary-200 flex flex-col rounded-xl overflow-hidden transition-all duration-300 ${
            view === 'sign'
              ? 'h-[calc(100vh-6rem)] sm:h-[80vh] max-w-4xl'
              : 'h-[calc(100vh-6rem)] sm:h-[85vh] max-w-5xl'
          }`}
        >
          {view === 'document' ? (
            // Document Review View
            <div className="flex flex-col h-full min-h-0 bg-white sm:bg-transparent">
              <div className="flex-shrink-0 px-4 py-3 border-b border-secondary-200 sm:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-2xl font-bold text-secondary-900 truncate" title={document.title}>
                      {t('sign_document.review_prefix', 'Review: ')}{document.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-secondary-500 mt-1">
                      {t('sign_document.review_instruction', 'Please review the document before signing')}
                    </p>
                  </div>
                  <button
                    onClick={handleBack}
                    className="ml-4 text-secondary-600 hover:text-secondary-900"
                  >
                    {t('common.back', 'Back')}
                  </button>
                </div>
              </div>

              <div className="flex-grow min-h-0 p-0 sm:p-4 bg-secondary-50">
                <DocumentContentViewer
                  documentUri={document.originalFileUrl}
                  documentTitle={document.title}
                  className="h-full w-full shadow-sm bg-white"
                  signatureZone={document.signatureZone}
                />
              </div>

              <div className="flex-shrink-0 p-4 sm:pt-4 border-t border-secondary-200 sm:border-t-0 bg-white sm:bg-transparent z-10">
                <button
                  onClick={() => setView('sign')}
                  className="w-full btn-primary text-base sm:text-lg py-3 sm:py-3 shadow-lg sm:shadow-sm"
                >
                  {t('sign_document.proceed_to_sign', 'Proceed to Sign')}
                </button>
              </div>
            </div>
          ) : (
            // Signature View
            <div className="flex flex-col h-full relative bg-secondary-50 sm:bg-white">
              {/* Header / Back Button Area */}
              <div className="absolute top-4 left-4 z-10">
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm text-secondary-600 hover:text-primary-600 pl-2 pr-3 py-2 rounded-full shadow-sm border border-secondary-200 transition-colors"
                  aria-label="Back to document"
                >
                  <ArrowLeft size={20} />
                  <span className="text-sm font-medium">
                    {t('sign_components.signature_view.back', 'Back')}
                  </span>
                </button>
              </div>

              {/* Session Timer in Sign View */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm border border-secondary-200">
                  <SessionTimer expiresAt={session.expiresAt} onExpired={handleSessionExpired} />
                </div>
              </div>

              {/* Signature Area */}
              <div className="flex-grow flex items-center justify-center p-4 sm:p-0 overflow-hidden">
                {/* Mobile: Square & Centered. Desktop: Full size */}
                <div className="w-full aspect-square max-w-[400px] sm:max-w-none sm:w-full sm:h-full sm:aspect-auto bg-white border border-secondary-200 sm:border-0 rounded-2xl sm:rounded-none shadow-sm sm:shadow-none overflow-hidden relative">
                  <SignaturePad
                    ref={signaturePadRef}
                    strokeColor={DEFAULT_SIGNATURE_COLOR}
                    strokeWidth={DEFAULT_SIGNATURE_WIDTH}
                  />
                  {/* Helper text for mobile */}
                  <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none sm:hidden">
                    <span className="text-xs text-secondary-400 bg-white/80 px-2 py-1 rounded-full backdrop-blur-sm">
                      {t('sign_components.signature_view.sign_above', 'Sign above')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Buttons Area */}
              <div className="p-4 bg-white border-t border-secondary-200 sm:border-t-0 flex gap-4 shrink-0 z-20">
                <button onClick={handleClearSignature} className="flex-1 btn-secondary py-3 text-base">
                  {t('sign_components.signature_view.clear', 'Clear')}
                </button>
                <button
                  onClick={handleSubmitSignature}
                  disabled={submitting}
                  className="flex-1 btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg sm:shadow-sm"
                >
                  {submitting
                    ? t('sign_components.signature_view.submitting', 'Submitting...')
                    : t('sign_components.signature_view.sign', 'Sign')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
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
