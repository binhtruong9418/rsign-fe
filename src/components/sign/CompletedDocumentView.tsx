import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CompletedDocumentView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('sign_components.completed_view.title')}</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {t('sign_components.completed_view.message')}
      </p>
      <Link to="/" className="btn-primary inline-flex items-center">
        {t('sign_components.completed_view.home_button')}
      </Link>
    </div>
  );
};

export default CompletedDocumentView;