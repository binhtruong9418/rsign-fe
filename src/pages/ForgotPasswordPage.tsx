import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { showToast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

const ForgotPasswordPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    const mutation = useMutation({
        mutationFn: async (email: string) => {
            const response = await api.post('/api/users/forgot-password', { email });
            return response.data;
        },
        onSuccess: () => {
            showToast.success(
                t('auth.forgot_password.success', 'Reset code sent! Please check your email.')
            );
            // Navigate to reset password page with email
            navigate('/reset-password', {
                state: { email },
            });
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                t('auth.forgot_password.failed', 'Failed to send reset code');
            showToast.error(message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            showToast.error(t('auth.forgot_password.invalid_email', 'Please enter a valid email address'));
            return;
        }
        mutation.mutate(email);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-8 border border-secondary-200">
                {/* Back to Login */}
                <Link
                    to="/login"
                    className="inline-flex items-center space-x-2 text-sm text-secondary-600 hover:text-primary-600 transition-colors mb-6"
                >
                    <ArrowLeft size={16} />
                    <span>{t('auth.forgot_password.back_to_login', 'Back to Login')}</span>
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                        <Mail className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-secondary-900">
                        {t('auth.forgot_password.title', 'Forgot Password?')}
                    </h2>
                    <p className="mt-2 text-sm text-secondary-600">
                        {t(
                            'auth.forgot_password.subtitle',
                            'Enter your email address and we will send you a reset code'
                        )}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="label-text">
                            {t('auth.forgot_password.email_label', 'Email Address')}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-secondary-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field pl-10"
                                placeholder="you@example.com"
                                disabled={mutation.isPending}
                            />
                        </div>
                        <p className="mt-1 text-xs text-secondary-500">
                            {t(
                                'auth.forgot_password.email_hint',
                                'We will send a 6-digit code to this email'
                            )}
                        </p>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {mutation.isPending ? (
                                <span className="flex items-center justify-center space-x-2">
                                    <LoadingSpinner />
                                    <span>{t('auth.forgot_password.sending', 'Sending...')}</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center space-x-2">
                                    <Send size={18} />
                                    <span>{t('auth.forgot_password.submit_button', 'Send Reset Code')}</span>
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-secondary-600">
                        {t('auth.forgot_password.remember_password', 'Remember your password?')}{' '}
                        <Link
                            to="/login"
                            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                        >
                            {t('auth.forgot_password.login_link', 'Login here')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
