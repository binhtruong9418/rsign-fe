
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, User as UserIcon, LayoutDashboard, Home } from 'lucide-react';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-dark-card shadow-md">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-brand-primary">
              RSign
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-dark-text-secondary hover:text-brand-primary flex items-center space-x-1">
                <Home size={18}/>
                <span>Home</span>
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-dark-text-secondary hover:text-brand-primary flex items-center space-x-1">
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                </Link>
                <div className="flex items-center space-x-2 text-dark-text-secondary">
                    <UserIcon size={18}/>
                    <span>{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-brand-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-brand-secondary flex items-center space-x-1"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-dark-text-secondary hover:text-brand-primary">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-brand-secondary"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
