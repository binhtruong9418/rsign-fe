import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Mail, Save, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { showToast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const ProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

    // Password change state
    const [passwordData, setPasswordData] = useState<ChangePasswordData>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
            const response = await api.post('/api/users/change-password', data);
            return response.data;
        },
        onSuccess: () => {
            showToast.success(t('profile.password.success', 'Password changed successfully'));
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || t('profile.password.error', 'Failed to change password');
            showToast.error(message);
        },
    });

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast.error(t('profile.password.mismatch', 'New passwords do not match'));
            return;
        }

        if (passwordData.newPassword.length < 6) {
            showToast.error(t('profile.password.too_short', 'Password must be at least 6 characters'));
            return;
        }

        changePasswordMutation.mutate({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
        });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-secondary-900">
                    {t('profile.title', 'Profile Settings')}
                </h1>
                <p className="text-secondary-600 mt-2">
                    {t('profile.subtitle', 'Manage your account settings and password')}
                </p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                <div className="flex border-b border-secondary-200">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'profile'
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                                : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                            }`}
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <User size={18} />
                            <span>{t('profile.tabs.profile', 'Profile Information')}</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'password'
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                                : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                            }`}
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <Lock size={18} />
                            <span>{t('profile.tabs.password', 'Change Password')}</span>
                        </div>
                    </button>
                </div>

                <div className="p-6 sm:p-8">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div>
                                <label className="label-text">
                                    {t('profile.email', 'Email Address')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-secondary-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="input-field pl-10 bg-secondary-50 cursor-not-allowed"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-secondary-500">
                                    {t('profile.email_note', 'Email cannot be changed')}
                                </p>
                            </div>

                            <div>
                                <label className="label-text">
                                    {t('profile.full_name', 'Full Name')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-secondary-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={user?.fullName || t('profile.not_provided', 'Not provided')}
                                        disabled
                                        className="input-field pl-10 bg-secondary-50 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-secondary-200">
                                <h3 className="text-sm font-medium text-secondary-700 mb-2">
                                    {t('profile.account_info', 'Account Information')}
                                </h3>
                                <div className="bg-secondary-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary-600">{t('profile.user_id', 'User ID')}:</span>
                                        <span className="font-medium text-secondary-900">{user?.id}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary-600">{t('profile.account_type', 'Account Type')}:</span>
                                        <span className="font-medium text-secondary-900">{t('profile.standard', 'Standard')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Password Tab */}
                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            <div>
                                <label htmlFor="currentPassword" className="label-text">
                                    {t('profile.password.current', 'Current Password')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-secondary-400" />
                                    </div>
                                    <input
                                        id="currentPassword"
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={passwordData.currentPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                        }
                                        required
                                        className="input-field pl-10 pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                                    >
                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="newPassword" className="label-text">
                                    {t('profile.password.new', 'New Password')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-secondary-400" />
                                    </div>
                                    <input
                                        id="newPassword"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordData.newPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                                        }
                                        required
                                        minLength={6}
                                        className="input-field pl-10 pr-10"
                                        placeholder="••••••••"
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
                                    {t('profile.password.requirement', 'Must be at least 6 characters')}
                                </p>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="label-text">
                                    {t('profile.password.confirm', 'Confirm New Password')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-secondary-400" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                        }
                                        required
                                        className="input-field pl-10 pr-10"
                                        placeholder="••••••••"
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

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={changePasswordMutation.isPending}
                                    className="btn-primary w-full sm:w-auto px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {changePasswordMutation.isPending ? (
                                        <span className="flex items-center justify-center space-x-2">
                                            <LoadingSpinner />
                                            <span>{t('profile.password.changing', 'Changing...')}</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center space-x-2">
                                            <Save size={18} />
                                            <span>{t('profile.password.change_button', 'Change Password')}</span>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
