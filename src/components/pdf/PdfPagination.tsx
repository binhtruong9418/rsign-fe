import React from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SignatureZone {
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
}

interface PdfPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    signatureZones?: SignatureZone[];
    className?: string;
}

export const PdfPagination: React.FC<PdfPaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    signatureZones = [],
    className = '',
}) => {
    const { t } = useTranslation();

    const signaturePages = Array.from(
        new Set(signatureZones.map(zone => zone.pageNumber))
    ).sort((a, b) => a - b);

    const hasSignatures = signaturePages.length > 0;
    const isOnSignaturePage = signaturePages.includes(currentPage);

    const goToNextSignaturePage = () => {
        const nextPage = signaturePages.find(page => page > currentPage);
        if (nextPage) {
            onPageChange(nextPage);
        }
    };

    const goToPrevSignaturePage = () => {
        const prevPages = signaturePages.filter(page => page < currentPage);
        const prevPage = prevPages[prevPages.length - 1];
        if (prevPage) {
            onPageChange(prevPage);
        }
    };

    const hasNextSignature = signaturePages.some(page => page > currentPage);
    const hasPrevSignature = signaturePages.some(page => page < currentPage);

    return (
        <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-4 ${className}`}>
            {/* Main Page Navigation */}
            <div className="flex items-center bg-white border border-secondary-200 rounded-lg shadow-sm p-0.5">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-secondary-50 rounded-md transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                    title={t('sign_components.document_viewer.previous_page')}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} />
                </button>

                <span className="text-xs font-semibold text-secondary-700 w-16 text-center tabular-nums leading-none select-none">
                    {currentPage} <span className="text-secondary-400 font-normal">/</span> {totalPages}
                </span>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-secondary-50 rounded-md transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                    title={t('sign_components.document_viewer.next_page')}
                    aria-label="Next page"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Signature Navigation */}
            {hasSignatures && (
                <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg shadow-sm p-0.5 animate-fadeIn">
                    <button
                        onClick={goToPrevSignaturePage}
                        disabled={!hasPrevSignature}
                        className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-100 rounded-md transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                        title="Previous signature page"
                        aria-label="Go to previous signature page"
                    >
                        <ChevronLeft size={16} strokeWidth={2.5} />
                    </button>

                    <div className="flex items-center gap-1.5 px-2 cursor-help" title={`Signature pages: ${signaturePages.join(', ')}`}>
                        <FileText size={12} className={isOnSignaturePage ? 'text-amber-600 fill-amber-600/20' : 'text-amber-500'} />
                        <span className="text-[10px] sm:text-xs font-bold text-amber-700 tabular-nums leading-none uppercase tracking-wide">
                            {signaturePages.indexOf(currentPage) !== -1 ? `${signaturePages.indexOf(currentPage) + 1}/${signaturePages.length}` : `${signaturePages.length} ZONES`}
                        </span>
                    </div>

                    <button
                        onClick={goToNextSignaturePage}
                        disabled={!hasNextSignature}
                        className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-100 rounded-md transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                        title="Next signature page"
                        aria-label="Go to next signature page"
                    >
                        <ChevronRight size={16} strokeWidth={2.5} />
                    </button>
                </div>
            )}
        </div>
    );
};
