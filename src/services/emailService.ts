import { EmailManager } from '../services/EmailManager';
import { render } from '@react-email/render';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Invoice } from '@/app/components/types/invoice';
import { InvoiceEmail } from '@/app/components/email/templates/InvoiceEmail';
import { StatusChangeEmail } from '@/app/components/email/templates/StatusChangeEmail';
import { NotificationEmail } from '@/app/components/email/templates/NotificationEmail';
import { WelcomeEmail } from '@/app/components/email/templates/WelcomeEmail';
import { VerificationEmail } from '@/app/components/email/templates/VerificationEmail';
import { PasswordResetEmail } from '@/app/components/email/templates/PasswordResetEmail';
import { emailQueueService } from './emailQueueService';
import { pdfService } from './pdfService';

export class EmailService extends EmailManager {
  private supabase = createClientComponentClient();

  private logEmailTrigger(type: string, recipient: string, metadata: any = {}) {
    console.log(`📧 Email Triggered:`, {
      type,
      recipient,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  async sendInvoiceEmail(invoice: Invoice, recipientEmail: string) {
    try {
      this.logEmailTrigger('invoice', recipientEmail, { invoiceId: invoice.id });

      // DEVELOPMENT MODE: Using verified email for testing
      const devEmail = 'prolifixs.pj@gmail.com'; // Your verified Resend email

      return this.queueEmail({
        to: devEmail, // Use actual email instead of 'sent'
        subject: `Invoice #${invoice.id} Ready for Review`,
        template: InvoiceEmail,
        props: {
          customerName: invoice.request?.customer?.name || 'Valued Customer',
          customerEmail: recipientEmail,
          invoiceNumber: invoice.id,
          amount: invoice.amount,
          dueDate: invoice.due_date,
          createdAt: invoice.created_at,
          items: invoice.invoice_items.map(item => ({
            description: item.product.name,
            quantity: item.quantity,
            price: item.unit_price
          })),
          paymentLink: `/dashboard/invoices/${invoice.id}`,
          status: invoice.status
        },
        attachments: [{
          filename: `invoice-${invoice.id}.pdf`,
          path: await pdfService.generateAndStore(invoice)
        }],
        metadata: {
          type: 'invoice',
          invoiceId: invoice.id,
          priority: 'high'
        }
      });

      /* PRODUCTION MODE: Uncomment after domain verification on resend.com/domains
      const isProd = process.env.NODE_ENV === 'production';
      return this.queueEmail({
        to: isProd 
          ? `${invoice.request?.customer?.name} <${recipientEmail}>`
          : 'prolifixs.pj@gmail.com', // Development fallback
        subject: `Invoice #${invoice.id} Ready for Review`,
        template: InvoiceEmail,
        props: {
          customerName: invoice.request?.customer?.name || 'Valued Customer',
          customerEmail: recipientEmail,
          invoiceNumber: invoice.id,
          amount: invoice.amount,
          dueDate: invoice.due_date,
          createdAt: invoice.created_at,
          items: invoice.invoice_items.map(item => ({
            description: item.product.name,
            quantity: item.quantity,
            price: item.unit_price
          })),
          paymentLink: `/dashboard/invoices/${invoice.id}`,
          status: invoice.status
        },
        attachments: [{
          filename: `invoice-${invoice.id}.pdf`,
          path: await pdfService.generateAndStore(invoice)
        }],
        metadata: {
          type: 'invoice',
          invoiceId: invoice.id,
          priority: 'high'
        }
      });
      */
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      throw error;
    }
  }

  async sendStatusChangeEmail(invoice: Invoice, previousStatus: Invoice['status'], recipientEmail: string) {
    try {
      this.logEmailTrigger('status_change', recipientEmail, { 
        invoiceId: invoice.id,
        previousStatus,
        newStatus: invoice.status
      });
      
      return this.queueEmail({
        to: recipientEmail,
        subject: `Invoice #${invoice.id} Status Update`,
        template: StatusChangeEmail,
        props: { invoice, previousStatus },
        metadata: {
          type: 'status_change',
          invoiceId: invoice.id,
          priority: 'high'
        }
      });
    } catch (error) {
      console.error('Failed to send status change email:', error);
      throw error;
    }
  }

  async sendPaymentConfirmationEmail(invoice: Invoice, recipientEmail: string) {
    try {
      this.logEmailTrigger('payment_confirmation', recipientEmail, { 
        invoiceId: invoice.id,
        amount: invoice.amount
      });

      return this.queueEmail({
        to: recipientEmail,
        subject: `Payment Confirmed for Invoice #${invoice.id}`,
        template: NotificationEmail,
        props: {
          title: 'Payment Confirmation',
          message: `We've received your payment for Invoice #${invoice.id}. Thank you for your business!`,
          additionalDetails: `Amount Paid: $${invoice.amount.toFixed(2)}\nPayment Date: ${new Date().toLocaleDateString()}`,
          actionLabel: 'View Invoice',
          actionLink: `/invoices/${invoice.id}`
        },
        metadata: {
          type: 'payment_confirmation',
          invoiceId: invoice.id,
          priority: 'high'
        }
      });
    } catch (error) {
      console.error('Failed to send payment confirmation email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(recipientEmail: string, name: string) {
    try {
      this.logEmailTrigger('welcome', recipientEmail, { name });
      
      return this.queueEmail({
        to: recipientEmail,
        subject: 'Welcome to Our Platform!',
        template: WelcomeEmail,
        props: { name },
        metadata: {
          type: 'welcome',
          priority: 'high'
        }
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  async sendVerificationEmail(recipientEmail: string, name: string, sentAt?: string) {
    try {
      this.logEmailTrigger('verification', recipientEmail, { name, sentAt });
      
      const token = await this.generateVerificationToken(recipientEmail);
      const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`;

      return this.queueEmail({
        to: recipientEmail,
        subject: 'Verify Your Email Address',
        template: VerificationEmail,
        props: { 
          name,
          verificationLink
        },
        metadata: {
          type: 'verification',
          priority: 'high',
          sentAt
        }
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(recipientEmail: string) {
    try {
      this.logEmailTrigger('password_reset', recipientEmail);
      
      const { error } = await this.supabase.auth.resetPasswordForEmail(
        recipientEmail,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
        }
      );

      if (error) throw error;

      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`;
      
      return this.queueEmail({
        to: recipientEmail,
        subject: 'Reset Your Password',
        template: PasswordResetEmail,
        props: { resetLink },
        metadata: {
          type: 'password_reset',
          priority: 'high'
        }
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  async sendNotificationEmail(recipientEmail: string, subject: string, message: string) {
    try {
      this.logEmailTrigger('notification', recipientEmail, { subject });
      
      return this.queueEmail({
        to: recipientEmail,
        subject: subject,
        template: NotificationEmail,
        props: {
          title: subject,
          message: message
        },
        metadata: {
          type: 'notification',
          priority: 'normal'
        }
      });
    } catch (error) {
      console.error('Failed to send notification email:', error);
      throw error;
    }
  }

  private async generateVerificationToken(email: string): Promise<string> {
    // Implement your token generation logic
    return 'verification-token';
  }
}

export const emailService = new EmailService();