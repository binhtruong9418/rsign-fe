import React from 'react';
import { DocumentStatus } from '../../types';
import { Filter, Clock, CheckCircle, XCircle, FileText, ChevronDown } from 'lucide-react';

interface StatusFilterProps {
  value: DocumentStatus | 'ALL';
  onChange: (status: DocumentStatus | 'ALL') => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ value, onChange }) => {
  const statusOptions = [
    { 
      value: 'ALL' as const, 
      label: 'All Documents',
    },
    {
      value: 'PENDING' as const,
      label: 'Pending',
    },
    {
      value: 'COMPLETED' as const,
      label: 'Completed',
    },
  ];

  const selectedOption = statusOptions.find(option => option.value === value);

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2 text-gray-700 font-medium">
        <Filter size={18} className="text-gray-500" />
        <span>Status:</span>
      </div>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as DocumentStatus | 'ALL')}
          className="appearance-none bg-dark-card border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer shadow-sm"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default StatusFilter;
