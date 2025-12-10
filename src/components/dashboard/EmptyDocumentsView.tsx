import React from 'react';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptyDocumentsViewProps {
    onCreateDocument: () => void;
}

const EmptyDocumentsView: React.FC<EmptyDocumentsViewProps> = ({ onCreateDocument }) => {
    const { t } = useTranslation();
    return (
        <div className="text-center py-16 bg-dark-card rounded-lg">
            <FileText size={48} className="mx-auto text-dark-text-secondary" />
            <h3 className="mt-2 text-xl font-medium text-dark-text">{t('dashboard.empty_state.title')}</h3>
            <p className="mt-1 text-sm text-dark-text-secondary">{t('dashboard.empty_state.description')}</p>
        </div>
    );
};

export default EmptyDocumentsView;