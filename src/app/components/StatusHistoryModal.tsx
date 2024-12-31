import { statusService } from '@/services/statusService';

interface StatusHistoryModalProps {
  requestId: string;
  onClose: () => void;
}

export default function StatusHistoryModal({ requestId, onClose }: StatusHistoryModalProps) {
  const history = statusService.getStatusHistory(requestId);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Status History</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={index} className="border-l-2 border-gray-200 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    statusService.getStatusColor(entry.status)
                  }`}>
                    {entry.status.replace('_', ' ')}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Updated by {entry.updatedBy}
                  </p>
                </div>
                <time className="text-xs text-gray-500">
                  {new Date(entry.timestamp).toLocaleString()}
                </time>
              </div>
              {entry.notes && (
                <p className="mt-2 text-sm text-gray-600">{entry.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 