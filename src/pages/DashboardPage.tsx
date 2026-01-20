import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FileText, Calendar, User, Users, PenTool } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import DocumentFilters, { DocumentFilterParams } from '../components/DocumentFilters';
import { signingApi } from '../services/signingApi';
import type { PendingDocument, PageDto } from '../types';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 9;
  const [filters, setFilters] = useState<DocumentFilterParams>({
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  // Use React Query for data fetching
  const { data: documents, isLoading, error, refetch } = useQuery<PageDto<PendingDocument>>({
    queryKey: ['pendingDocuments', currentPage, pageSize, filters],
    queryFn: () => signingApi.getPendingDocuments(
      currentPage,
      pageSize,
      filters.sortBy || 'createdAt',
      filters.sortOrder || 'DESC',
      filters.title,
      filters.signingMode
    ),
    staleTime: 30000, // 30 seconds
  });

  const handleFiltersChange = (newFilters: DocumentFilterParams) => {
    setFilters(newFilters);
    setCurrentPage(0); // Reset to first page when filters change
  };

  const handleViewDocument = (item: PendingDocument) => {
    // Navigate to document detail using id
    navigate(`/documents/${item.id}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDeadlineStatus = (deadline?: string) => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { text: 'Expired', className: 'bg-red-100 text-red-800' };
    } else if (daysRemaining <= 3) {
      return { text: `${daysRemaining} days left`, className: 'bg-orange-100 text-orange-800' };
    } else if (daysRemaining <= 7) {
      return { text: `${daysRemaining} days left`, className: 'bg-yellow-100 text-yellow-800' };
    }
    return { text: `${daysRemaining} days left`, className: 'bg-green-100 text-green-800' };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error instanceof Error ? error.message : 'Failed to load documents'}</p>
        <button onClick={() => refetch()} className="btn-primary">
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  const items = documents?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">
          {t('dashboard.pending_documents', 'Pending Documents')}
        </h1>
        <p className="text-sm sm:text-base text-secondary-600 mt-1">
          {t('dashboard.pending_subtitle', 'Documents waiting for your signature')}
        </p>
      </div>

      {/* Filters */}
      <DocumentFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        showSigningModeFilter={true}
      />

      {/* Empty State */}
      {isEmpty && (
        <div className="text-center py-12 sm:py-16 bg-white rounded-lg shadow-sm mx-4 sm:mx-0">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-full mb-4">
            <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-2 px-4">
            {t('dashboard.no_pending_documents', 'No Pending Documents')}
          </h3>
          <p className="text-sm sm:text-base text-secondary-600 px-4">
            {t('dashboard.all_caught_up', "You're all caught up!")}
          </p>
        </div>
      )}

      {/* Document List */}
      {!isEmpty && (
        <>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 p-4 sm:p-6 cursor-pointer border border-secondary-200 hover:border-primary-300 group"
                  onClick={() => handleViewDocument(item)}
                >
                  {/* Header with Icon and Status */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-primary-100 to-primary-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-secondary-900 truncate text-sm sm:text-base group-hover:text-primary-600 transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex gap-1.5 sm:gap-2 mt-1 flex-wrap">
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.status}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <span>{item.signingMode} • {item.signingFlow}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Info Grid */}
                  <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                    {/* User's Personal Progress */}
                    <div className="flex items-center gap-2 text-secondary-600">
                      <PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="text-xs sm:text-sm">
                        {t('dashboard.your_progress', 'Your progress')}: <span className="font-semibold text-secondary-900">{item.signedCount}/{item.requiredCount}</span>
                      </span>
                    </div>

                    {/* Overall Progress */}
                    <div className="flex items-center gap-2 text-secondary-600">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="text-xs sm:text-sm">
                        {t('dashboard.overall_progress', 'Overall')}: <span className="font-semibold text-secondary-900">{item.completedSignatures}/{item.totalSignatures}</span>
                      </span>
                    </div>

                    {/* Deadline */}
                    {item.deadline && (
                      <div className="flex items-center gap-2 text-secondary-600">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="truncate text-xs sm:text-sm">{formatDate(item.deadline)}</span>
                          {item.isOverdue && (
                            <span className="ml-1 sm:ml-2 text-xs font-medium text-red-600">
                              ({t('dashboard.overdue', 'Overdue')})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-secondary-200">
                    <button className="w-full btn-primary text-xs sm:text-sm py-2 sm:py-2.5 group-hover:shadow-md transition-shadow">
                      {t('dashboard.view_and_sign', 'View & Sign')} →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {documents && documents.totalPages > 1 && (
            <div className="mt-6 sm:mt-8 px-4 sm:px-0">
              <Pagination
                currentPage={currentPage + 1}
                totalPages={documents.totalPages}
                onPageChange={(page) => setCurrentPage(page - 1)}
              />
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 text-center text-sm text-secondary-600">
            {t('dashboard.showing_documents', {
              start: currentPage * pageSize + 1,
              end: Math.min((currentPage + 1) * pageSize, documents?.total || 0),
              total: documents?.total || 0,
              defaultValue: `Showing {{start}}-{{end}} of {{total}} documents`,
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
