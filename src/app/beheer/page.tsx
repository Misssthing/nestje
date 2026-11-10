import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/controle';
import { aantalKittens, aftelling, dagen, datumNL } from '@/lib/nest';
import { createClient } from '@/lib/supabase/server';
import type { Nest, Profiel } from '@/lib/types';
import { adminClient } from '@/lib/wachtlijst/server';
import NieuwNestje from './NieuwNestje';
import ProfielPaneel from './ProfielPaneel';

export const metadata: Metadata = { title: 'Je nestjes', robots: { index: false } };
export const dynamic = 'force-dynamic';

type NestRij = Nest & { aangemaakt_op: string; afgerond: boolean; kittens: { status: string }[] };

/** Korte stand voor het overzicht, zodat de verkoper ziet wat er met zijn nestje aan de hand is. */
function overzichtLabel(n: NestRij) {
  if (!n.in_overzicht) return { tekst: 'Niet in het overzicht · aanzetten bij Gegevens', aan: false };
  if (n.controle_status === 'aanpassen') return { tekst: '! Aanpassen nodig voor het overzicht', aan: false };
  if (n.controle_status === 'wacht') return { tekst: 'In controle voor het overzicht', aan: false };
  return { tekst: '✓ In het overzicht', aan: true };
}

export default async function Overzicht() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('nests')
    .select('*, kittens(status)')
    .order('afgerond')
    .order('aangemaakt_op', { ascending: false })
    .returns<NestRij[]>();
  const nesten = data ?? [];
  const { data: profiel } = await supabase
    .from('profielen')
    .select('owner_id, slug, naam, intro, zichtbaar, website, facebook, instagram, sinds_jaar, rassen, vereniging')
    .maybeSingle<Profiel>();

  // Alleen voor de beheerder: hoeveel nestjes wachten op controle
  const admin = isAdmin(user.email);
  const { count: teControleren } = admin
    ? await adminClient()
        .from('nests').select('id', { count: 'exact', head: true })
        .eq('controle_status', 'wacht').eq('in_overzicht', true).eq('afgerond', false)
    : { count: 0 };

  if (!nesten.length && !admin) return <NieuwNestje eerste />;

  return (
    <main className="wrap">
      <div className="bar">
        <span className="brand">Nestje</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn ghost klein" href="/kittens">Alle kittens</Link>
          <a className="btn ghost klein" href="/hulp">Hulp</a>
          <form action="/auth/uitloggen" method="post">
            <button className="btn ghost klein">Uitloggen</button>
          </form>
        </div>
      </div>

      {admin && (
        <Link href="/beheer/controle" className="ctl-melding">
          <strong>Controle</strong>
          <span>
            {teControleren
              ? `${teControleren} ${teControleren === 1 ? 'nestje wacht' : 'nestjes wachten'} op controle →`
              : 'Niets te controleren →'}
          </span>
        </Link>
      )}

      <section className="hero">
        <h1>Je nestjes</h1>
      </section>

      <div className="lijst" style={{ marginTop: 22 }}>
        {nesten.map((n) => {
          const a = aftelling(n.geboortedatum, n.verhuisleeftijd_weken);
          const vrij = n.kittens.filter((k) => k.status === 'vrij').length;
          const label = overzichtLabel(n);
          return (
            <Link key={n.id} href={`/beheer/${n.id}`} className={`nestkaart${n.afgerond ? ' is-afgerond' : ''}`}>
              <div>
                <strong>Het nestje van {n.moeder_naam}</strong>
                <span>
                  {a.verwacht
                    ? `Verwacht rond ${datumNL(a.geboren)}`
                    : `${aantalKittens(n.kittens.length)}, geboren ${datumNL(a.geboren)}${n.afgerond ? '' : `, ${vrij} vrij`}`}
                </span>
                {!n.afgerond && (
                  <span className={`overzichtlabel${label.aan ? ' aan' : ''}`}>{label.tekst}</span>
                )}
                <span className="aanpassen-label" aria-hidden="true">✎ Aanpassen ›</span>
              </div>
              <span className={`chip ${n.afgerond ? 'verhuisd' : 'vrij'}`}>
                {n.afgerond
                  ? 'Afgerond'
                  : a.verwacht
                    ? `Over ${dagen(a.dagenTotGeboorte)}`
                    : a.wekenTeGaan > 0
                      ? `Nog ${a.wekenTeGaan} wk`
                      : 'Mag verhuizen'}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="actions">
        <Link className="btn primary" href="/beheer/nieuw">Nieuw nestje</Link>
      </div>

      <div style={{ marginTop: 22 }}>
        <ProfielPaneel profiel={profiel ?? null} />
      </div>
    </main>
  );
}
