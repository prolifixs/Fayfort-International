import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['customer', 'supplier'])
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    
    const supabase = createRouteHandlerClient({ cookies });

    // 1. First create auth user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      }
    });

    if (signUpError) throw signUpError;
    if (!user) throw new Error('No user returned from signup');

    // 2. Then create the public profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        status: 'pending'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Attempt to clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(user.id);
      throw new Error('Failed to create user profile');
    }

    return NextResponse.json({ 
      success: true,
      message: 'Registration successful' 
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed' 
      },
      { status: 500 }
    );
  }
} 