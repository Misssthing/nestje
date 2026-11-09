import { fotoUrl } from '@/lib/config';
import { aftelling, prijsNL, rasDelen, vandaagISO } from '@/lib/nest';
import {
  mailAanbod, mailAanmeldingOntvangen, mailDoorgeschoven, mailGeaccepteerdKoper, mailGeboren, mailNestVol,
  mailNieuwNestRas, mailRasHerinnering, mailVerkoperNieuweAanmelding, mailVerkoperReactie, stuurMail,
} from './mail';
import { AANBOD_UREN, adminClient, type Aanmelding, verkoperEmail } from './server';

type NestRij = {
  id: string; owner_id: string; slug: string; moeder_naam: string; geboortedatum: string;
  verhuisleeftijd_weken: number; afgerond: boolean; verborgen?: boolean | null;
  moeder_ras: string | null; vader_ras: string | null; stamboom: boolean | null;
};
type KittenRij = { id: string; nest_id: string; naam: string; geslacht: 'kater' | 'poes'; vacht: string | null; status: string };
export type WachtRij = {
  id: string; nest_id: string; naam: string; email: string; woonplaats: string;
  voorkeur_geslacht: 'kater' | 'poes' | 'geen'; voorkeur_vacht: string | null; motivatie: string | null;
  aangemeld_op: string; status: 'wachtend' | 'aangeboden' | 'geaccepteerd' | 'afgemeld' | 'gesloten';
  kitten_id: string | null; aanbod_verloopt_op: string | null; geweigerd_aantal: number; token: string;
  geboren_mail_op: string | null;
};

const NEST_VELDEN = 'id, owner_id, slug, moeder_naam, geboortedatum, verhuisleeftijd_weken, afgerond, verborgen, moeder_ras, vader_ras, stamboom';
const db = () => adminClient();

const kittenOmschrijving = (k: KittenRij) => `${k.geslacht === 'kater' ? 'kater' : 'poes'}${k.vacht ? `, ${k.vacht}` : ''}`;

export async function haalNest(id: string) {
  const { data } = await db().from('nests').select(NEST_VELDEN).eq('id', id).maybeSingle<NestRij>();
  return data;
}

export async function haalNestOpSlug(slug: string) {
  const { data } = await db().from('nests').select(NEST_VELDEN).eq('slug', slug).maybeSingle<NestRij>();
  return data;
}

/** Kun je je nog aanmelden? Verwacht nestje, of geboren met nog kittens vrij of onder optie. */
export async function nestIsOpen(nest: NestRij) {
  if (nest.afgerond || nest.verborgen) return false;
  if (aftelling(nest.geboortedatum, nest.verhuisleeftijd_weken).verwacht) return true;
  const { count } = await db()
    .from('kittens').select('id', { count: 'exact', head: true })
    .eq('nest_id', nest.id).in('status', ['vrij', 'optie']);
  return (count ?? 0) > 0;
}

/** Eerste foto van een kitten als volledige link, of null. */
export async function eersteFoto(kittenId: string) {
  const { data } = await db()
    .from('kitten_photos').select('storage_path').eq('kitten_id', kittenId).order('volgorde').limit(1).maybeSingle<{ storage_path: string }>();
  return data ? fotoUrl(data.storage_path) : null;
}

// ─── Koper meldt zich aan voor een nestje ───────────────────────

export async function aanmeldenVoorNest(nest: NestRij, g: Aanmelding, viaRasId?: string) {
  if (!(await nestIsOpen(nest))) return { fout: 'Dit nestje neemt geen aanmeldingen meer aan. Alle kittens hebben al een plek.' };

  const { data: bestaand } = await db()
    .from('wachtlijst').select('id, token')
    .eq('nest_id', nest.id).eq('email', g.email).in('status', ['wachtend', 'aangeboden', 'geaccepteerd'])
    .maybeSingle<{ id: string; token: string }>();
  if (bestaand) return { token: bestaand.token, alBekend: true };

  const { data, error } = await db()
    .from('wachtlijst').insert({ nest_id: nest.id, ...g, via_ras_id: viaRasId ?? null })
    .select('token').single<{ token: string }>();
  if (error || !data) {
    console.error(error);
    return { fout: 'Aanmelden lukte niet. Probeer het over een paar minuten opnieuw.' };
  }

  const verwacht = aftelling(nest.geboortedatum, nest.verhuisleeftijd_weken).verwacht;
  const m = mailAanmeldingOntvangen({ naam: g.naam, moeder: nest.moeder_naam, slug: nest.slug, token: data.token, verwacht });
  await stuurMail(g.email, m.onderwerp, m.html);
  const ve = await verkoperEmail(nest.owner_id);
  if (ve) {
    const v = mailVerkoperNieuweAanmelding({ moeder: nest.moeder_naam, naam: g.naam, woonplaats: g.woonplaats });
    await stuurMail(ve, v.onderwerp, v.html, g.email);
  }
  return { token: data.token };
}

