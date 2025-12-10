import React from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder
}) => {
  const { t } = useTranslation();
  const actualPlaceholder = placeholder || t('dashboard_components.search_input.placeholder_default');

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={18} className="text-gray-400" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={actualPlaceholder}
        className="block w-full pl-10 pr-10 py-2 border border-secondary-300 rounded-lg bg-white text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm"
      />

      {value && (
        <button
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
          title={t('dashboard_components.search_input.clear')}
        >
          <X size={16} className="text-gray-400" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;

