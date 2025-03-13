import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
import { EmailService } from '@/services/emailService';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const role = requestUrl.searchParams.get('role') || 'customer';

    if (!code) {
      throw new Error('No code provided');
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    const { error: authError } = await supabase.auth.exchangeCodeForSession(code);
    if (authError) throw authError;

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Failed to get session after code exchange');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Failed to get user after session exchange');
    }

    if (user) {
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0],
          role: role,
          status: 'pending'
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      try {
        const emailService = new EmailService();
        await emailService.sendWelcomeEmail(
          user.user_metadata?.name || user.email?.split('@')[0],
          user.email!
        );
      } catch (emailError) {
        console.error('Welcome email error:', emailError);
      }
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    const errorType = error instanceof Error ? error.message : 'unknown';
    return NextResponse.redirect(
      new URL(`/login?error=auth_failed&reason=${errorType}`, request.url)
    );
  }
} 