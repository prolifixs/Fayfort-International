'use client';

import { useState, useTransition } from 'react';
import { toast } from 'react-hot-toast';

interface StatusDropdownProps {
  requestId: string;
  currentStatus: string;
  statusType: 'resolution' | 'invoice';
  options: string[];
  onStatusUpdate: (requestId: string, type: 'resolution' | 'invoice', status: string) => Promise<void>;
}

export default function StatusDropdown({
  requestId,
  currentStatus,
  statusType,
  options,
  onStatusUpdate
}: StatusDropdownProps) {
  const [isPending, startTransition] = useTransition();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setIsUpdating(true);
    try {
      await onStatusUpdate(requestId, statusType, newStatus);
      toast.success(`${statusType} status updated to ${newStatus}`);
    } catch (error) {
      console.error(`${statusType} status update error:`, error);
      toast.error(`Failed to update ${statusType} status`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <select
      value={currentStatus}
      onChange={(e) => startTransition(() => handleStatusChange(e.target.value))}
      disabled={isUpdating || isPending}
      className={`block w-full rounded-md border-gray-300 shadow-sm 
        focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm
        ${isUpdating || isPending ? 'opacity-50' : ''}
        ${statusType === 'resolution' ? 'bg-blue-50' : 'bg-green-50'}`}
    >
      {options.map(status => (
        <option key={status} value={status}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </option>
      ))}
    </select>
  );
} 