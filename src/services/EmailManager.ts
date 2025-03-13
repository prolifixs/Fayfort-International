import { render } from '@react-email/render';
import { emailQueueService } from '../services/emailQueueService';
import { 
  EmailTemplateRegistry, 
  EmailQueueOptions, 
  TemplateType,
  EmailMetadata 
} from '../app/components/types/email-templates';

export class EmailManager {
  protected async renderTemplate<T extends TemplateType>(
    template: EmailTemplateRegistry[T],
    props: any
  ): Promise<string> {
    try {
      return await render(template({ ...props, previewMode: false }));
    } catch (error) {
      console.error(`Template rendering failed (${template.name}):`, error);
      throw new Error(`Failed to render email template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected async queueEmail(options: {
    to: string;
    subject: string;
    template: EmailTemplateRegistry[TemplateType];
    props: any;
    attachments?: EmailQueueOptions['attachments'];
    metadata?: Omit<EmailMetadata, 'templateName' | 'sentAt'>;
  }): Promise<void> {
    const { to, subject, template, props, attachments, metadata } = options;

    try {
      const html = await this.renderTemplate(template, props);
      
      await emailQueueService.addToQueue({
        to,
        subject,
        html,
        attachments,
        metadata: {
          ...metadata,
          templateName: template.name,
          sentAt: new Date().toISOString()
        }
      });

      console.log('Email queued successfully:', {
        template: template.name,
        to,
        subject,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to queue email:', error);
      throw new Error(`Email queueing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Retry attempt ${i + 1} failed:`, error);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError!;
  }
} 