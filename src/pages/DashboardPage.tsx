
import React, { useState } from 'react';
import { useMyDocuments } from '../hooks/useDocumentQueries';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusCircle } from 'lucide-react';
import DocumentGrid from '../components/dashboard/DocumentGrid';
import EmptyDocumentsView from '../components/dashboard/EmptyDocumentsView';
import CreateDocumentModal from '../components/dashboard/CreateDocumentModal';

const DashboardPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: documents, isLoading, error } = useMyDocuments();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-dark-text">My Documents</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-secondary flex items-center space-x-2 transition-colors"
        >
          <PlusCircle size={20} />
          <span>New Document</span>
        </button>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <p className="text-red-500">Error: {error.message}</p>}

      {documents && documents.length === 0 && (
        <EmptyDocumentsView onCreateDocument={() => setIsModalOpen(true)} />
      )}

      {documents && documents.length > 0 && (
        <DocumentGrid documents={documents} />
      )}

      <CreateDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
