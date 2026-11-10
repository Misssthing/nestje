import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Uitloggen en daarna naar het overzicht met alle kittens (niet naar de promopagina). */
async function uitloggen(req: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303: na het formulier (POST) gaat de browser met een gewone GET naar /kittens
  return NextResponse.redirect(new URL('/kittens', req.url), { status: 303 });
}

export const POST = uitloggen;
export const GET = uitloggen;
