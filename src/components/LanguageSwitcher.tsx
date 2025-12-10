import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-2 px-3 py-2">
      <Globe size={18} className="text-secondary-600" />
      <button
        onClick={() => changeLanguage('vi')}
        className={`text-sm font-medium transition-colors ${
          i18n.language === 'vi' ? 'text-primary-600 font-bold' : 'text-secondary-600 hover:text-primary-600'
        }`}
      >
        VN
      </button>
      <span className="text-secondary-400">|</span>
      <button
        onClick={() => changeLanguage('en')}
        className={`text-sm font-medium transition-colors ${
          i18n.language === 'en' ? 'text-primary-600 font-bold' : 'text-secondary-600 hover:text-primary-600'
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
