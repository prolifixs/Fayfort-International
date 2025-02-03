# Email System Implementation Guide

## Setup & Configuration

### 1. Environment Variables
```env
NEXT_PUBLIC_RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=your_app_url
```

### 2. Required Dependencies
```json
{
  "@react-email/components": "latest",
  "resend": "latest",
  "@supabase/supabase-js": "latest"
}
```

## Usage Guide

### 1. Sending Emails
```typescript
// Example: Sending an invoice email
await emailService.sendInvoiceEmail(invoice, customer.email);

// Example: Sending a status change notification
await emailService.sendStatusChangeEmail(invoice, previousStatus, customer.email);
```

### 2. Creating New Email Templates
1. Create new template in `src/app/components/email/templates/`
2. Extend BaseEmail component
3. Add to emailService.ts
4. Implement tracking

### 3. Queue Management
- Automatic retry for failed emails
- Manual retry available via `emailQueueService.retryEmail(id)`
- Queue monitoring through dashboard

### 4. Analytics Integration
```typescript
// Track email opens
await emailTrackingService.trackOpen(emailId);

// Track link clicks
await emailTrackingService.trackClick(emailId, linkUrl);

// Get analytics data
const analytics = await emailTrackingService.getEmailAnalytics(emailId);
```

## Error Handling
1. Queue Service Errors
2. Template Rendering Errors
3. Delivery Failures
4. Tracking Errors

## Best Practices
1. Always use queue for sending emails
2. Include error handling
3. Implement proper tracking
4. Monitor analytics 