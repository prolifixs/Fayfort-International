import { emailTemplates } from './emailTemplates';
import { emailQueueService } from './emailQueueService';

class EmailService {
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
    const html = emailTemplates.getPasswordResetTemplate(resetLink);
    
    await emailQueueService.addToQueue({
      to: email,
      subject: 'Reset Your Password',
      html
    });
  }

  async sendPasswordResetSuccessEmail(email: string): Promise<void> {
    const html = emailTemplates.getPasswordResetSuccessTemplate();
    
    await emailQueueService.addToQueue({
      to: email,
      subject: 'Password Reset Successful',
      html
    });
  }
}

export const emailService = new EmailService();