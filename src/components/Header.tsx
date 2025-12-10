import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, User as UserIcon, LayoutDashboard, Home, Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/login');
  };

  const navLinkClasses = "text-secondary-600 hover:text-primary-600 flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200";
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
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher />
              <Link to="/" className={navLinkClasses}>
                <Home size={18}/>
                <span>{t('header.home')}</span>
              </Link>
              {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" className={navLinkClasses}>
                      <LayoutDashboard size={18} />
                      <span>{t('header.dashboard')}</span>
                    </Link>
                    <div className="flex items-center space-x-2 text-secondary-600 px-3 py-2">
                      <UserIcon size={18}/>
                      <span className="text-sm font-medium">{user?.email}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn-primary flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>{t('header.logout')}</span>
                    </button>
                  </>
              ) : (
                  <>
                    <Link to="/login" className={navLinkClasses}>
                      {t('header.login')}
                    </Link>
                    <Link
                        to="/register"
                        className="btn-primary"
                    >
                      {t('header.register')}
                    </Link>
                  </>
              )}
            </div>
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <LanguageSwitcher />
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
                <Link to="/" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClasses}>{t('header.home')}</Link>
                {isAuthenticated ? (
                    <>
                      <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className={mobileNavLinkClasses}>{t('header.dashboard')}</Link>
                      <div className="text-secondary-600 px-3 py-2 flex items-center space-x-2">
                        <UserIcon size={18}/>
                        <span className="text-sm">{user?.email}</span>
                      </div>
                      <button onClick={handleLogout} className="w-full text-left text-secondary-600 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                        {t('header.logout')}
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