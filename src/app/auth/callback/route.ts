import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { EmailService } from '@/services/emailService';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (!code) {
      throw new Error('No code provided');
    }

    const supabase = await createSupabaseServerClient();
    
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
      // Creates the profile of someone signing in for the first time, as a customer. An existing
      // profile is left alone: a role never comes from the sign-in link (it used to take ?role=
      // from the URL, so anyone could ask for admin), and is granted only in app_metadata.
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0],
          role: 'customer',
          status: 'pending'
        }, {
          onConflict: 'id',
          ignoreDuplicates: true
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