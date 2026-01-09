import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, Home, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LocationState {
  documentComplete?: boolean;
  documentTitle?: string;
  totalSignatures?: number;
  documentId?: string;
}

const SigningSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const state = (location.state as LocationState) || {};
  const { documentComplete = false, documentTitle = 'Document', totalSignatures = 1, documentId } = state;
  const signedAt = new Date().toLocaleString();

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            {t('success.title', 'Signature Submitted Successfully!')}
          </h1>

          {/* Document Title */}
          <p className="text-xl text-secondary-700 mb-6">{documentTitle}</p>

          {/* Document Details */}
          <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-5 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-sm text-secondary-500 mb-1">
                  {t('success.signatures_submitted', 'Signatures Submitted')}
                </p>
                <p className="text-lg font-semibold text-secondary-900">
                  {totalSignatures} {totalSignatures === 1 ? t('success.signature', 'signature') : t('success.signatures', 'signatures')}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500 mb-1">
                  {t('success.signed_at', 'Signed At')}
                </p>
                <p className="text-lg font-semibold text-secondary-900">
                  {signedAt}
                </p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {documentComplete ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-lg font-semibold text-green-900">
                  {t('success.all_signatures_collected', '✨ All Signatures Collected!')}
                </h2>
              </div>
              <p className="text-green-800">
                {t(
                  'success.document_complete_message',
                  'The document is now complete and will be processed shortly. You will receive a notification when the final document is ready.'
                )}
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-blue-900">
                  {t('success.waiting_for_others', '⏳ Waiting for Other Signers')}
                </h2>
              </div>
              <p className="text-blue-800">
                {t(
                  'success.waiting_message',
                  "You'll be notified when all required signatures have been collected and the document is fully signed."
                )}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {documentComplete && documentId && (
              <button
                onClick={() => navigate(`/documents/${documentId}/completed`)}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                {t('success.view_document_details', 'View Document Details')}
              </button>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full ${documentComplete && documentId ? 'btn-secondary' : 'btn-primary'} flex items-center justify-center gap-2`}
            >
              <Home className="w-5 h-5" />
              {t('success.back_to_dashboard', 'Back to Dashboard')}
            </button>

            {documentComplete && (
              <button
                onClick={() => navigate('/documents')}
                className="w-full btn-secondary"
              >
                {t('success.view_documents', 'View All Documents')}
              </button>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-secondary-200">
            <p className="text-sm text-secondary-600">
              {t(
                'success.confirmation_email',
                'A confirmation email has been sent to your registered email address.'
              )}
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-secondary-600">
            {t('success.questions', 'Have questions?')}{' '}
            <a href="/support" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('success.contact_support', 'Contact Support')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SigningSuccessPage;
