import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, User as UserIcon, Menu, X, ChevronDown, FileText, CheckCircle, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActiveRoute = (path: string) => location.pathname === path;

  const navLinkClasses = (path: string) =>
    `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActiveRoute(path)
      ? 'text-primary-600 bg-primary-50'
      : 'text-secondary-600 hover:text-primary-600 hover:bg-secondary-50'
    }`;
  const mobileNavLinkClasses = "text-secondary-600 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200";

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary-600 flex items-center gap-2">
              <span className="bg-primary-50 p-1 rounded">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </span>
              RSign
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                {/* Navigation Links */}
                <Link to="/dashboard" className={navLinkClasses('/dashboard')}>
                  <FileText size={18} />
                  <span>{t('header.pending_documents', 'Pending')}</span>
                </Link>

                <Link to="/completed" className={navLinkClasses('/completed')}>
                  <CheckCircle size={18} />
                  <span>{t('header.completed_documents', 'Completed')}</span>
                </Link>

                {/* Profile Dropdown */}
                <div className="relative ml-2" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-secondary-50 transition-colors duration-200 border border-transparent hover:border-secondary-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                      <UserIcon size={18} />
                    </div>
                    <span className="text-sm font-medium text-secondary-700 max-w-[150px] truncate">{user?.fullName || user?.email}</span>
                    <ChevronDown size={16} className={`text-secondary-400 transition-transform duration-200 ${isProfileOpen ? 'transform rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-secondary-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-3 border-b border-secondary-100 mb-1">
                        <p className="text-xs text-secondary-500 uppercase font-semibold tracking-wider">Account</p>
                        <p className="text-sm font-medium text-secondary-900 truncate">{user?.email}</p>
                        {user?.fullName && (
                          <p className="text-xs text-secondary-600 mt-0.5 truncate">{user.fullName}</p>
                        )}
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings size={18} />
                        <span>{t('header.profile', 'Profile Settings')}</span>
                      </Link>

                      <div className="border-t border-secondary-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={18} />
                        <span>{t('header.logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className={navLinkClasses('/login')}>
                  {t('header.login')}
                </Link>
                <Link
                  to="/register"
                  className="btn-primary ml-2"
                >
                  {t('header.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-secondary-500 hover:text-primary-600 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-secondary-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-3 border-b border-secondary-100 mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                      <UserIcon size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-secondary-900 truncate">{user?.fullName || user?.email}</p>
                      <p className="text-xs text-secondary-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClasses}>
                  <div className="flex items-center space-x-2">
                    <FileText size={18} />
                    <span>{t('header.pending_documents', 'Pending Documents')}</span>
                  </div>
                </Link>

                <Link to="/completed" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClasses}>
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={18} />
                    <span>{t('header.completed_documents', 'Completed Documents')}</span>
                  </div>
                </Link>

                <Link to="/profile" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClasses}>
                  <div className="flex items-center space-x-2">
                    <Settings size={18} />
                    <span>{t('header.profile', 'Profile Settings')}</span>
                  </div>
                </Link>

                <div className="border-t border-secondary-100 my-2"></div>

                <button onClick={handleLogout} className="w-full text-left text-red-600 hover:bg-red-50 block px-3 py-2 rounded-md text-base font-medium transition-colors">
                  <div className="flex items-center space-x-2">
                    <LogOut size={18} />
                    <span>{t('header.logout')}</span>
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClasses}>{t('header.login')}</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClasses}>{t('header.register')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;