// ─── Acties van de verkoper (altijd met controle op eigenaar) ───

async function rijVanEigenaar(rijId: string, ownerId: string) {
  const { data: rij } = await db().from('wachtlijst').select('*').eq('id', rijId).maybeSingle<WachtRij>();
  if (!rij) return null;
  const nest = await haalNest(rij.nest_id);
  if (!nest || nest.owner_id !== ownerId) return null;
  return { rij, nest };
}

export async function aanbieden(rijId: string, kittenId: string, ownerId: string) {
  const r = await rijVanEigenaar(rijId, ownerId);
  if (!r) return { fout: 'Deze aanmelding hoort niet bij jouw nestjes.' };
  if (r.rij.status !== 'wachtend') return { fout: 'Je kunt alleen iemand een kitten aanbieden die nog wacht.' };

  // Kitten van vrij naar optie, alleen als het echt nog vrij is en bij dit nestje hoort.
  const { data: kitten } = await db()
    .from('kittens').update({ status: 'optie' })
    .eq('id', kittenId).eq('nest_id', r.nest.id).eq('status', 'vrij')
    .select('id, nest_id, naam, geslacht, vacht, status').maybeSingle<KittenRij>();
  if (!kitten) return { fout: 'Dit kitten is niet meer vrij. Ververs de pagina.' };

  const verlooptOp = new Date(Date.now() + AANBOD_UREN * 3600e3);
  const { error } = await db()
    .from('wachtlijst').update({ status: 'aangeboden', kitten_id: kitten.id, aanbod_verloopt_op: verlooptOp.toISOString() })
    .eq('id', r.rij.id).eq('status', 'wachtend');
  if (error) {
    await db().from('kittens').update({ status: 'vrij' }).eq('id', kitten.id).eq('status', 'optie');
    return { fout: 'Aanbieden lukte niet. Probeer het opnieuw.' };
  }
  const m = mailAanbod({
    naam: r.rij.naam, moeder: r.nest.moeder_naam, kitten: kitten.naam,
    omschrijving: kittenOmschrijving(kitten), token: r.rij.token, verlooptOp,
    slug: r.nest.slug, kittenId: kitten.id, foto: await eersteFoto(kitten.id),
  });
  await stuurMail(r.rij.email, m.onderwerp, m.html);
  return { ok: true };
}

/** Aanbod terug naar de wachtlijst: bij weigeren, verlopen of intrekken. Kitten weer vrij als het nog onder optie stond. */
async function aanbodTerug(rij: WachtRij, meetellen: boolean) {
  await db()
    .from('wachtlijst')
    .update({
      status: 'wachtend', kitten_id: null, aanbod_verloopt_op: null,
      ...(meetellen ? { geweigerd_aantal: rij.geweigerd_aantal + 1 } : {}),
    })
    .eq('id', rij.id).eq('status', 'aangeboden');
  if (rij.kitten_id) await db().from('kittens').update({ status: 'vrij' }).eq('id', rij.kitten_id).eq('status', 'optie');
}

export async function intrekken(rijId: string, ownerId: string) {
  const r = await rijVanEigenaar(rijId, ownerId);
  if (!r) return { fout: 'Deze aanmelding hoort niet bij jouw nestjes.' };
  if (r.rij.status !== 'aangeboden') return { fout: 'Er staat geen aanbod open.' };
  await aanbodTerug(r.rij, false);
  return { ok: true };
}

export async function doorschuiven(rijId: string, naarNestId: string, ownerId: string) {
  const r = await rijVanEigenaar(rijId, ownerId);
  if (!r) return { fout: 'Deze aanmelding hoort niet bij jouw nestjes.' };
  if (r.rij.status !== 'wachtend') return { fout: 'Je kunt alleen iemand doorschuiven die nog wacht.' };
  const naar = await haalNest(naarNestId);
  if (!naar || naar.owner_id !== ownerId || naar.id === r.nest.id) return { fout: 'Kies een ander nestje van jezelf.' };
  if (!(await nestIsOpen(naar))) return { fout: 'Dat nestje neemt geen aanmeldingen meer aan.' };

  const { count } = await db()
    .from('wachtlijst').select('id', { count: 'exact', head: true })
    .eq('nest_id', naar.id).eq('email', r.rij.email).in('status', ['wachtend', 'aangeboden', 'geaccepteerd']);
  if (count) return { fout: `${r.rij.naam} staat al op de wachtlijst van dat nestje.` };

  // nest_id verandert, aangemeld_op blijft: de plek gaat mee.
  const { error } = await db()
    .from('wachtlijst').update({ nest_id: naar.id, geboren_mail_op: null }).eq('id', r.rij.id).eq('status', 'wachtend');
  if (error) return { fout: 'Doorschuiven lukte niet. Probeer het opnieuw.' };
  const m = mailDoorgeschoven({
    naam: r.rij.naam, vanMoeder: r.nest.moeder_naam, naarMoeder: naar.moeder_naam, naarSlug: naar.slug, token: r.rij.token,
  });
  await stuurMail(r.rij.email, m.onderwerp, m.html);
  return { ok: true };
}

