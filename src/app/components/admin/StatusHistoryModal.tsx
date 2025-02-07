'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';

interface StatusHistoryModalProps {
  requestId: string;
  onClose: () => void;
}

interface StatusHistory {
  id: string;
  status: string;
  created_at: string;
  user: {
    email: string;
  } | null;
  notes?: string;
}

export default function StatusHistoryModal({ requestId, onClose }: StatusHistoryModalProps) {
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data, error } = await supabase
          .from('status_history')
          .select(`
            id,
            status,
            created_at,
            notes,
            user:user_id (
              email
            )
          `)
          .eq('request_id', requestId)
          .order('created_at', { ascending: false })
          .returns<StatusHistory[]>();

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching status history:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [requestId, supabase]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Status History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No history available</div>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="border-l-2 border-gray-200 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                      entry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {entry.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      Updated by {entry.user?.email || 'Unknown'}
                    </p>
                  </div>
                  <time className="text-xs text-gray-500">
                    {format(new Date(entry.created_at), 'PPp')}
                  </time>
                </div>
                {entry.notes && (
                  <p className="mt-2 text-sm text-gray-600">{entry.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 