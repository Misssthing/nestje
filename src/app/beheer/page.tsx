import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { aantalKittens, aftelling, datumNL } from '@/lib/nest';
import { createClient } from '@/lib/supabase/server';
import type { Nest, Profiel } from '@/lib/types';
import NieuwNestje from './NieuwNestje';
import ProfielPaneel from './ProfielPaneel';

export const metadata: Metadata = { title: 'Je nestjes', robots: { index: false } };
export const dynamic = 'force-dynamic';

type NestRij = Nest & { aangemaakt_op: string; afgerond: boolean; kittens: { status: string }[] };

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
    .select('owner_id, slug, naam, intro, zichtbaar')
    .maybeSingle<Profiel>();

  if (!nesten.length) return <NieuwNestje eerste />;

  return (
    <main className="wrap">
      <div className="bar">
        <span className="brand">Nestje</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="btn ghost klein" href="/hulp">Hulp</a>
          <form action="/auth/uitloggen" method="post">
            <button className="btn ghost klein">Uitloggen</button>
          </form>
        </div>
      </div>

      <section className="hero">
        <h1>Je nestjes</h1>
      </section>

      <div className="lijst" style={{ marginTop: 22 }}>
        {nesten.map((n) => {
          const a = aftelling(n.geboortedatum, n.verhuisleeftijd_weken);
          const vrij = n.kittens.filter((k) => k.status === 'vrij').length;
          return (
            <Link key={n.id} href={`/beheer/${n.id}`} className={`nestkaart${n.afgerond ? ' is-afgerond' : ''}`}>
              <div>
                <strong>Het nestje van {n.moeder_naam}</strong>
                <span>
                  {aantalKittens(n.kittens.length)}, geboren {datumNL(a.geboren)}
                  {n.afgerond ? '' : `, ${vrij} vrij`}
                </span>
              </div>
              <span className={`chip ${n.afgerond ? 'verhuisd' : 'vrij'}`}>
                {n.afgerond ? 'Afgerond' : a.wekenTeGaan > 0 ? `Nog ${a.wekenTeGaan} wk` : 'Mag verhuizen'}
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
