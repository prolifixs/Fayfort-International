import { InvoiceEmail } from '../email/templates/InvoiceEmail';
import { StatusChangeEmail } from '../email/templates/StatusChangeEmail';
import { NotificationEmail } from '../email/templates/NotificationEmail';
import { WelcomeEmail } from '../email/templates/WelcomeEmail';
import { VerificationEmail } from '../email/templates/VerificationEmail';
import { PasswordResetEmail } from '../email/templates/PasswordResetEmail';

export interface BaseTemplateProps {
  previewMode?: boolean;
}

export interface EmailMetadata {
  type: string;
  templateName: string;
  sentAt: string;
  priority?: 'high' | 'normal' | 'low';
  [key: string]: any;
}

export interface EmailQueueOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
  metadata?: EmailMetadata;
}

export interface EmailTemplateRegistry {
  invoice: typeof InvoiceEmail;
  statusChange: typeof StatusChangeEmail;
  notification: typeof NotificationEmail;
  welcome: typeof WelcomeEmail;
  verification: typeof VerificationEmail;
  passwordReset: typeof PasswordResetEmail;
}

export type TemplateType = keyof EmailTemplateRegistry; 