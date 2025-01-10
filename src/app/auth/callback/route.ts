import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (!code) {
      throw new Error('No code provided');
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    const { error: authError } = await supabase.auth.exchangeCodeForSession(code);
    if (authError) throw authError;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    if (user) {
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0],
          role: user.user_metadata?.role || 'customer',
          status: 'pending'
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Profile error:', profileError);
      }
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=auth_failed', request.url)
    );
  }
} 