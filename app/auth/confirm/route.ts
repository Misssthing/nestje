import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Verwerkt de inloglink uit de mail (token_hash) of een PKCE-code. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const volgende = searchParams.get('next');
  const doel = volgende && volgende.startsWith('/') && !volgende.startsWith('//') ? volgende : '/beheer';

  const supabase = await createClient();
  let gelukt = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    gelukt = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    gelukt = !error;
  }

  return NextResponse.redirect(new URL(gelukt ? doel : '/login?fout=1', request.url));
}
