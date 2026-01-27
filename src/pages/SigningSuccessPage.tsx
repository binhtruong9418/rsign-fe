
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Clock, Home, FileText, ArrowRight } from 'lucide-react';
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

  const state = (location.state as LocationState) || {};
  const { documentComplete = false, documentTitle = 'Document', totalSignatures = 1, documentId } = state;
  const signedAt = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full animate-scale-in">
        <div className="bg-white rounded-2xl shadow-xl border border-secondary-100 p-8 md:p-10 text-center relative overflow-hidden">
          {/* Top Decoration */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-success-400 to-success-600"></div>

          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-success-50 rounded-full mb-8 animate-float">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-secondary-900 mb-2 font-heading">
            Signed Successfully!
          </h1>
          <p className="text-secondary-500 mb-8">
            Your signature has been securely recorded.
          </p>

          {/* Document Info Card */}
          <div className="bg-secondary-50 rounded-xl p-5 mb-8 border border-secondary-200">
            <h3 className="font-semibold text-secondary-900 mb-4 text-lg truncate" title={documentTitle}>
              {documentTitle}
            </h3>

            <div className="grid grid-cols-2 gap-4 text-left text-sm border-t border-secondary-200 pt-4">
              <div>
                <p className="text-secondary-500 mb-1">Signed By You</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-secondary-900">{totalSignatures} signature{totalSignatures !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div>
                <p className="text-secondary-500 mb-1">Time</p>
                <p className="font-medium text-secondary-900">{signedAt}</p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {documentComplete ? (
            <div className="bg-success-50 border border-success-200 rounded-xl p-4 mb-8 text-left flex gap-3 items-start">
              <div className="shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <h4 className="font-semibold text-success-900 text-sm">Document Complete</h4>
                <p className="text-success-800 text-sm mt-1">
                  All parties have signed. The final document is ready for download.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-left flex gap-3 items-start">
              <div className="shrink-0 mt-0.5">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">Waiting for Others</h4>
                <p className="text-blue-800 text-sm mt-1">
                  We'll notify you once all other parties have completed signing.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {documentComplete && documentId ? (
              <>
                <button
                  onClick={() => navigate(`/documents/${documentId}/completed`)}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <FileText className="w-5 h-5" />
                  View Final Document
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Back to Dashboard
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <Home className="w-5 h-5" />
                Back to Dashboard
              </button>
            )}
          </div>

          <p className="mt-8 text-xs text-secondary-400">
            A confirmation has been sent to your email.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SigningSuccessPage;
