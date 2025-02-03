# Email System Troubleshooting Guide

## Common Issues & Solutions

### 1. Email Not Sending
#### Symptoms
- Email stuck in queue
- No delivery confirmation
- Error in console

#### Solutions
1. Check Resend API key
2. Verify queue service is running
3. Check email format
4. Review error logs

### 2. Template Rendering Issues
#### Symptoms
- Blank emails
- Missing content
- Styling problems

#### Solutions
1. Verify template syntax
2. Check data passing
3. Validate HTML structure
4. Test preview mode

### 3. Tracking Not Working
#### Symptoms
- No analytics data
- Missing open/click events
- Incorrect statistics

#### Solutions
1. Check database connection
2. Verify tracking implementation
3. Review tracking endpoints
4. Clear tracking cache

## Monitoring & Maintenance

### 1. Queue Monitoring
```typescript
// Check queue status
const queueStatus = emailQueueService.getQueueStatus();

// Monitor failed emails
const failedEmails = emailQueueService.getFailedEmails();
```

### 2. Performance Optimization
- Regular queue cleanup
- Batch processing optimization
- Database index maintenance
- Cache management

### 3. Error Logging
- Check application logs
- Monitor error reporting service
- Review tracking analytics
- Audit email delivery status

## Emergency Procedures

### 1. Queue Recovery
```typescript
// Clear stuck queue
await emailQueueService.clearQueue();

// Reset processing status
await emailQueueService.resetProcessingStatus();
```

### 2. Manual Retries
```typescript
// Retry failed email
await emailQueueService.retryEmail(emailId);

// Retry all failed emails
await emailQueueService.retryAllFailed();
``` 