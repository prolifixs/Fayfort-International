import { notificationService } from './notificationService';

export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';

interface StatusHistoryEntry {
  status: RequestStatus;
  timestamp: number;
  updatedBy: string;
  notes?: string;
}

interface RequestStatusData {
  currentStatus: RequestStatus;
  history: StatusHistoryEntry[];
}

class StatusService {
  private readonly STORAGE_KEY = 'request_statuses';

  private getStoredStatuses(): Record<string, RequestStatusData> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private saveStatuses(statuses: Record<string, RequestStatusData>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(statuses));
  }

  getRequestStatus(requestId: string): RequestStatusData | null {
    const statuses = this.getStoredStatuses();
    return statuses[requestId] || null;
  }

  updateStatus(
    requestId: string, 
    newStatus: RequestStatus, 
    updatedBy: string,
    notes?: string
  ): RequestStatusData {
    const statuses = this.getStoredStatuses();
    const currentData = statuses[requestId] || {
      currentStatus: 'pending',
      history: []
    };

    const historyEntry: StatusHistoryEntry = {
      status: newStatus,
      timestamp: Date.now(),
      updatedBy,
      notes
    };

    const updatedData: RequestStatusData = {
      currentStatus: newStatus,
      history: [...currentData.history, historyEntry]
    };

    statuses[requestId] = updatedData;
    this.saveStatuses(statuses);

    notificationService.addNotification(
      'info',
      `Request ${requestId} status updated to ${newStatus.replace('_', ' ')}`
    );

    return updatedData;
  }

  getStatusHistory(requestId: string): StatusHistoryEntry[] {
    const data = this.getRequestStatus(requestId);
    return data?.history || [];
  }

  getStatusColor(status: RequestStatus): string {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  }
}

export const statusService = new StatusService(); 