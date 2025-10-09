
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';

interface LoginResponse {
  token: string;
  user: User;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHustModalOpen, setIsHustModalOpen] = useState(false);
  const [hustEmail, setHustEmail] = useState('');
  const [hustPassword, setHustPassword] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const mutation = useMutation<LoginResponse, Error, { email: string; password: string }>({
    mutationFn: (credentials) => api.post('/api/users/login', credentials).then(res => res.data),
    onSuccess: (data) => {
      login(data.user, data.token);
      const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
      navigate(redirectAfterLogin || '/dashboard');
      sessionStorage.removeItem('redirectAfterLogin');
    },
    onError: (error: any) => {
      alert('Login failed: ' + (error?.response?.data?.message || 'Unknown error'));
    }
  });


  const hustMutation = useMutation<LoginResponse, Error, { email: string; password: string }>({
    mutationFn: (credentials) => api.post('/api/users/login-hust', credentials).then(res => res.data),
    onSuccess: (data) => {
      login(data.user, data.token);
      setIsHustModalOpen(false);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      alert('HUST Login failed: ' + (error.response?.data?.message || error.message));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email, password });
  };


  const handleHustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    hustMutation.mutate({ email: hustEmail, password: hustPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="max-w-md w-full bg-dark-card shadow-lg rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center text-brand-primary mb-8">Login to RSign</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-dark-text-secondary">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password"  className="block text-sm font-medium text-dark-text-secondary">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-card focus:ring-brand-primary disabled:opacity-50"
            >
              {mutation.isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-dark-card text-dark-text-secondary">Or continue with</span>
          </div>
        </div>


        <div className="mt-6">
          <button
            type="button"
            onClick={() => setIsHustModalOpen(true)}
            className="w-full flex justify-center items-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-dark-text-secondary bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-card focus:ring-brand-primary"
          >

            <img src="/image/logo-hust.png" alt="HUST Logo" className="w-4 mr-3" />
            Login with HUST
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-dark-text-secondary">
          Not a member?{' '}
          <Link to='/register' className="font-medium text-brand-primary hover:text-brand-secondary">
            Register here
          </Link>
        </p>
      </div>

      {isHustModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setIsHustModalOpen(false)}>
          <div className="bg-dark-card p-8 rounded-lg shadow-xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center mb-6">
              <img src="/image/logo-hust.png" alt="HUST Logo" className="w-12" />
            </div>
            <h2 className="text-2xl font-bold text-center text-brand-primary mb-6">Login with HUST Account</h2>
            <form onSubmit={handleHustSubmit} className="space-y-6">
              <div>
                <label htmlFor="hust-email" className="block text-sm font-medium text-dark-text-secondary">
                  Email address
                </label>
                <input
                  id="hust-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={hustEmail}
                  onChange={(e) => setHustEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="hust-password" className="block text-sm font-medium text-dark-text-secondary">
                  Password
                </label>
                <input
                  id="hust-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={hustPassword}
                  onChange={(e) => setHustPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={hustMutation.isPending}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-card focus:ring-brand-primary disabled:opacity-50"
                >
                  {hustMutation.isPending ? 'Signing in...' : 'Sign in with HUST'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
