import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Inloggen', robots: { index: false } };

export default async function LoginPagina({ searchParams }: { searchParams: Promise<{ fout?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/beheer');
  const { fout } = await searchParams;

  return (
    <main className="wrap tekst">
      <div className="bar">
        <Link href="/" className="brand">Nestje</Link>
      </div>
      <h1>Inloggen</h1>
      <p>Geen wachtwoord nodig. Je krijgt een mail met een inloglink en een code.</p>
      {fout && <p className="fout">De inloglink is verlopen of al gebruikt. Vraag hieronder een nieuwe aan.</p>}
      <LoginForm />
    </main>
  );
}
