import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { showToast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

const ResetPasswordPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from navigation state (from forgot-password page)
    const emailFromState = location.state?.email || '';

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

    // Redirect if no email
    useEffect(() => {
        if (!emailFromState) {
            showToast.error(t('auth.reset_password.no_email', 'Please start from forgot password page'));
            navigate('/forgot-password');
        }
    }, [emailFromState, navigate, t]);

    const mutation = useMutation({
        mutationFn: async (data: { email: string; code: string; newPassword: string }) => {
            const response = await api.post('/api/users/reset-password', data);
            return response.data;
        },
        onSuccess: () => {
            showToast.success(
                t('auth.reset_password.success', 'Password reset successfully! You can now login.')
            );
            navigate('/login');
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                t('auth.reset_password.failed', 'Failed to reset password');
            showToast.error(message);
        },
    });

    const handleCodeChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();

        // Check if pasted data is 6 digits
        if (/^\d{6}$/.test(pastedData)) {
            const newCode = pastedData.split('');
            setCode(newCode);
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const codeString = code.join('');

        // Validate code
        if (codeString.length !== 6) {
            showToast.error(t('auth.reset_password.invalid_code', 'Please enter the 6-digit code'));
            return;
        }

        // Validate passwords
        if (newPassword.length < 6) {
            showToast.error(
                t('auth.reset_password.password_too_short', 'Password must be at least 6 characters')
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast.error(
                t('auth.reset_password.password_mismatch', 'Passwords do not match')
            );
            return;
        }

        mutation.mutate({
            email: emailFromState,
            code: codeString,
            newPassword,
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-8 border border-secondary-200">
                {/* Back to Forgot Password */}
                <Link
                    to="/forgot-password"
                    className="inline-flex items-center space-x-2 text-sm text-secondary-600 hover:text-primary-600 transition-colors mb-6"
                >
                    <ArrowLeft size={16} />
                    <span>{t('auth.reset_password.back', 'Back')}</span>
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-secondary-900">
                        {t('auth.reset_password.title', 'Reset Password')}
                    </h2>
                    <p className="mt-2 text-sm text-secondary-600">
                        {t('auth.reset_password.subtitle', 'Enter the code sent to your email and set a new password')}
                    </p>
                    {emailFromState && (
                        <p className="mt-1 text-xs text-primary-600 font-medium">
                            {emailFromState}
                        </p>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 6-digit OTP Input */}
                    <div>
                        <label className="label-text mb-3 block">
                            {t('auth.reset_password.code_label', 'Verification Code')}
                        </label>
                        <div className="flex justify-between gap-2">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    className="w-12 h-12 sm:w-14 sm:h-14 text-center text-lg font-bold border-2 border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    disabled={mutation.isPending}
                                    required
                                />
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-secondary-500">
                            {t('auth.reset_password.code_hint', 'Enter the 6-digit code from your email')}
                        </p>
                    </div>

                    {/* New Password */}
                    <div>
                        <label htmlFor="newPassword" className="label-text">
                            {t('auth.reset_password.new_password_label', 'New Password')}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-secondary-400" />
                            </div>
                            <input
                                id="newPassword"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="input-field pl-10 pr-10"
                                placeholder="••••••••"
                                disabled={mutation.isPending}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-secondary-500">
                            {t('auth.reset_password.password_requirement', 'Must be at least 6 characters')}
                        </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="label-text">
                            {t('auth.reset_password.confirm_password_label', 'Confirm New Password')}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-secondary-400" />
                            </div>
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="input-field pl-10 pr-10"
                                placeholder="••••••••"
                                disabled={mutation.isPending}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
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
                                    <span>{t('auth.reset_password.resetting', 'Resetting...')}</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center space-x-2">
                                    <CheckCircle2 size={18} />
                                    <span>{t('auth.reset_password.submit_button', 'Reset Password')}</span>
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-secondary-600">
                        {t('auth.reset_password.no_code', "Didn't receive the code?")}{' '}
                        <Link
                            to="/forgot-password"
                            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                        >
                            {t('auth.reset_password.resend_link', 'Resend code')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
