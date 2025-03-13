import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'
export const runtime = 'edge' // Optional: if you want to use edge runtime

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || type !== 'signup') {
      throw new Error('Invalid verification link');
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Verify the token with Supabase
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup'
    });

    if (verifyError) throw verifyError;

    // Get the user and update their status
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id);

      if (updateError) throw updateError;
    }

    // Redirect to login page with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/login?verified=true`
    );

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=verification_failed`
    );
  }
} 