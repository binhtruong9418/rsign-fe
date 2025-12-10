import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {useLogin, useHustLogin} from '@/hooks';
import showToast from "@/utils/toast.ts";

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isHustModalOpen, setIsHustModalOpen] = useState(false);
    const [hustEmail, setHustEmail] = useState('');
    const [hustPassword, setHustPassword] = useState('');

    const loginMutation = useLogin();
    const hustMutation = useHustLogin();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate({email, password}, {
            onError: (error: any) => {
                showToast.error('Login failed: ' + (error?.response?.data?.message || 'Unknown error'));
            }
        });
    };

    const handleHustSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        hustMutation.mutate({email: hustEmail, password: hustPassword}, {
            onSuccess: () => {
                setIsHustModalOpen(false);
            },
            onError: (error: any) => {
                showToast.error('HUST Login failed: ' + (error?.response?.data?.message || 'Unknown error'));
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 border border-secondary-200">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-secondary-900">Welcome Back</h2>
                    <p className="mt-2 text-sm text-secondary-600">Please sign in to your account</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="label-text">
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
                            className="input-field"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="label-text">
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
                            className="input-field"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="w-full btn-primary flex justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-secondary-200"/>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-secondary-500">Or continue with</span>
                    </div>
                </div>


                <div className="mt-6">
                    <button
                        type="button"
                        onClick={() => setIsHustModalOpen(true)}
                        className="w-full btn-secondary flex justify-center items-center"
                    >
                        <img src="/image/logo-hust.png" alt="HUST Logo" className="w-5 h-5 mr-3 object-contain"/>
                        Login with HUST
                    </button>
                </div>

                <p className="mt-6 text-center text-sm text-secondary-600">
                    Not a member?{' '}
                    <Link to='/register' className="font-medium text-primary-600 hover:text-primary-500">
                        Register here
                    </Link>
                </p>
            </div>

            {isHustModalOpen && (
                <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                     onClick={() => setIsHustModalOpen(false)}>
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md m-4 border border-secondary-200"
                         onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center mb-6">
                            <img src="/image/logo-hust.png" alt="HUST Logo" className="w-16 h-16 object-contain"/>
                        </div>
                        <h2 className="text-2xl font-bold text-center text-secondary-900 mb-6">Login with HUST Account</h2>
                        <form onSubmit={handleHustSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="hust-email" className="label-text">
                                    Email address
                                </label>
                                <input
                                    id="hust-email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={hustEmail}
                                    onChange={(e) => setHustEmail(e.target.value)}
                                    className="input-field"
                                    placeholder="student@hust.edu.vn"
                                />
                            </div>
                            <div>
                                <label htmlFor="hust-password" className="label-text">
                                    Password
                                </label>
                                <input
                                    id="hust-password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={hustPassword}
                                    onChange={(e) => setHustPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={hustMutation.isPending}
                                    className="w-full btn-primary flex justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
