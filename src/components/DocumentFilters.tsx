import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X, ArrowUpDown, Filter } from 'lucide-react';
import useDebounce from '../hooks/useDebounce';

export interface DocumentFilterParams {
    title?: string;
    sortBy?: 'createdAt' | 'deadline' | 'title';
    sortOrder?: 'ASC' | 'DESC';
    signingMode?: 'INDIVIDUAL' | 'SHARED';
}

interface DocumentFiltersProps {
    filters: DocumentFilterParams;
    onFiltersChange: (filters: DocumentFilterParams) => void;
    showSigningModeFilter?: boolean;
}

const DocumentFilters: React.FC<DocumentFiltersProps> = ({
    filters,
    onFiltersChange,
    showSigningModeFilter = true,
}) => {
    const { t } = useTranslation();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [localTitle, setLocalTitle] = useState(filters.title || '');

    // Debounce search input with 500ms delay
    const debouncedTitle = useDebounce(localTitle, 500);

    // Update filters when debounced value changes
    useEffect(() => {
        onFiltersChange({ ...filters, title: debouncedTitle || undefined });
    }, [debouncedTitle]);

    const handleSearchChange = (value: string) => {
        setLocalTitle(value);
    };

    const handleClearSearch = () => {
        setLocalTitle('');
        onFiltersChange({ ...filters, title: undefined });
    };

    const handleSortByChange = (sortBy: 'createdAt' | 'deadline' | 'title') => {
        onFiltersChange({ ...filters, sortBy });
    };

    const handleSortOrderToggle = () => {
        const newOrder = filters.sortOrder === 'ASC' ? 'DESC' : 'ASC';
        onFiltersChange({ ...filters, sortOrder: newOrder });
    };

    const handleSigningModeChange = (signingMode?: 'INDIVIDUAL' | 'SHARED') => {
        onFiltersChange({ ...filters, signingMode });
    };

    const handleClearFilters = () => {
        setLocalTitle('');
        onFiltersChange({
            sortBy: 'createdAt',
            sortOrder: 'DESC',
        });
        setShowAdvanced(false);
    };

    const hasActiveFilters = filters.title || filters.signingMode ||
        (filters.sortBy && filters.sortBy !== 'createdAt') ||
        (filters.sortOrder && filters.sortOrder !== 'DESC');

    return (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4 mb-6">
            {/* Search Bar and Toggle Advanced Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                        type="text"
                        value={localTitle}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder={t('filters.search_placeholder', 'Search by document title...')}
                        className="input-field pl-10 pr-10 w-full"
                    />
                    {localTitle && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Advanced Filters Toggle */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`btn-secondary px-4 py-2 flex items-center gap-2 whitespace-nowrap ${showAdvanced ? 'bg-primary-50 border-primary-300 text-primary-700' : ''
                        }`}
                >
                    <SlidersHorizontal size={18} />
                    <span className="hidden sm:inline">{t('filters.advanced', 'Filters')}</span>
                    {hasActiveFilters && !showAdvanced && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-600 rounded-full">
                            !
                        </span>
                    )}
                </button>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvanced && (
                <div className="border-t border-secondary-200 pt-4 space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Sort By */}
                        <div>
                            <label className="label-text mb-2 block">
                                {t('filters.sort_by', 'Sort By')}
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={filters.sortBy || 'createdAt'}
                                    onChange={(e) =>
                                        handleSortByChange(e.target.value as 'createdAt' | 'deadline' | 'title')
                                    }
                                    className="input-field flex-1"
                                >
                                    <option value="createdAt">
                                        {t('filters.created_date', 'Created Date')}
                                    </option>
                                    <option value="deadline">
                                        {t('filters.deadline', 'Deadline')}
                                    </option>
                                    <option value="title">
                                        {t('filters.title', 'Title')}
                                    </option>
                                </select>
                                <button
                                    onClick={handleSortOrderToggle}
                                    className="btn-secondary px-3 flex items-center justify-center"
                                    title={
                                        filters.sortOrder === 'ASC'
                                            ? t('filters.ascending', 'Ascending')
                                            : t('filters.descending', 'Descending')
                                    }
                                >
                                    <ArrowUpDown
                                        size={18}
                                        className={filters.sortOrder === 'ASC' ? 'rotate-180' : ''}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Signing Mode */}
                        {showSigningModeFilter && (
                            <div>
                                <label className="label-text mb-2 block">
                                    {t('filters.signing_mode', 'Signing Mode')}
                                </label>
                                <select
                                    value={filters.signingMode || ''}
                                    onChange={(e) =>
                                        handleSigningModeChange(
                                            e.target.value ? (e.target.value as 'INDIVIDUAL' | 'SHARED') : undefined
                                        )
                                    }
                                    className="input-field w-full"
                                >
                                    <option value="">
                                        {t('filters.all_modes', 'All Modes')}
                                    </option>
                                    <option value="INDIVIDUAL">
                                        {t('filters.individual', 'Individual')}
                                    </option>
                                    <option value="SHARED">
                                        {t('filters.shared', 'Shared')}
                                    </option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleClearFilters}
                                className="text-sm text-secondary-600 hover:text-secondary-900 flex items-center gap-1.5 transition-colors"
                            >
                                <X size={16} />
                                {t('filters.clear_all', 'Clear all filters')}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Active Filters Summary (when advanced is closed) */}
            {!showAdvanced && hasActiveFilters && (
                <div className="border-t border-secondary-200 pt-3 mt-3">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-secondary-600 font-medium">
                            {t('filters.active', 'Active filters')}:
                        </span>
                        {filters.title && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                <Filter size={12} />
                                {t('filters.search', 'Search')}: "{filters.title}"
                            </span>
                        )}
                        {filters.signingMode && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <Filter size={12} />
                                {filters.signingMode}
                            </span>
                        )}
                        {filters.sortBy && filters.sortBy !== 'createdAt' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <ArrowUpDown size={12} />
                                {t(`filters.${filters.sortBy}`, filters.sortBy)}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentFilters;
