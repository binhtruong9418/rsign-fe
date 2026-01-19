import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { showToast } from '../utils/toast';
import { User } from '../types';
import { useTranslation } from 'react-i18next';

const RegisterPage: React.FC = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const mutation = useMutation<User, Error, { email: string; password: string }>({
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
    mutation.mutate({ email, password });
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
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
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