export async function verwijderen(rijId: string, ownerId: string) {
  const r = await rijVanEigenaar(rijId, ownerId);
  if (!r) return { fout: 'Deze aanmelding hoort niet bij jouw nestjes.' };
  if (r.rij.status === 'aangeboden') await aanbodTerug(r.rij, false);
  await db().from('wachtlijst').update({ status: 'afgemeld', gesloten_op: new Date().toISOString() }).eq('id', r.rij.id);
  return { ok: true };
}

// ─── Reactie van de koper op een aanbod ─────────────────────────

export async function reageerOpAanbod(token: string, ja: boolean) {
  const { data: rij } = await db().from('wachtlijst').select('*').eq('token', token).maybeSingle<WachtRij>();
  if (!rij || rij.status !== 'aangeboden' || !rij.kitten_id) return { fout: 'Dit aanbod staat niet meer open.' };
  const nest = await haalNest(rij.nest_id);
  const { data: kitten } = await db()
    .from('kittens').select('id, nest_id, naam, geslacht, vacht, status').eq('id', rij.kitten_id).maybeSingle<KittenRij>();
  if (!nest || !kitten) return { fout: 'Dit aanbod staat niet meer open.' };

  if (rij.aanbod_verloopt_op && new Date(rij.aanbod_verloopt_op) < new Date()) {
    await verlopenAfhandelen(rij, nest, kitten);
    return { fout: 'De 72 uur om te reageren zijn voorbij. Je staat nog wel op de wachtlijst.' };
  }

  const ve = await verkoperEmail(nest.owner_id);
  if (ja) {
    const { data: gelukt } = await db()
      .from('kittens').update({ status: 'gereserveerd' }).eq('id', kitten.id).eq('status', 'optie').select('id').maybeSingle();
    if (!gelukt) {
      await aanbodTerug(rij, false);
      return { fout: 'De verkoper heeft dit kitten intussen anders ingedeeld. Je staat nog wel op de wachtlijst.' };
    }
    await db().from('wachtlijst').update({ status: 'geaccepteerd', aanbod_verloopt_op: null }).eq('id', rij.id);
    const mk = mailGeaccepteerdKoper({ naam: rij.naam, moeder: nest.moeder_naam, kitten: kitten.naam, slug: nest.slug, verkoperEmail: ve });
    await stuurMail(rij.email, mk.onderwerp, mk.html, ve ?? undefined);
    if (ve) {
      const mv = mailVerkoperReactie({ moeder: nest.moeder_naam, naam: rij.naam, kitten: kitten.naam, soort: 'ja' });
      await stuurMail(ve, mv.onderwerp, mv.html, rij.email);
    }
    return { ok: true, kitten: kitten.naam };
  }

  await aanbodTerug(rij, true);
  if (ve) {
    const mv = mailVerkoperReactie({ moeder: nest.moeder_naam, naam: rij.naam, kitten: kitten.naam, soort: 'nee' });
    await stuurMail(ve, mv.onderwerp, mv.html);
  }
  return { ok: true, kitten: kitten.naam };
}

async function verlopenAfhandelen(rij: WachtRij, nest: NestRij, kitten: KittenRij | null) {
  await aanbodTerug(rij, true);
  const ve = await verkoperEmail(nest.owner_id);
  if (ve) {
    const mv = mailVerkoperReactie({ moeder: nest.moeder_naam, naam: rij.naam, kitten: kitten?.naam ?? 'het kitten', soort: 'verlopen' });
    await stuurMail(ve, mv.onderwerp, mv.html);
  }
}

