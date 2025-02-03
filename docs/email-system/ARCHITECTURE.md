# Email System Architecture

## Overview
The email system is built with a queue-based architecture to ensure reliable email delivery, tracking, and analytics. It uses Resend for email delivery and Supabase for data storage and tracking.

## Core Components

### 1. Email Queue Service
- Location: `src/services/emailQueueService.ts`
- Purpose: Manages email queue, retry logic, and delivery
- Features:
  - Priority-based queuing
  - Automatic retries (max 3 attempts)
  - Batch processing
  - Error handling
  - Queue cleanup

### 2. Email Templates
- Location: `src/app/components/email/templates/`
- Implementation: React Email components
- Available Templates:
  - InvoiceEmail
  - StatusChangeEmail
  - WelcomeEmail
  - VerificationEmail
  - PasswordResetEmail
  - NotificationEmail

### 3. Email Tracking Service
- Location: `src/services/emailTrackingService.ts`
- Features:
  - Delivery status tracking
  - Open rate tracking
  - Click tracking
  - Analytics collection

### 4. Analytics Dashboard
- Location: `src/app/components/email/EmailAnalyticsDashboard.tsx`
- Features:
  - Real-time analytics
  - Visual data representation
  - Delivery statistics
  - Engagement metrics

## Data Flow
1. Email Trigger → Queue Service
2. Queue Service → Resend API
3. Resend API → Recipient
4. Tracking Events → Analytics Dashboard

## Database Schema
```sql
-- Email Tracking Table
CREATE TABLE email_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id TEXT NOT NULL,
  delivery_status TEXT,
  opened_at TIMESTAMP,
  open_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Click Tracking Table
CREATE TABLE email_click_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id TEXT NOT NULL,
  link_url TEXT NOT NULL,
  clicked_at TIMESTAMP DEFAULT NOW()
);
``` 