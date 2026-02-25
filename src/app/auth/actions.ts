'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

function resolveBaseUrl(hostHeader: string | null) {
  if (env.APP_BASE_URL) return env.APP_BASE_URL;
  if (!hostHeader) return 'http://localhost:3000';
  const proto = hostHeader.includes('localhost') ? 'http' : 'https';
  return `${proto}://${hostHeader}`;
}

export async function requestOtpAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  if (!email) {
    redirect('/auth/login?error=missing_email');
  }

  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const baseUrl = resolveBaseUrl(headerStore.get('host'));

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback`
    }
  });

  if (error) {
    redirect('/auth/login?error=otp_send_failed');
  }

  redirect('/auth/login?success=check_email');
}