/** Alle verlopen aanbiedingen afhandelen; eventueel alleen voor de nestjes van één verkoper. */
export async function verlopenAanbiedingen(nestIds?: string[]) {
  let q = db().from('wachtlijst').select('*').eq('status', 'aangeboden').lt('aanbod_verloopt_op', new Date().toISOString());
  if (nestIds) q = q.in('nest_id', nestIds);
  const { data } = await q.returns<WachtRij[]>();
  for (const rij of data ?? []) {
    const nest = await haalNest(rij.nest_id);
    if (!nest) continue;
    const { data: kitten } = rij.kitten_id
      ? await db().from('kittens').select('id, nest_id, naam, geslacht, vacht, status').eq('id', rij.kitten_id).maybeSingle<KittenRij>()
      : { data: null };
    await verlopenAfhandelen(rij, nest, kitten);
  }
  return data?.length ?? 0;
}

// ─── Dagelijkse taken (cron) ────────────────────────────────────

/** "De kittens zijn geboren" voor wie zich vóór de geboorte aanmeldde. */
export async function geborenMails() {
  const vandaag = vandaagISO();
  const { data } = await db()
    .from('wachtlijst').select('*').eq('status', 'wachtend').is('geboren_mail_op', null).returns<WachtRij[]>();
  let n = 0;
  const nesten = new Map<string, { nest: NestRij | null; aantal: number }>();
  for (const rij of data ?? []) {
    if (!nesten.has(rij.nest_id)) {
      const nest = await haalNest(rij.nest_id);
      const { count } = await db().from('kittens').select('id', { count: 'exact', head: true }).eq('nest_id', rij.nest_id);
      nesten.set(rij.nest_id, { nest, aantal: count ?? 0 });
    }
    const { nest, aantal } = nesten.get(rij.nest_id)!;
    if (!nest || nest.geboortedatum > vandaag || aantal === 0) continue;
    // Alleen wie zich vóór de geboortedatum aanmeldde; anderen markeren we zonder mail.
    if (rij.aangemeld_op.slice(0, 10) < nest.geboortedatum) {
      const m = mailGeboren({ naam: rij.naam, moeder: nest.moeder_naam, slug: nest.slug, token: rij.token, aantal });
      await stuurMail(rij.email, m.onderwerp, m.html);
      n++;
    }
    await db().from('wachtlijst').update({ geboren_mail_op: new Date().toISOString() }).eq('id', rij.id);
  }
  return n;
}

function regelVoor(n: { geboortedatum: string; verhuisleeftijd_weken: number; woonplaats?: string | null; vrij?: number; prijs?: number | null }) {
  const a = aftelling(n.geboortedatum, n.verhuisleeftijd_weken);
  const delen = [
    n.woonplaats,
    a.verwacht ? 'verwacht nestje' : `${n.vrij ?? 0} vrij`,
    a.verwacht ? '' : a.wekenTeGaan > 0 ? `verhuizen over ${a.wekenTeGaan} wk` : 'mogen verhuizen',
    n.prijs ? prijsNL(Number(n.prijs)) : '',
  ];
  return delen.filter(Boolean).join(' · ');
}

const rassenVan = (n: { moeder_ras: string | null; vader_ras: string | null }) =>
  [...new Set([...rasDelen(n.moeder_ras), ...rasDelen(n.vader_ras)].map((r) => r.toLowerCase()))];

type OverzichtRij = {
  slug: string; moeder_naam: string; woonplaats: string | null; moeder_ras: string | null; vader_ras: string | null;
  stamboom: boolean | null; geboortedatum: string; verhuisleeftijd_weken: number; prijs: number | null; vrij: number;
};

/** Nestje vol of afgerond: wachtenden krijgen één mail met alternatieven, daarna sluit de lijst. */
export async function volMails() {
  const { data: wachtend } = await db().from('wachtlijst').select('nest_id').eq('status', 'wachtend');
  const nestIds = [...new Set((wachtend ?? []).map((r) => r.nest_id as string))];
  let n = 0;
  for (const id of nestIds) {
    const nest = await haalNest(id);
    if (!nest) continue;
    if (!nest.afgerond && (await nestIsOpen(nest))) continue;

    const rassen = nest.stamboom ? rassenVan(nest) : [];
    const ras = rassen.length === 1 ? rasDelen(nest.moeder_ras || nest.vader_ras)[0] ?? null : null;
    const { data: overzicht } = await db()
      .from('openbare_overzicht').select('slug, moeder_naam, woonplaats, moeder_ras, vader_ras, stamboom, geboortedatum, verhuisleeftijd_weken, prijs, vrij')
      .neq('slug', nest.slug).gt('vrij', 0).limit(200).returns<OverzichtRij[]>();
    const alternatieven = (overzicht ?? [])
      .filter((o) => (rassen.length ? o.stamboom && rassenVan(o).some((r) => rassen.includes(r)) : true))
      .slice(0, 3)
      .map((o) => ({ slug: o.slug, moeder: o.moeder_naam, regel: regelVoor(o) }));

    const { data: rijen } = await db().from('wachtlijst').select('*').eq('nest_id', id).eq('status', 'wachtend').returns<WachtRij[]>();
    for (const rij of rijen ?? []) {
      const m = mailNestVol({ naam: rij.naam, moeder: nest.moeder_naam, ras, alternatieven });
      await stuurMail(rij.email, m.onderwerp, m.html);
      await db().from('wachtlijst').update({ status: 'gesloten', gesloten_op: new Date().toISOString() }).eq('id', rij.id);
      n++;
    }
    await db().from('nests').update({ vol_mail_op: new Date().toISOString() }).eq('id', id);
  }
  return n;
}

