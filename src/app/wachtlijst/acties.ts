'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { aanmeldenVoorNest, haalNestOpSlug, reageerOpAanbod, type WachtRij } from '@/lib/wachtlijst/acties';
import { mailRasBevestigen, stuurMail } from '@/lib/wachtlijst/mail';
import { adminClient, isBot, isUuid, leesAanmelding, RASLIJST_RASSEN } from '@/lib/wachtlijst/server';

export type FormStaat = {
  fout?: string;
  klaar?: string;
  waarden?: Record<string, string>;
};

const zonderEmail = (g: { naam: string; woonplaats: string; voorkeur_geslacht: string; voorkeur_vacht: string | null; motivatie: string | null }) => ({
  naam: g.naam, woonplaats: g.woonplaats, voorkeur_geslacht: g.voorkeur_geslacht, voorkeur_vacht: g.voorkeur_vacht, motivatie: g.motivatie,
});

const terug = (f: FormData, fout: string): FormStaat => ({
  fout,
  waarden: Object.fromEntries(
    ['naam', 'email', 'woonplaats', 'voorkeur_geslacht', 'voorkeur_vacht', 'motivatie', 'ras'].map((k) => [k, String(f.get(k) ?? '')]),
  ),
});

// ─── Nestlijst ──────────────────────────────────────────────────

export async function meldAanVoorNest(_: FormStaat, f: FormData): Promise<FormStaat> {
  if (isBot(f)) return { klaar: 'Bedankt voor je aanmelding.' };
  const { gegevens, fout } = leesAanmelding(f);
  if (!gegevens) return terug(f, fout!);
  const nest = await haalNestOpSlug(String(f.get('slug') ?? ''));
  if (!nest) return terug(f, 'Dit nestje bestaat niet meer.');
  const r = await aanmeldenVoorNest(nest, gegevens);
  if (r.fout) return terug(f, r.fout);
  if (r.alBekend) return { klaar: `Je stond al op de wachtlijst voor het nestje van ${nest.moeder_naam}. Kijk in je mail voor de link naar je aanmelding.` };
  redirect(`/wachtlijst/${r.token}?nieuw=1`);
}

export async function wijzigNestAanmelding(_: FormStaat, f: FormData): Promise<FormStaat> {
  const token = String(f.get('token') ?? '');
  if (!isUuid(token)) return { fout: 'Deze link klopt niet.' };
  const { gegevens, fout } = leesAanmelding(f);
  if (!gegevens) return terug(f, fout!);
  const rest = zonderEmail(gegevens); // e-mail blijft gelijk
  const { error } = await adminClient()
    .from('wachtlijst').update(rest).eq('token', token).in('status', ['wachtend', 'aangeboden', 'geaccepteerd']);
  if (error) return terug(f, 'Opslaan lukte niet. Probeer het opnieuw.');
  return { klaar: 'Je gegevens zijn opgeslagen.' };
}

export async function afmeldenNest(f: FormData) {
  const token = String(f.get('token') ?? '');
  if (!isUuid(token)) return;
  const db = adminClient();
  const { data: rij } = await db.from('wachtlijst').select('*').eq('token', token).maybeSingle<WachtRij>();
  if (rij && ['wachtend', 'aangeboden'].includes(rij.status)) {
    if (rij.status === 'aangeboden') await reageerOpAanbod(token, false);
    await db.from('wachtlijst').update({ status: 'afgemeld', gesloten_op: new Date().toISOString() }).eq('id', rij.id);
  }
  revalidatePath(`/wachtlijst/${token}`);
  redirect(`/wachtlijst/${token}`);
}

export async function reageer(f: FormData) {
  const token = String(f.get('token') ?? '');
  if (!isUuid(token)) return;
  const ja = f.get('antwoord') === 'ja';
  const r = await reageerOpAanbod(token, ja);
  const melding = r.fout ? `fout=${encodeURIComponent(r.fout)}` : `antwoord=${ja ? 'ja' : 'nee'}`;
  redirect(`/wachtlijst/${token}?${melding}`);
}

// ─── Raslijst ───────────────────────────────────────────────────

