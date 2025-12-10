import React, { useState } from 'react';
import { useMyDocuments } from '@/hooks';
import useDebounce from '../hooks/useDebounce';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { PlusCircle } from 'lucide-react';
import DocumentGrid from '../components/dashboard/DocumentGrid';
import EmptyDocumentsView from '../components/dashboard/EmptyDocumentsView';
import CreateDocumentModal from '../components/dashboard/CreateDocumentModal';
import StatusFilter from '../components/dashboard/StatusFilter';
import SearchInput from '../components/dashboard/SearchInput';
import { DocumentStatus } from '../types';
import { useTranslation } from 'react-i18next';

const DashboardPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 10;
  const { t } = useTranslation();

  // Use the custom useDebounce hook
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data: documentsResponse, isLoading, error } = useMyDocuments({
    page: currentPage,
    limit: pageSize,
    status: statusFilter,
    search: debouncedSearchQuery,
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusChange = (status: DocumentStatus | 'ALL') => {
    setStatusFilter(status);
    setCurrentPage(0); // Reset to first page when changing filter
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(0); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(0);
  };

  const documents = documentsResponse?.data || [];
  const totalPages = documentsResponse?.totalPages || 0;
  const totalItems = documentsResponse?.total || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">{t('dashboard.title')}</h1>
          <p className="text-secondary-600 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusCircle size={20} />
          <span>{t('dashboard.new_document')}</span>
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            placeholder={t('dashboard.search_placeholder')}
          />
        </div>

        {/* Status Filter */}
        <div className="flex-shrink-0">
          <StatusFilter value={statusFilter} onChange={handleStatusChange} />
        </div>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <p className="text-red-500">{t('dashboard.error', { message: error.message })}</p>}

      {!isLoading && documents.length === 0 && (
        <EmptyDocumentsView onCreateDocument={() => setIsModalOpen(true)} />
      )}

      {!isLoading && documents.length > 0 && (
        <>
          <DocumentGrid documents={documents} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <CreateDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;

