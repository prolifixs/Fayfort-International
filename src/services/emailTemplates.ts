interface TemplateData {
  [key: string]: string;
}

class EmailTemplates {
  private readonly templates = {
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
    `,

    passwordResetSuccess: (data: TemplateData) => `
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
    <h2>Password Successfully Reset</h2>
    <p>Hello,</p>
    <p>Your password has been successfully reset.</p>
    <p>If you didn't make this change, please contact our support team immediately.</p>
    
    <div class="footer">
      <p>This email was sent by ${data.appName}</p>
      <p>Time: ${data.timestamp}</p>
    </div>
  </div>
</body>
</html>
    `
  };

  getPasswordResetTemplate(resetLink: string): string {
    return this.templates.passwordReset({
      resetLink,
      appName: 'FayfortEnterprise'
    });
  }

  getPasswordResetSuccessTemplate(): string {
    return this.templates.passwordResetSuccess({
      appName: 'FayfortEnterprise',
      timestamp: new Date().toLocaleString()
    });
  }
}

export const emailTemplates = new EmailTemplates(); 