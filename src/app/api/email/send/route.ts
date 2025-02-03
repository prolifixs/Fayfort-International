// Create a new API route: src/app/api/email/send/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: body.to,
      subject: body.subject,
      html: body.html,
      attachments: body.attachments
    });

    if (error) throw error;

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' }, 
      { status: 500 }
    );
  }
}