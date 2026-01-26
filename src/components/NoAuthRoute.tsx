import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface NoAuthRouteProps {
    children: React.ReactNode;
}

/**
 * NoAuthRoute - Route wrapper for authentication pages (login, register, etc.)
 * Redirects to dashboard if user is already authenticated
 */
const NoAuthRoute: React.FC<NoAuthRouteProps> = ({ children }) => {
    const { isAuthenticated } = useAuthStore();

    if (isAuthenticated) {
        // User is already logged in, redirect to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    // User is not logged in, allow access to auth pages
    return <>{children}</>;
};

export default NoAuthRoute;
