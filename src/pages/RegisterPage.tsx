import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { showToast } from '../utils/toast';
import { User } from '../types';

const RegisterPage: React.FC = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const mutation = useMutation<User, Error, { email: string; password: string }>({
    mutationFn: (newUser) => api.post('/api/users/register', newUser).then(res => res.data),
    onSuccess: () => {
      showToast.success('Registration successful! Please login.');
      navigate('/login', { state: location.state });
    },
    onError: (error: any) => {
      showToast.error('Registration failed: ' + (error?.response?.data?.message || 'Unknown error'));
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
          <h2 className="text-3xl font-bold text-secondary-900">Create Account</h2>
          <p className="mt-2 text-sm text-secondary-600">Sign up to start signing documents securely</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="label-text">Email address</label>
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
            <label htmlFor="password" className="label-text">Password</label>
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
              {mutation.isPending ? 'Registering...' : 'Create Account'}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-secondary-600">
          Already a member?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
