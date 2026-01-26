import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { showToast } from '../utils/toast';
import { User } from '../types';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';

const RegisterPage: React.FC = () => {
  const location = useLocation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();

  const mutation = useMutation<User, Error, { fullName: string; email: string; password: string }>({
    mutationFn: (newUser) => api.post('/api/users/register', newUser).then(res => res.data),
    onSuccess: () => {
      showToast.success(t('auth.register.success'));
      // Redirect to verify-email page with email pre-filled
      navigate('/verify-email', {
        state: {
          email,
          message: t('auth.register.verify_email_message'),
        },
      });
    },
    onError: (error: any) => {
      showToast.error(t('auth.register.failed', { message: error?.response?.data?.message || 'Unknown error' }));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      showToast.error(t('auth.register.password_mismatch', 'Passwords do not match'));
      return;
    }

    // Validate password length
    if (password.length < 6) {
      showToast.error(t('auth.register.password_too_short', 'Password must be at least 6 characters'));
      return;
    }

    mutation.mutate({ fullName, email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-8 border border-secondary-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-secondary-900">{t('auth.register.title')}</h2>
          <p className="mt-2 text-sm text-secondary-600">{t('auth.register.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="label-text">{t('auth.register.full_name_label', 'Full Name')}</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              placeholder={t('auth.register.full_name_placeholder', 'Enter your full name')}
            />
          </div>
          <div>
            <label htmlFor="email" className="label-text">{t('auth.register.email_label')}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="label-text">{t('auth.register.password_label')}</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-secondary-500">
              {t('auth.register.password_hint', 'Must be at least 6 characters')}
            </p>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="label-text">{t('auth.register.confirm_password_label', 'Confirm Password')}</label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field pr-10"
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
          <div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? t('auth.register.submitting') : t('auth.register.submit_button')}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-secondary-600">
          {t('auth.register.already_member')}{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            {t('auth.register.login_link')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

