import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, User as UserIcon, LayoutDashboard, Home, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/login');
  };

  const navLinkClasses = "text-dark-text-secondary hover:text-brand-primary flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium";
  const mobileNavLinkClasses = "text-dark-text-secondary hover:text-brand-primary block px-3 py-2 rounded-md text-base font-medium";

  return (
      <header className="bg-dark-card shadow-md">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-brand-primary">
                RSign
              </Link>
            </div>
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/" className={navLinkClasses}>
                <Home size={18}/>
                <span>Home</span>
              </Link>
              {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" className={navLinkClasses}>
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </Link>
                    <div className="flex items-center space-x-2 text-dark-text-secondary px-3 py-2">
                      <UserIcon size={18}/>
                      <span>{user?.email}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-brand-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-secondary flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </>
              ) : (
                  <>
                    <Link to="/login" className={navLinkClasses}>
                      Login
                    </Link>
                    <Link
                        to="/register"
                        className="bg-brand-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-secondary"
                    >
                      Register
                    </Link>
                  </>
              )}
            </div>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-dark-text-secondary hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClasses}>Home</Link>
                {isAuthenticated ? (
                    <>
                      <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClasses}>Dashboard</Link>
                      <div className="text-dark-text-secondary px-3 py-2 flex items-center space-x-2">
                        <UserIcon size={18}/>
                        <span>{user?.email}</span>
                      </div>
                      <button onClick={handleLogout} className="w-full text-left text-dark-text-secondary hover:text-brand-primary block px-3 py-2 rounded-md text-base font-medium">
                        Logout
                      </button>
                    </>
                ) : (
                    <>
                      <Link to="/login" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClasses}>Login</Link>
                      <Link to="/register" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClasses}>Register</Link>
                    </>
                )}
              </div>
            </div>
        )}
      </header>
  );
};

export default Header;