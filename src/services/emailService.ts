import { render } from '@react-email/render';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { InvoiceEmail } from '@/app/components/email/templates/InvoiceEmail';
import { StatusChangeEmail } from '@/app/components/email/templates/StatusChangeEmail';
import { NotificationEmail } from '@/app/components/email/templates/NotificationEmail';
import { Invoice } from '@/app/components/types/invoice';
import { emailQueueService } from './emailQueueService';
import { emailTemplates } from './emailTemplates';
import { pdfService } from './pdfService';
import { WelcomeEmail } from '@/app/components/email/templates/WelcomeEmail';
import { VerificationEmail } from '@/app/components/email/templates/VerificationEmail';
import { PasswordResetEmail } from '@/app/components/email/templates/PasswordResetEmail';

export class EmailService {
  private supabase = createClientComponentClient();

  async sendInvoiceEmail(invoice: Invoice, recipientEmail: string) {
    try {
      const [pdfUrl, emailHtml] = await Promise.all([
        pdfService.generateAndStore(invoice),
        render(InvoiceEmail({ invoice, previewMode: false }))
      ]);

      return await emailQueueService.addToQueue({
        to: recipientEmail,
        subject: `Invoice #${invoice.id} Ready for Review`,
        html: emailHtml,
        attachments: [{
          filename: `invoice-${invoice.id}.pdf`,
          path: pdfUrl
        }],
        metadata: {
          type: 'invoice',
          invoiceId: invoice.id,
          priority: 'high'
        }
      });
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      throw error;
    }
  }

  async sendStatusChangeEmail(invoice: Invoice, previousStatus: Invoice['status'], recipientEmail: string) {
    try {
      const emailHtml = await render(
        StatusChangeEmail({ 
          invoice, 
          previousStatus, 
          previewMode: false 
        })
      );

      return await emailQueueService.addToQueue({
        to: recipientEmail,
        subject: `Invoice #${invoice.id} Status Update`,
        html: emailHtml,
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
      const emailHtml = await render(
        NotificationEmail({
          title: 'Payment Confirmation',
          message: `We've received your payment for Invoice #${invoice.id}. Thank you for your business!`,
          additionalDetails: `Amount Paid: $${invoice.amount.toFixed(2)}\nPayment Date: ${new Date().toLocaleDateString()}`,
          actionLabel: 'View Invoice',
          actionLink: `/invoices/${invoice.id}`,
          previewMode: false
        })
      );

      return await emailQueueService.addToQueue({
        to: recipientEmail,
        subject: `Payment Confirmed for Invoice #${invoice.id}`,
        html: emailHtml,
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
      const emailHtml = await render(
        WelcomeEmail({ 
          name,
          previewMode: false 
        })
      )

      return await emailQueueService.addToQueue({
        to: recipientEmail,
        subject: 'Welcome to Our Platform!',
        html: emailHtml,
        metadata: {
          type: 'welcome',
          priority: 'high'
        }
      })
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      throw error
    }
  }

  async sendVerificationEmail(recipientEmail: string, name: string, sentAt?: string) {
    try {
      const token = await this.generateVerificationToken(recipientEmail)
      const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`

      const emailHtml = await render(
        VerificationEmail({ 
          name,
          verificationLink,
          previewMode: false 
        })
      )

      return await emailQueueService.addToQueue({
        to: recipientEmail,
        subject: 'Verify Your Email Address',
        html: emailHtml,
        metadata: {
          type: 'verification',
          priority: 'high',
          sentAt
        }
      })
    } catch (error) {
      console.error('Failed to send verification email:', error)
      throw error
    }
  }

  async sendPasswordResetEmail(recipientEmail: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(
        recipientEmail,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
        }
      )

      if (error) throw error

      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
      const emailHtml = await render(
        PasswordResetEmail({ 
          resetLink,
          previewMode: false 
        })
      )

      return await emailQueueService.addToQueue({
        to: recipientEmail,
        subject: 'Reset Your Password',
        html: emailHtml,
        metadata: {
          type: 'password_reset',
          priority: 'high'
        }
      })
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      throw error
    }
  }

  private async generateVerificationToken(email: string): Promise<string> {
    // Implementation depends on your authentication system
    // For Supabase, you might not need this as they handle verification tokens
    return 'verification-token'
  }
}

export const emailService = new EmailService();