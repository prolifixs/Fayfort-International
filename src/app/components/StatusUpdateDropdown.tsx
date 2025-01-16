'use client';

import { useState, useRef, useEffect } from 'react';
import { RequestStatus } from '@/app/components/types/request.types';
import { statusService } from '@/services/statusService';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import { createNotification } from './lib/notifications';
import { generateInvoice } from '@/services/invoiceService';

interface StatusUpdateDropdownProps {
  requestId: string;
  currentStatus: RequestStatus;
  onStatusUpdate: (newStatus: 'approved' | 'rejected') => void;
}

export default function StatusUpdateDropdown({
  requestId,
  currentStatus,
  onStatusUpdate
}: StatusUpdateDropdownProps) {
  const supabase = createClientComponentClient();
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<RequestStatus | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusOptions: RequestStatus[] = [
    'pending',
    'approved',
    'rejected',
    'fulfilled'
  ];

  const handleStatusChange = async (newStatus: RequestStatus) => {
    console.group('🔄 Status Change Flow Initiated');
    console.log('Current Status:', currentStatus);
    console.log('New Status:', newStatus);

    if (newStatus === currentStatus) {
      console.log('❌ Status unchanged - exiting flow');
      console.groupEnd();
      setIsOpen(false);
      return;
    }

    if (newStatus === 'approved' || newStatus === 'rejected') {
      console.log('📝 Showing notes modal for approval/rejection');
      setSelectedNewStatus(newStatus);
      setShowNotes(true);
      setIsOpen(false);
    }
    console.groupEnd();
  };

  const handleSubmit = async () => {
    if (!selectedNewStatus) return;
    
    console.group('📤 Status Update Submission');
    try {
      console.log('1️⃣ Updating request status in database');
      const { error: requestError } = await supabase
        .from('requests')
        .update({ 
          status: selectedNewStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (requestError) throw requestError;
      console.log('✅ Request status updated successfully');

      console.log('2️⃣ Creating status history entry');
      const { error: historyError } = await supabase
        .from('status_history')
        .insert({
          request_id: requestId,
          status: selectedNewStatus,
          notes: notes.trim() || null,
          created_at: new Date().toISOString()
        });

      if (historyError) throw historyError;
      console.log('✅ Status history created successfully');

      // Add notification creation
      console.log('3️⃣ Creating notification');
      try {
        await createNotification({
          type: 'status_change',
          content: `Request status updated to ${selectedNewStatus}`,
          reference_id: requestId,
          reference_type: 'request'
        });
        console.log('✅ Notification created successfully');
      } catch (notifError) {
        console.error('❌ Notification creation failed:', notifError);
      }

      // Add invoice generation for approved status
      if (selectedNewStatus === 'approved') {
        console.log('4️⃣ Initiating invoice generation');
        try {
          // This should be implemented in your invoice service
          await generateInvoice(requestId);
          console.log('✅ Invoice generated successfully');
        } catch (invoiceError) {
          console.error('❌ Invoice generation failed:', invoiceError);
        }
      }

      onStatusUpdate(selectedNewStatus as 'approved' | 'rejected');
      setShowNotes(false);
      setNotes('');
      setSelectedNewStatus(null);
      toast.success(`Status updated to ${selectedNewStatus}`);
      console.log('✅ Status update flow completed successfully');
    } catch (error) {
      console.error('❌ Error in status update flow:', error);
      toast.error('Failed to update status');
    }
    console.groupEnd();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          statusService.getStatusColor(currentStatus)
        }`}
      >
        {currentStatus.toString().replace('_', ' ')}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
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