'use client';
import { useState } from 'react';
import { RequestStatus, statusService } from '@/services/statusService';

interface StatusUpdateDropdownProps {
  requestId: string;
  currentStatus: RequestStatus;
  onStatusUpdate: (newStatus: RequestStatus) => void;
}

export default function StatusUpdateDropdown({
  requestId,
  currentStatus,
  onStatusUpdate
}: StatusUpdateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const statusOptions: RequestStatus[] = [
    'pending',
    'in_progress',
    'completed',
    'rejected',
    'cancelled'
  ];

  const handleStatusChange = async (newStatus: RequestStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setShowNotes(true);
  };

  const handleSubmit = async () => {
    const selectedStatus = statusOptions.find(status => 
      statusService.getStatusColor(status).includes(currentStatus)
    ) || 'pending';

    await statusService.updateStatus(
      requestId,
      selectedStatus,
      'current-user', // TODO: Get from auth context
      notes
    );

    onStatusUpdate(selectedStatus);
    setShowNotes(false);
    setIsOpen(false);
    setNotes('');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          statusService.getStatusColor(currentStatus)
        }`}
      >
        {currentStatus.replace('_', ' ')}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  status === currentStatus
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                role="menuitem"
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {showNotes && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-medium mb-4">Add notes for status change</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              placeholder="Optional notes about this status change..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNotes(false);
                  setNotes('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 