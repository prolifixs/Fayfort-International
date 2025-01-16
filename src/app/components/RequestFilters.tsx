'use client';
import { useState, useCallback } from 'react';
import { RequestStatus } from '@/app/components/types/request.types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface RequestFiltersProps {
  onFilterChange: (filters: {
    search?: string;
    status?: string;
    dateRange?: { start: Date | null; end: Date | null };
  }) => void;
}

type Filters = {
  search: string;
  status: string;
  dateRange: { start: Date | null; end: Date | null };
};

export default function RequestFilters({ onFilterChange }: RequestFiltersProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  const handleChange = useCallback((updates: Partial<Filters>) => {
    const filters: Filters = { search, status, dateRange, ...updates };
    onFilterChange(filters);
  }, [search, status, dateRange, onFilterChange]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search requests..."
            className="w-full px-4 py-2 border rounded-lg"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleChange({ search: e.target.value });
            }}
          />
        </div>
        <select
          className="px-4 py-2 border rounded-lg"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            handleChange({ status: e.target.value });
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex-1 space-x-4">
          <input
            type="date"
            className="px-4 py-2 border rounded-lg"
            onChange={(e) => {
              const start = e.target.value ? new Date(e.target.value) : null;
              setDateRange(prev => ({ ...prev, start }));
              handleChange({ dateRange: { ...dateRange, start } });
            }}
          />
          <input
            type="date"
            className="px-4 py-2 border rounded-lg"
            onChange={(e) => {
              const end = e.target.value ? new Date(e.target.value) : null;
              setDateRange(prev => ({ ...prev, end }));
              handleChange({ dateRange: { ...dateRange, end } });
            }}
          />
        </div>
        <button
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          onClick={() => {
            setSearch('');
            setStatus('all');
            setDateRange({ start: null, end: null });
            handleChange({ search: '', status: 'all', dateRange: { start: null, end: null } });
          }}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
} 