/** Nieuwe nestjes met stamboom in het overzicht: mail naar bevestigde aanmeldingen op de raslijst van dat ras. */
export async function rasMails() {
  const { data: nieuw } = await db().from('nests').select('id, slug').is('ras_mail_op', null).eq('stamboom', true);
  let n = 0;
  for (const { id, slug } of nieuw ?? []) {
    // Alleen als het nestje echt in het openbare overzicht staat (dan voldoet het aan de stamboomregels).
    const { data: o } = await db()
      .from('openbare_overzicht').select('slug, moeder_naam, woonplaats, moeder_ras, vader_ras, stamboom, geboortedatum, verhuisleeftijd_weken, prijs, vrij')
      .eq('slug', slug).maybeSingle<OverzichtRij>();
    if (!o) continue;
    const rassen = rassenVan(o);
    const { data: lijst } = await db()
      .from('wachtlijst_ras').select('id, ras, naam, email, token')
      .not('bevestigd_op', 'is', null).gt('geldig_tot', new Date().toISOString());
    const regel = regelVoor(o);
    const gehad = new Set<string>();
    for (const r of lijst ?? []) {
      if (!rassen.includes(String(r.ras).toLowerCase())) continue;
      const sleutel = String(r.email).toLowerCase();
      if (gehad.has(sleutel)) continue; // iemand op twee raslijsten krijgt één mail
      gehad.add(sleutel);
      const m = mailNieuwNestRas({ naam: r.naam, ras: r.ras, token: r.token, moeder: o.moeder_naam, slug: o.slug, regel });
      await stuurMail(r.email, m.onderwerp, m.html);
      n++;
    }
    await db().from('nests').update({ ras_mail_op: new Date().toISOString() }).eq('id', id);
  }
  return n;
}

/** Raslijst: herinnering een maand voor het verlopen, en opruimen wat verlopen of nooit bevestigd is. */
export async function rasOnderhoud() {
  const nu = new Date();
  const overMaand = new Date(nu.getTime() + 30 * 864e5).toISOString();
  const { data: bijna } = await db()
    .from('wachtlijst_ras').select('id, ras, naam, email, token, geldig_tot')
    .not('bevestigd_op', 'is', null).is('herinnerd_op', null).lt('geldig_tot', overMaand);
  for (const r of bijna ?? []) {
    const m = mailRasHerinnering({ naam: r.naam, ras: r.ras, token: r.token, tot: new Date(r.geldig_tot) });
    await stuurMail(r.email, m.onderwerp, m.html);
    await db().from('wachtlijst_ras').update({ herinnerd_op: nu.toISOString() }).eq('id', r.id);
  }
  await db().from('wachtlijst_ras').delete().lt('geldig_tot', nu.toISOString());
  await db().from('wachtlijst_ras').delete().is('bevestigd_op', null).lt('aangemaakt_op', new Date(nu.getTime() - 7 * 864e5).toISOString());
  // Aanmeldingen bij afgeronde nestjes sluiten (ook wie ja zei), en alles wat 3 maanden gesloten is verwijderen (AVG).
  const { data: open } = await db().from('wachtlijst').select('id, nest_id').is('gesloten_op', null);
  const afgerond = new Map<string, boolean>();
  for (const r of open ?? []) {
    if (!afgerond.has(r.nest_id)) afgerond.set(r.nest_id, Boolean((await haalNest(r.nest_id))?.afgerond));
    if (afgerond.get(r.nest_id)) await db().from('wachtlijst').update({ gesloten_op: nu.toISOString() }).eq('id', r.id);
  }
  await db().from('wachtlijst').delete().not('gesloten_op', 'is', null).lt('gesloten_op', new Date(nu.getTime() - 92 * 864e5).toISOString());
  return bijna?.length ?? 0;
}

