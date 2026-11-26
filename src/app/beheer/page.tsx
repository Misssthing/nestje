import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/controle';
import { aantalKittens, aftelling, dagen, datumNL } from '@/lib/nest';
import { createClient } from '@/lib/supabase/server';
import type { Nest, Profiel } from '@/lib/types';
import { adminClient } from '@/lib/wachtlijst/server';
import AppIcoonTip from '@/components/AppIcoonTip';
import SlimmeFoto from '@/components/SlimmeFoto';
import { fotoThumbUrl } from '@/lib/config';
import NieuwNestje from './NieuwNestje';
import ProfielPaneel from './ProfielPaneel';

export const metadata: Metadata = { title: 'Je nestjes', robots: { index: false } };
export const dynamic = 'force-dynamic';

type NestRij = Nest & {
  aangemaakt_op: string;
  afgerond: boolean;
  kittens: { status: string }[];
  nest_photos: { storage_path: string; volgorde: number }[];
};

/** Eerste nestfoto (laagste volgorde), voor het duimnageltje in het overzicht. */
function coverFoto(n: NestRij): string | null {
  if (!n.nest_photos.length) return null;
  return [...n.nest_photos].sort((a, b) => a.volgorde - b.volgorde)[0].storage_path;
}

/** Korte stand voor het overzicht, zodat de verkoper ziet wat er met zijn nestje aan de hand is. */
function overzichtLabel(n: NestRij) {
  if (!n.in_overzicht) return { tekst: 'Niet in het overzicht · aanzetten bij Gegevens', aan: false };
  if (n.controle_status === 'aanpassen') return { tekst: '! Aanpassen nodig voor het overzicht', aan: false };
  if (n.controle_status === 'wacht') return { tekst: 'In controle voor het overzicht', aan: false };
  return { tekst: '✓ In het overzicht', aan: true };
}

/** Aantal geüploade testuitslagen dat nog op de beheerder wacht. */
async function aantalUitslagen() {
  const db = adminClient();
  const wacht = [{ status: 'wacht' }];
  const [m, v] = await Promise.all([
    db.from('nests').select('id', { count: 'exact', head: true }).contains('moeder_testen', wacht),
    db.from('nests').select('id', { count: 'exact', head: true }).contains('vader_testen', wacht),
  ]);
  return (m.count ?? 0) + (v.count ?? 0);
}

export default async function Overzicht() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('nests')
    .select('*, kittens(status), nest_photos(storage_path, volgorde)')
    .order('afgerond')
    .order('aangemaakt_op', { ascending: false })
    .returns<NestRij[]>();
  const nesten = data ?? [];
  const { data: profiel } = await supabase
    .from('profielen')
    .select('owner_id, slug, naam, foto, intro, zichtbaar, website, facebook, instagram, sinds_jaar, rassen, vereniging')
    .maybeSingle<Profiel>();

  // Alleen voor de beheerder: hoeveel nestjes wachten op controle
  const admin = isAdmin(user.email);
  const { count: teControleren } = admin
    ? await adminClient()
        .from('nests').select('id', { count: 'exact', head: true })
        .eq('controle_status', 'wacht').eq('in_overzicht', true).eq('afgerond', false)
    : { count: 0 };
  const uitslagen = admin ? await aantalUitslagen() : 0;
  const { count: nieuwsbriefAantal } = admin
    ? await adminClient()
        .from('nieuwsbrief').select('id', { count: 'exact', head: true })
        .not('bevestigd_op', 'is', null).is('afgemeld_op', null)
    : { count: 0 };

  if (!nesten.length && !admin) return <NieuwNestje eerste />;

  return (
    <main className="wrap breed">
      <div className="bar">
        <span className="brand">Nestje</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn ghost klein" href="/kittens">Alle kittens</Link>
          <a className="btn ghost klein" href="/handboek">Handboek</a>
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
            {teControleren || uitslagen
              ? `${[
                  teControleren ? `${teControleren} ${teControleren === 1 ? 'nestje' : 'nestjes'}` : '',
                  uitslagen ? `${uitslagen} ${uitslagen === 1 ? 'testuitslag' : 'testuitslagen'}` : '',
                ].filter(Boolean).join(' en ')} te bekijken →`
              : 'Niets te controleren →'}
          </span>
        </Link>
      )}

      {admin && (
        <Link href="/beheer/nieuwsbrief" className="ctl-melding">
          <strong>Nieuwsbrief</strong>
          <span>
            {nieuwsbriefAantal
              ? `${nieuwsbriefAantal} ${nieuwsbriefAantal === 1 ? 'aanmelding' : 'aanmeldingen'} →`
              : 'Nog geen aanmeldingen →'}
          </span>
        </Link>
      )}

      {admin && (
        <Link href="/beheer/zoeken" className="ctl-melding">
          <strong>Nestjes zoeken</strong>
          <span>Zoek een nestje van wie dan ook op naam of link →</span>
        </Link>
      )}

      <section className="hero">
        <h1>Je nestjes</h1>
      </section>

      <AppIcoonTip />

      <div className="lijst" style={{ marginTop: 22 }}>
        {nesten.map((n) => {
          const a = aftelling(n.geboortedatum, n.verhuisleeftijd_weken);
          const vrij = n.kittens.filter((k) => k.status === 'vrij').length;
          const label = overzichtLabel(n);
          const foto = coverFoto(n);
          return (
            <Link key={n.id} href={`/beheer/${n.id}`} className={`nestkaart${n.afgerond ? ' is-afgerond' : ''}`}>
              <div className="nestkaart-info">
                {foto ? (
                  <SlimmeFoto className="nestkaart-foto" src={fotoThumbUrl(foto)} alt="" />
                ) : (
                  <div className="nestkaart-foto placeholder" aria-hidden="true">{n.moeder_naam.charAt(0).toUpperCase()}</div>
                )}
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
                  <span>👁 {n.weergaven ? `${n.weergaven} keer bekeken` : 'Nog niet bekeken'}</span>
                  <span className="aanpassen-label" aria-hidden="true">✎ Aanpassen ›</span>
                </div>
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
        <Link className="btn primary" href="/beheer/nieuw">+ Nieuw nestje</Link>
      </div>

      <div style={{ marginTop: 22 }}>
        <ProfielPaneel profiel={profiel ?? null} />
      </div>
    </main>
  );
}
