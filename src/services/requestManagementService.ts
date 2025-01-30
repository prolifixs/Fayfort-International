import { RequestProcessingService } from '../app/components/lib/requests/requestProcessor';
import type { NotificationService } from './notificationService';

export class RequestManagementService {
  constructor(
    private requestProcessor: RequestProcessingService,
    private notificationService: NotificationService = notificationService
  ) {}

  async handleStatusChange(requestId: string, newStatus: string): Promise<void> {
    try {
      if (newStatus === 'paid') {
        await this.requestProcessor.processPaidRequest(requestId)
      } else {
        await this.requestProcessor.processUnpaidRequest(requestId)
      }
      
      await this.notificationService.sendStatusUpdateNotification(requestId, newStatus)
    } catch (error) {
      console.error('Status change error:', error)
      throw error
    }
  }

  async handleResolution(requestId: string, resolution: string): Promise<void> {
    try {
      await this.updateResolutionStatus(requestId, resolution)
      await this.notificationService.sendResolutionNotification(requestId, resolution)
    } catch (error) {
      console.error('Resolution error:', error)
      throw error
    }
  }

  private async updateResolutionStatus(requestId: string, resolution: string): Promise<void> {
    await this.requestProcessor.updateRequestStatus(requestId, resolution, 'resolution', 'unavailable');
  }
} 