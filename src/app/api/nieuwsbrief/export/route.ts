import { isAdmin } from '@/lib/controle';
import type { NieuwsbriefRij } from '@/lib/nieuwsbrief';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/wachtlijst/server';

export const dynamic = 'force-dynamic';

const cel = (s: string | null) => `"${String(s ?? '').replace(/"/g, '""')}"`;

/** CSV met alle bevestigde, niet afgemelde adressen. Kolommen passen bij de import in Brevo. Alleen voor de beheerder. */
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!isAdmin(data.user?.email)) return new Response('Geen toegang', { status: 403 });

  const { data: rijen } = await adminClient()
    .from('nieuwsbrief')
    .select('email, naam, bron, bevestigd_op, toestemming_tekst')
    .not('bevestigd_op', 'is', null)
    .is('afgemeld_op', null)
    .order('bevestigd_op')
    .returns<Pick<NieuwsbriefRij, 'email' | 'naam' | 'bron' | 'bevestigd_op' | 'toestemming_tekst'>[]>();

  const kop = 'EMAIL;FIRSTNAME;BRON;BEVESTIGD_OP;TOESTEMMING';
  const regels = (rijen ?? []).map((r) =>
    [cel(r.email), cel(r.naam), cel(r.bron), cel(r.bevestigd_op), cel(r.toestemming_tekst)].join(';'),
  );
  const csv = '\uFEFF' + [kop, ...regels].join('\r\n');
  const datum = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="nestje-nieuwsbrief-${datum}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
