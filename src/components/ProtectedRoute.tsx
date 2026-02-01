import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { STORAGE_KEYS } from '../constants/app';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    const redirectPath = location.pathname + location.search;
    sessionStorage.setItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN, redirectPath);
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
