import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = true,
  totalItems = 0,
  itemsPerPage = 10,
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
      {showInfo && (
        <div className="text-sm text-secondary-600">
          Showing <span className="font-medium text-secondary-900">{Math.min((currentPage * itemsPerPage) + 1, totalItems)}</span> to{' '}
          <span className="font-medium text-secondary-900">{Math.min((currentPage + 1) * itemsPerPage, totalItems)}</span> of{' '}
          <span className="font-medium text-secondary-900">{totalItems}</span> results
        </div>
      )}

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-2 rounded-lg border border-secondary-300 bg-white text-secondary-500 hover:bg-secondary-50 hover:text-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-secondary-400">...</span>
            ) : (
              <button
                onClick={() => onPageChange((page as number) - 1)}
                className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                  currentPage === (page as number) - 1
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-secondary-700 border-secondary-300 hover:bg-secondary-50 hover:text-secondary-900'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-2 rounded-lg border border-secondary-300 bg-white text-secondary-500 hover:bg-secondary-50 hover:text-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