export async function meldAanVoorRas(_: FormStaat, f: FormData): Promise<FormStaat> {
  const klaar = 'Bijna klaar. We hebben je een mail gestuurd. Klik op de knop in die mail om je aanmelding te bevestigen.';
  if (isBot(f)) return { klaar };
  const ras = String(f.get('ras') ?? '');
  if (!RASLIJST_RASSEN.includes(ras)) return terug(f, 'Kies een ras uit de lijst.');
  const { gegevens, fout } = leesAanmelding(f);
  if (!gegevens) return terug(f, fout!);

  const db = adminClient();
  const { data: bestaand } = await db
    .from('wachtlijst_ras').select('id, token, bevestigd_op').eq('ras', ras).eq('email', gegevens.email)
    .maybeSingle<{ id: string; token: string; bevestigd_op: string | null }>();
  if (bestaand?.bevestigd_op) {
    return { klaar: `Je staat al op de raslijst ${ras}. Je krijgt een mail zodra er een nieuw nestje bij komt.` };
  }
  let token = bestaand?.token;
  if (bestaand) {
    await db.from('wachtlijst_ras').update(gegevens).eq('id', bestaand.id);
  } else {
    const { data, error } = await db.from('wachtlijst_ras').insert({ ras, ...gegevens }).select('token').single<{ token: string }>();
    if (error || !data) return terug(f, 'Aanmelden lukte niet. Probeer het over een paar minuten opnieuw.');
    token = data.token;
  }
  const m = mailRasBevestigen({ naam: gegevens.naam, ras, token: token! });
  await stuurMail(gegevens.email, m.onderwerp, m.html);
  return { klaar };
}

/** Bevestigen en verlengen: knop op de pagina (niet de link zelf), zodat virusscanners in mailprogramma's niets per ongeluk bevestigen. */
export async function bevestigOfVerlengRas(f: FormData) {
  const token = String(f.get('token') ?? '');
  if (!isUuid(token)) return;
  const nu = new Date();
  await adminClient()
    .from('wachtlijst_ras')
    .update({ bevestigd_op: nu.toISOString(), geldig_tot: new Date(nu.getTime() + 365 * 864e5).toISOString(), herinnerd_op: null })
    .eq('token', token);
  redirect(`/wachtlijst/ras/${token}?bevestigd=1`);
}

export async function wijzigRasAanmelding(_: FormStaat, f: FormData): Promise<FormStaat> {
  const token = String(f.get('token') ?? '');
  if (!isUuid(token)) return { fout: 'Deze link klopt niet.' };
  const { gegevens, fout } = leesAanmelding(f);
  if (!gegevens) return terug(f, fout!);
  const rest = zonderEmail(gegevens);
  const { error } = await adminClient().from('wachtlijst_ras').update(rest).eq('token', token);
  if (error) return terug(f, 'Opslaan lukte niet. Probeer het opnieuw.');
  return { klaar: 'Je gegevens zijn opgeslagen.' };
}

export async function afmeldenRas(f: FormData) {
  const token = String(f.get('token') ?? '');
  if (!isUuid(token)) return;
  await adminClient().from('wachtlijst_ras').delete().eq('token', token);
  redirect('/wachtlijst/afgemeld');
}

/** Vanuit de raslijst-mail: met je opgeslagen gegevens op de wachtlijst van één nestje. */
export async function meldAanViaRas(f: FormData) {
  const token = String(f.get('token') ?? '');
  const slug = String(f.get('slug') ?? '');
  if (!isUuid(token)) return;
  const { data: r } = await adminClient()
    .from('wachtlijst_ras').select('*').eq('token', token).not('bevestigd_op', 'is', null).maybeSingle();
  const nest = await haalNestOpSlug(slug);
  if (!r || !nest) redirect(`/wachtlijst/ras/${token}`);
  const uitkomst = await aanmeldenVoorNest(
    nest,
    {
      naam: r.naam, email: r.email, woonplaats: r.woonplaats, voorkeur_geslacht: r.voorkeur_geslacht,
      voorkeur_vacht: r.voorkeur_vacht, motivatie: r.motivatie,
    },
    r.id,
  );
  if (uitkomst.fout) redirect(`/wachtlijst/ras/${token}/nestje/${slug}?fout=${encodeURIComponent(uitkomst.fout)}`);
  redirect(`/wachtlijst/${uitkomst.token}?nieuw=1`);
}
