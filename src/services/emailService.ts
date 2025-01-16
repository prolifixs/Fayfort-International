import { render } from '@react-email/render';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { InvoiceEmail } from '@/app/components/email/templates/InvoiceEmail';
import { StatusChangeEmail } from '@/app/components/email/templates/StatusChangeEmail';
import { Invoice } from '@/app/components/types/invoice';
import { emailQueueService } from './emailQueueService';
import { emailTemplates } from './emailTemplates';
import { pdfService } from './pdfService';

export class EmailService {
  private supabase = createClientComponentClient();

  async sendInvoiceEmail(invoice: Invoice, recipientEmail: string) {
    try {
      // Only initialize email components when needed
      const emailHtml = await render(InvoiceEmail({ invoice }));
      
      // Add to queue via API route instead of direct Resend call
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: `Invoice #${invoice.id} Ready for Review`,
          html: emailHtml,
          attachments: [{
            filename: `invoice_${invoice.id}.pdf`,
            path: invoice.pdf_url
          }]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to queue email');
      }

      const { emailId } = await response.json();
      
      // Log email activity
      await this.supabase
        .from('email_logs')
        .insert({
          type: 'invoice_email',
          recipient: recipientEmail,
          invoice_id: invoice.id,
          email_id: emailId,
          status: 'queued'
        });

      return emailId;
    } catch (error) {
      console.warn('Email service error:', error);
      return null;
    }
  }

  async sendStatusChangeEmail(
    invoice: Invoice, 
    previousStatus: 'draft' | 'sent' | 'paid' | 'cancelled', 
    recipientEmail: string
  ) {
    try {
      const emailHtml = await render(StatusChangeEmail({ invoice, previousStatus }));
      
      return await emailQueueService.addToQueue({
        to: recipientEmail,
        subject: `Invoice #${invoice.id} Status Updated`,
        html: emailHtml
      });
    } catch (error) {
      console.warn('Status change email error:', error);
      return null;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    try {
      const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
      const html = emailTemplates.getPasswordResetTemplate(resetLink);
      
      return await emailQueueService.addToQueue({
        to: email,
        subject: 'Reset Your Password',
        html
      });
    } catch (error) {
      console.warn('Password reset email error:', error);
      return null;
    }
  }

  async sendPasswordResetSuccessEmail(email: string) {
    try {
      const html = emailTemplates.getPasswordResetSuccessTemplate();
      
      return await emailQueueService.addToQueue({
        to: email,
        subject: 'Password Reset Successful',
        html
      });
    } catch (error) {
      console.warn('Password reset success email error:', error);
      return null;
    }
  }
}

export const emailService = new EmailService();