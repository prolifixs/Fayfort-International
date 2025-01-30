'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';

export interface StatusDropdownProps {
  productId: string;
  currentStatus: 'active' | 'inactive';
  onStatusChange: (productId: string, newStatus: 'active' | 'inactive') => Promise<void>;
  disabled?: boolean;
}

export function StatusDropdown({ 
  productId, 
  currentStatus, 
  onStatusChange,
  disabled 
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'active' | 'inactive' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = (newStatus: 'active' | 'inactive') => {
    if (newStatus === currentStatus) return;
    setPendingStatus(newStatus);
    setIsOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    
    try {
      setIsUpdating(true);
      await onStatusChange(productId, pendingStatus);
      setIsOpen(false);
    } catch (error) {
      console.error('Status update failed:', error);
    } finally {
      setIsUpdating(false);
      setPendingStatus(null);
    }
  };

  const getStatusStyles = (status: 'active' | 'inactive') => {
    return status === 'active'
      ? 'bg-green-100 text-green-800 hover:bg-green-200'
      : 'bg-red-100 text-red-800 hover:bg-red-200';
  };

  return (
    <div className="relative">
      <select
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value as 'active' | 'inactive')}
        disabled={disabled || isUpdating}
        className={`
          rounded-full px-3 py-1 text-sm font-medium
          ${getStatusStyles(currentStatus)}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          transition-colors duration-200
        `}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <Dialog open={isOpen} onClose={() => !isUpdating && setIsOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg p-6 max-w-sm w-full">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Confirm Status Change
            </Dialog.Title>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to mark this product as{' '}
              <span className="font-medium">{pendingStatus}</span>?
              {pendingStatus === 'inactive' && (
                <span className="block mt-2 text-amber-600">
                  This will hide the product from the catalog and notify users with pending requests.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isUpdating}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStatusChange}
                disabled={isUpdating}
                className={`
                  px-3 py-2 text-sm font-medium text-white rounded-md
                  ${isUpdating ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                `}
              >
                {isUpdating ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 