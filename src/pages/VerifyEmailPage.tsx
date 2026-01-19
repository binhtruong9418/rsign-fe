import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import { authService } from '../services/auth/authService';
import { showToast } from '../utils/toast';

interface LocationState {
  email?: string;
  message?: string;
}

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const state = (location.state as LocationState) || {};
  const initialEmail = state.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Verify email mutation
  const verifyMutation = useMutation({
    mutationFn: (data: { email: string; code: string }) => authService.verifyEmail(data),
    onSuccess: () => {
      showToast.success(t('auth.verify_email.success'));
      navigate('/login', {
        state: {
          message: t('auth.verify_email.success'),
          email,
        },
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || '';
      if (message.includes('Invalid')) {
        showToast.error(t('auth.verify_email.invalid_code'));
      } else if (message.includes('expired')) {
        showToast.error(t('auth.verify_email.expired_code'));
      } else {
        showToast.error(t('auth.verify_email.failed', { message }));
      }
    },
  });

  // Resend verification code mutation
  const resendMutation = useMutation({
    mutationFn: (email: string) => authService.resendVerification(email),
    onSuccess: () => {
      setResendCooldown(60);
      showToast.success(t('auth.verify_email.resend_success'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || '';
      if (message.includes('already verified')) {
        showToast.error(t('auth.verify_email.already_verified'));
        navigate('/login', { state: { email } });
      } else {
        showToast.error(t('auth.verify_email.resend_failed'));
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    verifyMutation.mutate({ email, code });
  };

  const handleResend = () => {
    if (resendCooldown > 0 || !email) return;
    resendMutation.mutate(email);
  };

  const handleCodeChange = (value: string) => {
    // Only allow digits, max 6 characters
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    setCode(sanitized);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-8 border border-secondary-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-secondary-900">{t('auth.verify_email.title')}</h2>
          <p className="mt-2 text-sm text-secondary-600">
            {t('auth.verify_email.subtitle')}
          </p>
        </div>

        {/* Success message from registration */}
        {state.message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">{state.message}</span>
            </div>
          </div>
        )}

        {/* Email display */}
        {email && (
          <div className="mb-6 p-3 bg-secondary-50 rounded-lg text-center">
            <p className="text-sm text-secondary-600">{t('auth.verify_email.sent_to')}</p>
            <p className="font-semibold text-secondary-900">{email}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email input (if not provided) */}
          {!initialEmail && (
            <div>
              <label htmlFor="email" className="label-text">
                {t('auth.verify_email.email_label')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>
          )}

          {/* 6-digit code input */}
          <div>
            <label htmlFor="code" className="label-text">
              {t('auth.verify_email.code_label')}
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="input-field text-center text-2xl font-mono tracking-[0.5em] placeholder:tracking-normal placeholder:text-base"
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
            />
            <p className="mt-1 text-xs text-secondary-500 text-center">
              {t('auth.verify_email.code_hint')}
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={verifyMutation.isPending || code.length !== 6}
            className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifyMutation.isPending ? t('auth.verify_email.verifying') : t('auth.verify_email.submit_button')}
          </button>
        </form>

        {/* Resend section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-secondary-600 mb-2">{t('auth.verify_email.no_code')}</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendMutation.isPending || !email}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
            {resendCooldown > 0
              ? t('auth.verify_email.resend_cooldown', { seconds: resendCooldown })
              : t('auth.verify_email.resend_button')}
          </button>
        </div>

        {/* Back to login link */}
        <div className="mt-6 pt-6 border-t border-secondary-200">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-sm text-secondary-600 hover:text-secondary-900"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.verify_email.back_to_login')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
