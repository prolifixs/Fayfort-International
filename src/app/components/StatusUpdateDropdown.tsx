'use client';

import { useState, useRef, useEffect } from 'react';
import { RequestStatus } from '@/app/components/types/request.types';
import { statusService } from '@/services/statusService';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import { createNotification } from './lib/notifications';
import { generateInvoice } from '@/services/invoiceService';
import { LoadingBar } from '@/app/components/LoadingBar/LoadingBar';
import { Invoice } from '@/app/components/types/invoice';
import { emailService } from '@/services/emailService';
import { RequestWithRelations } from '@/app/components/types/request.types';


import { Button } from '@/app/components/ui/button';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { ShippingService } from '@/services/shippingService';






interface StatusUpdateDropdownProps {
  request: RequestWithRelations;
  onStatusChange: (newStatus: RequestStatus) => Promise<void>;
  disabled?: boolean;
}

export function StatusUpdateDropdown({ request, onStatusChange, disabled = false }: StatusUpdateDropdownProps) {
  const supabase = createClientComponentClient();
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [showShippingInfo, setShowShippingInfo] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<RequestStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [shippingInfo, setShippingInfo] = useState({
    carrier: '',
    trackingNumber: '',
    shippingDate: null as Date | null
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusOptions: RequestStatus[] = ['pending', 'approved', 'rejected', 'fulfilled', 'shipped'];

  const handleStatusChange = async (newStatus: RequestStatus) => {
    console.group('🔄 StatusUpdateDropdown - Update Flow');
    console.log('Status Change Started:', {
      requestId: request.id,
      currentStatus: request.status,
      newStatus
    });
    
    if (isUpdating) {
      console.warn('⚠️ Update already in progress');
      console.groupEnd();
      return;
    }
    setIsUpdating(true);

    try {
      if (newStatus === request.status) {
        console.log('ℹ️ No status change needed - same status');
        setIsOpen(false);
        console.groupEnd();
        return;
      }

      if (newStatus === 'shipped') {
        console.log('📦 Showing shipping modal');
        setSelectedNewStatus(newStatus);
        setShowShippingInfo(true);
        setIsOpen(false);
        console.groupEnd();
        return;
      }

      console.log('📝 Showing notes modal');
      setSelectedNewStatus(newStatus);
      setShowNotes(true);
      setIsOpen(false);
      console.groupEnd();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmit = async () => {
    console.group('📤 StatusUpdateDropdown - Submit Flow');
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      if (selectedNewStatus === 'shipped') {
        setLoadingMessage('Processing shipping update...');
        
        const shippingService = new ShippingService();
        await shippingService.processShippingUpdate(request.id, {
          carrier: shippingInfo.carrier,
          trackingNumber: shippingInfo.trackingNumber,
          shippingDate: shippingInfo.shippingDate?.toISOString() || null
        });
        
        setProgress(100);
        setLoadingMessage('Complete!');
        
        // Reset form
        setShowNotes(false);
        setShowShippingInfo(false);
        setShippingInfo({
          carrier: '',
          trackingNumber: '',
          shippingDate: null
        });
      } else {
        await onStatusChange(selectedNewStatus as RequestStatus);
      }

      if (selectedNewStatus === 'approved') {
        console.log('📋 Generating invoice');
        setLoadingMessage('Generating invoice...');
        setProgress(40);
        await generateInvoice(request.id);
        setProgress(60);
        
        console.log('📧 Sending email notification');
        setLoadingMessage('Sending notification email...');
        setProgress(80);
        const requestToInvoiceStatus = {
          pending: 'draft',
          approved: 'sent',
          fulfilled: 'paid',
          rejected: 'cancelled',
          shipped: 'paid'
        } as const;
        const invoice: Invoice = {
          id: request.id,
          request_id: request.id,
          user_id: request.customer.id,
          status: requestToInvoiceStatus[selectedNewStatus] || 'draft',
          amount: request.invoice?.amount || 0,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          invoice_items: []
        };
        await emailService.sendStatusChangeEmail(
          invoice,
          requestToInvoiceStatus[request.status] || 'draft',
          requestToInvoiceStatus[selectedNewStatus] || 'draft'
        );
      }
      
    } catch (error) {
      console.error('❌ Submit failed:', error);
      setError('Failed to process shipping update');
      throw error;
    } finally {
      setIsProcessing(false);
      console.groupEnd();
    }
  };

  return (
    <div className="relative">
      <select
        value={request.status}
        onChange={(e) => handleStatusChange(e.target.value as RequestStatus)}
        disabled={disabled}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        {statusOptions.map(status => (
          <option key={status} value={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </option>
        ))}
      </select>

      {showShippingInfo && (
        <Dialog open={showShippingInfo} onOpenChange={() => setShowShippingInfo(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Shipping Information</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <label htmlFor="tracking" className="block text-sm font-medium text-gray-700">
                  Tracking Number
                </label>
                <input
                  id="tracking"
                  type="text"
                  value={shippingInfo.trackingNumber}
                  onChange={(e) => setShippingInfo(prev => ({...prev, trackingNumber: e.target.value}))}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="carrier" className="block text-sm font-medium text-gray-700">
                  Carrier
                </label>
                <input
                  id="carrier"
                  type="text"
                  value={shippingInfo.carrier}
                  onChange={(e) => setShippingInfo(prev => ({...prev, carrier: e.target.value}))}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Ship Date
                </label>
                <input
                  id="date"
                  type="datetime-local"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={shippingInfo.shippingDate ? shippingInfo.shippingDate.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setShippingInfo(prev => ({
                    ...prev, 
                    shippingDate: e.target.value ? new Date(e.target.value) : null
                  }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowShippingInfo(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!shippingInfo.trackingNumber || !shippingInfo.carrier}
                >
                  Update Status
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <LoadingBar 
              progress={progress}
              message={loadingMessage}
              error={error || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
} 