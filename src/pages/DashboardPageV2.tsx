import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, User, Users } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { signingApi } from '../services/signingApi';
import type { PendingDocument, PageDto } from '../types';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [documents, setDocuments] = useState<PageDto<PendingDocument> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadPendingDocuments();
  }, [currentPage]);

  const loadPendingDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await signingApi.getPendingDocuments(currentPage, pageSize);
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
      console.error('Failed to load pending documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (item: PendingDocument) => {
    // If document has multiple signatures, go to multi-document detail
    if (item.canUseMultiSign && item.signers && item.signers.length > 1) {
      navigate(`/multi-documents/${item.documentId}`);
    } else if (item.documentSignerId) {
      // Single signature - use old flow
      navigate(`/documents/${item.documentSignerId}`);
    } else {
      // Fallback: if documentSignerId is missing but we have signers array
      const firstSigner = item.signers?.[0];
      if (firstSigner?.documentSignerId) {
        navigate(`/documents/${firstSigner.documentSignerId}`);
      } else {
        console.error('Cannot navigate: missing documentSignerId', item);
      }
    }
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

  const getCreatorName = (createdBy: any): string | null => {
    if (!createdBy) return null;
    if (typeof createdBy === 'string') return createdBy;
    if (typeof createdBy === 'object') {
      return createdBy.fullName || createdBy.email || null;
    }
    return null;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={loadPendingDocuments} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const items = documents?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">
          {t('dashboard.pending_documents', 'Pending Documents')}
        </h1>
        <p className="text-secondary-600 mt-1">
          {t('dashboard.pending_subtitle', 'Documents waiting for your signature')}
        </p>
      </div>

      {/* Empty State */}
      {isEmpty && (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">
            {t('dashboard.no_pending_documents', 'No Pending Documents')}
          </h3>
          <p className="text-secondary-600">
            {t('dashboard.all_caught_up', "You're all caught up!")}
          </p>
        </div>
      )}

      {/* Document List */}
      {!isEmpty && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const deadlineStatus = getDeadlineStatus(item.document.deadline);
              const isMultiSign = item.canUseMultiSign && item.signers && item.signers.length > 1;
              const signatureCount = isMultiSign ? item.signers!.length : 1;

              return (
                <div
                  key={item.documentSignerId || item.documentId}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 p-6 cursor-pointer border border-secondary-200 hover:border-primary-300 group"
                  onClick={() => handleViewDocument(item)}
                >
                  {/* Header with Icon and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-secondary-900 truncate text-base group-hover:text-primary-600 transition-colors">
                          {item.document.title}
                        </h3>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.status}
                          </span>
                          {isMultiSign && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <Users size={12} />
                              {signatureCount} {t('dashboard.signatures', 'signatures')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Info Grid */}
                  <div className="space-y-2.5 text-sm">
                    {/* Created By */}
                    {getCreatorName(item.document.createdBy) && (
                      <div className="flex items-center gap-2 text-secondary-600">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {getCreatorName(item.document.createdBy)}
                        </span>
                      </div>
                    )}
                    
                    {/* Deadline */}
                    {item.document.deadline && (
                      <div className="flex items-center gap-2 text-secondary-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="truncate">{formatDate(item.document.deadline)}</span>
                          {deadlineStatus && (
                            <span className={`ml-2 text-xs font-medium ${
                              deadlineStatus.className.includes('red') ? 'text-red-600' :
                              deadlineStatus.className.includes('orange') ? 'text-orange-600' :
                              deadlineStatus.className.includes('yellow') ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              ({deadlineStatus.text})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Deadline Warning Badge */}
                  {deadlineStatus && (deadlineStatus.className.includes('red') || deadlineStatus.className.includes('orange')) && (
                    <div className="mt-4">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${deadlineStatus.className}`}>
                        ⚠️ {deadlineStatus.text}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-5 pt-4 border-t border-secondary-200">
                    <button className="w-full btn-primary text-sm py-2.5 group-hover:shadow-md transition-shadow">
                      {isMultiSign
                        ? `${t('dashboard.sign_all', 'Sign All')} (${signatureCount})`
                        : t('dashboard.view_and_sign', 'View & Sign')
                      } →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {documents && documents.totalPages > 1 && (
            <div className="mt-8">
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
