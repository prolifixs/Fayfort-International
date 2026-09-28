import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || type !== 'signup') {
      throw new Error('Invalid verification link');
    }

    const supabase = await createSupabaseServerClient();

    // Verify the token with Supabase
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup'
    });

    if (verifyError) throw verifyError;

    // The email is verified at this point. Marking the profile active is up to the database
    // (see docs/SECURITY-REVIEW.md, database rules), because a user may not change their own
    // status; a refusal here must not turn a good verification into an error.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id);

      if (updateError) console.warn('Verify: profile status left to the database:', updateError.code);
    }

    // Redirect to login page with success message
    return NextResponse.redirect(new URL('/login?verified=true', request.url));

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
  }
} 