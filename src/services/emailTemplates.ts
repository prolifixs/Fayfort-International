interface TemplateData {
  [key: string]: string | number;
}

class EmailTemplates {
  private readonly templates = {
    invoice: (data: TemplateData) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    .container {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .button {
      background-color: #3b82f6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      display: inline-block;
      margin: 20px 0;
    }
    .details {
      background-color: #f3f4f6;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Invoice Ready for Review</h2>
    <p>Hello,</p>
    <p>Your invoice #${data.invoiceId} has been generated and is ready for review.</p>
    
    <div class="details">
      <p>Amount Due: $${data.amount}</p>
      <p>Due Date: ${data.dueDate}</p>
    </div>
    
    <a href="${data.viewLink}" class="button">View Invoice</a>
    
    <div class="footer">
      <p>This email was sent by ${data.appName}</p>
      <p>Time: ${data.timestamp}</p>
    </div>
  </div>
</body>
</html>
    `,

    statusChange: (data: TemplateData) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    .container {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .button {
      background-color: #3b82f6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      display: inline-block;
      margin: 20px 0;
    }
    .status-update {
      background-color: #f3f4f6;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Invoice Status Update</h2>
    <p>Hello,</p>
    <p>The status of your invoice #${data.invoiceId} has been updated.</p>
    
    <div class="status-update">
      <p>Previous Status: ${data.previousStatus}</p>
      <p>New Status: ${data.newStatus}</p>
      <p>Amount: $${data.amount}</p>
    </div>
    
    <a href="${data.viewLink}" class="button">View Invoice</a>
    
    <div class="footer">
      <p>This email was sent by ${data.appName}</p>
      <p>Time: ${data.timestamp}</p>
    </div>
  </div>
</body>
</html>
    `,

    passwordReset: (data: TemplateData) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    .container {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .button {
      background-color: #3b82f6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      display: inline-block;
      margin: 20px 0;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Password</h2>
    <p>Hello,</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    
    <a href="${data.resetLink}" class="button">Reset Password</a>
    
    <p>If you didn't request this, you can safely ignore this email.</p>
    <p>This link will expire in 1 hour.</p>
    
    <div class="footer">
      <p>This email was sent by ${data.appName}</p>
      <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
      <p>${data.resetLink}</p>
    </div>
  </div>
</body>
</html>
    `
  };

  getInvoiceTemplate(invoice: any): string {
    return this.templates.invoice({
      invoiceId: invoice.id,
      amount: invoice.amount.toFixed(2),
      dueDate: new Date(invoice.due_date).toLocaleDateString(),
      viewLink: `${window.location.origin}/invoices/${invoice.id}`,
      appName: 'FayfortEnterprise',
      timestamp: new Date().toLocaleString()
    });
  }

  getStatusChangeTemplate(invoice: any, previousStatus: string): string {
    return this.templates.statusChange({
      invoiceId: invoice.id,
      previousStatus,
      newStatus: invoice.status,
      amount: invoice.amount.toFixed(2),
      viewLink: `${window.location.origin}/invoices/${invoice.id}`,
      appName: 'FayfortEnterprise',
      timestamp: new Date().toLocaleString()
    });
  }

  getPasswordResetTemplate(resetLink: string): string {
    return this.templates.passwordReset({
      resetLink,
      appName: 'FayfortEnterprise',
      timestamp: new Date().toLocaleString()
    });
  }

  getPasswordResetSuccessTemplate() {
    return `
      <h1>Password Reset Successful</h1>
      <p>Your password has been successfully reset.</p>
      <p>If you did not make this change, please contact support immediately.</p>
    `;
  }
}

export const emailTemplates = new EmailTemplates(); 