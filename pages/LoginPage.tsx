
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
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const mutation = useMutation<LoginResponse, Error, { email: string; password: string }>({
    mutationFn: (credentials) => api.post('/api/users/login', credentials).then(res => res.data),
    onSuccess: (data) => {
      login(data.user, data.token);
      navigate(location.state?.from || '/');
    },
    onError: (error: any) => {
      alert('Login failed: ' + (error?.response?.data?.message || 'Unknown error'));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email, password });
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
        <p className="mt-6 text-center text-sm text-dark-text-secondary">
          Not a member?{' '}
          <Link to='/register' className="font-medium text-brand-primary hover:text-brand-secondary">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
