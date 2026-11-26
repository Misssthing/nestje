import { fotoUrl } from '@/lib/config';
import { aftelling, normaliseerNummer, prijsNL, rasDelen, vandaagISO } from '@/lib/nest';
import {
  mailAanbod, mailAanmeldingOntvangen, mailDoorgeschoven, mailGeaccepteerdKoper, mailGeboren, mailNestVol,
  mailNieuwNestRas, mailRasHerinnering, mailReserveringGeannuleerd, mailVerkoperNieuweAanmelding,
  mailVerkoperOnafgemaakteNestje,
  mailVerkoperReactie, mailVerkoperWachtlijstHerinnering, mailVerwijderdVanWachtlijst, stuurMail,
} from './mail';
import { AANBOD_UREN, adminClient, ALLE_RASSEN, type Aanmelding, verkoperEmail } from './server';

type NestRij = {
  id: string; owner_id: string; slug: string; moeder_naam: string; geboortedatum: string;
  verhuisleeftijd_weken: number; afgerond: boolean; verborgen?: boolean | null;
  moeder_ras: string | null; vader_ras: string | null; stamboom: boolean | null;
  wachtlijst_herinnerd_op?: string | null;
  whatsapp_nummer: string | null;
};
type KittenRij = { id: string; nest_id: string; naam: string; geslacht: 'kater' | 'poes'; vacht: string | null; status: string; notitie?: string | null };
export type WachtRij = {
  id: string; nest_id: string; naam: string; email: string | null; woonplaats: string;
  voorkeur_geslacht: 'kater' | 'poes' | 'geen'; voorkeur_vacht: string | null;
  motivatie: string | null; telefoon: string | null; notitie: string | null; handmatig: boolean;
  aangemeld_op: string; status: 'wachtend' | 'aangeboden' | 'geaccepteerd' | 'afgemeld' | 'gesloten';
  kitten_id: string | null; aanbod_verloopt_op: string | null; geweigerd_aantal: number; token: string;
  geboren_mail_op: string | null;
};

const NEST_VELDEN =
  'id, owner_id, slug, moeder_naam, geboortedatum, verhuisleeftijd_weken, afgerond, verborgen, moeder_ras, vader_ras, stamboom, wachtlijst_herinnerd_op, whatsapp_nummer';
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

/**
 * Hoeveel kittens van dit nestje nu vrij zijn (niet onder optie, niet verhuisd). Gebruikt om te bepalen of
 * rechtstreeks WhatsApp-contact sneller is dan de wachtlijst (zie /n/[slug]/wachtlijst).
 */
export async function telVrijeKittens(nestId: string) {
  const { count } = await db()
    .from('kittens').select('id', { count: 'exact', head: true })
    .eq('nest_id', nestId).eq('status', 'vrij');
  return count ?? 0;
}

/** Eerste foto van een kitten als volledige link, of null. */
export async function eersteFoto(kittenId: string) {
  const { data } = await db()
    .from('kitten_photos').select('storage_path').eq('kitten_id', kittenId).order('volgorde').limit(1).maybeSingle<{ storage_path: string }>();
  return data ? fotoUrl(data.storage_path) : null;
}

// ─── Koper meldt zich aan voor een nestje ───────────────────────

export async function aanmeldenVoorNest(nest: NestRij, g: Aanmelding, viaRasId?: string, telefoon?: string | null) {
  if (!(await nestIsOpen(nest))) return { fout: 'Dit nestje neemt geen aanmeldingen meer aan. Alle kittens hebben al een plek.' };

  const { data: bestaand } = await db()
    .from('wachtlijst').select('id, token')
    .eq('nest_id', nest.id).eq('email', g.email).in('status', ['wachtend', 'aangeboden', 'geaccepteerd'])
    .maybeSingle<{ id: string; token: string }>();
  if (bestaand) return { token: bestaand.token, alBekend: true };

  const { data, error } = await db()
    .from('wachtlijst').insert({ nest_id: nest.id, ...g, telefoon: telefoon ?? null, via_ras_id: viaRasId ?? null })
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
    const v = mailVerkoperNieuweAanmelding({
      nestId: nest.id, moeder: nest.moeder_naam, naam: g.naam, woonplaats: g.woonplaats,
      voorkeur_geslacht: g.voorkeur_geslacht, voorkeur_vacht: g.voorkeur_vacht, motivatie: g.motivatie,
    });
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

/**
 * Verkoper voegt zelf iemand toe die via een ander kanaal (WhatsApp, Marktplaats, mondeling)
 * interesse toonde. Zo iemand heeft nooit zelf iets bij Nestje ingevuld: geen e-mailadres, dus
 * ook nooit automatische mail van Nestje. De verkoper regelt het contact zelf.
 */
export async function toevoegenHandmatig(
  nestId: string,
  ownerId: string,
  g: { naam: string; woonplaats: string; telefoon: string | null; notitie: string | null },
) {
  const nest = await haalNest(nestId);
  if (!nest || nest.owner_id !== ownerId) return { fout: 'Dit nestje hoort niet bij jou.' };
  if (!g.naam.trim()) return { fout: 'Vul een naam in.' };
  const telRuw = g.telefoon?.trim() ?? '';
  const telefoon = telRuw ? normaliseerNummer(telRuw) : null;
  if (telRuw && !telefoon) return { fout: 'Dit telefoonnummer klopt niet. Gebruik bijvoorbeeld 06 12345678.' };

  const { error } = await db().from('wachtlijst').insert({
    nest_id: nest.id,
    naam: g.naam.trim(),
    woonplaats: g.woonplaats.trim(),
    telefoon,
    notitie: g.notitie?.trim() || null,
    email: null,
    voorkeur_geslacht: 'geen',
    handmatig: true,
  });
  if (error) {
    console.error(error);
    return { fout: 'Toevoegen lukte niet. Probeer het opnieuw.' };
  }
  return { ok: true };
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
  if (r.rij.email) {
    const m = mailAanbod({
      naam: r.rij.naam, moeder: r.nest.moeder_naam, kitten: kitten.naam,
      omschrijving: kittenOmschrijving(kitten), token: r.rij.token, verlooptOp,
      slug: r.nest.slug, kittenId: kitten.id, foto: await eersteFoto(kitten.id),
    });
    await stuurMail(r.rij.email, m.onderwerp, m.html);
  }
  return { ok: true };
}

/**
 * Alleen voor zelf toegevoegde (handmatig) aanmeldingen: de verkoper regelt het contact al zelf,
 * dus geen 72-uur-aanbod-met-mail, maar direct een kitten aan haar/hem geven.
 */
export async function reserverenHandmatig(rijId: string, kittenId: string, ownerId: string) {
  const r = await rijVanEigenaar(rijId, ownerId);
  if (!r) return { fout: 'Deze aanmelding hoort niet bij jouw nestjes.' };
  if (!r.rij.handmatig) return { fout: 'Deze actie is alleen voor zelf toegevoegde aanmeldingen.' };
  if (r.rij.status !== 'wachtend') return { fout: 'Je kunt alleen iemand een kitten geven die nog wacht.' };

  const { data: kitten } = await db()
    .from('kittens').update({ status: 'gereserveerd' })
    .eq('id', kittenId).eq('nest_id', r.nest.id).eq('status', 'vrij')
    .select('id, naam').maybeSingle<{ id: string; naam: string }>();
  if (!kitten) return { fout: 'Dit kitten is niet meer vrij. Ververs de pagina.' };

  const { error } = await db()
    .from('wachtlijst').update({ status: 'geaccepteerd', kitten_id: kitten.id, aanbod_verloopt_op: null })
    .eq('id', r.rij.id).eq('status', 'wachtend');
  if (error) {
    await db().from('kittens').update({ status: 'vrij' }).eq('id', kitten.id).eq('status', 'gereserveerd');
    return { fout: 'Reserveren lukte niet. Probeer het opnieuw.' };
  }
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

  if (r.rij.email) {
    const { count } = await db()
      .from('wachtlijst').select('id', { count: 'exact', head: true })
      .eq('nest_id', naar.id).eq('email', r.rij.email).in('status', ['wachtend', 'aangeboden', 'geaccepteerd']);
    if (count) return { fout: `${r.rij.naam} staat al op de wachtlijst van dat nestje.` };
  }

  // nest_id verandert, aangemeld_op blijft: de plek gaat mee.
  const { error } = await db()
    .from('wachtlijst').update({ nest_id: naar.id, geboren_mail_op: null }).eq('id', r.rij.id).eq('status', 'wachtend');
  if (error) return { fout: 'Doorschuiven lukte niet. Probeer het opnieuw.' };
  if (r.rij.email) {
    const m = mailDoorgeschoven({
      naam: r.rij.naam, vanMoeder: r.nest.moeder_naam, naarMoeder: naar.moeder_naam, naarSlug: naar.slug, token: r.rij.token,
    });
    await stuurMail(r.rij.email, m.onderwerp, m.html);
  }
  return { ok: true };
}

export async function verwijderen(rijId: string, ownerId: string) {
  const r = await rijVanEigenaar(rijId, ownerId);
  if (!r) return { fout: 'Deze aanmelding hoort niet bij jouw nestjes.' };
  if (r.rij.status === 'aangeboden') await aanbodTerug(r.rij, false);
  await db().from('wachtlijst').update({ status: 'afgemeld', gesloten_op: new Date().toISOString() }).eq('id', r.rij.id);
  if (r.rij.email) {
    const m = mailVerwijderdVanWachtlijst({ naam: r.rij.naam, moeder: r.nest.moeder_naam });
    await stuurMail(r.rij.email, m.onderwerp, m.html);
  }
  return { ok: true };
}

/**
 * Reservering gaat niet door. Het kitten gaat terug naar Vrij (als het op Gereserveerd stond)
 * en de koper komt terug op de wachtlijst met zijn oude plek, of gaat van de lijst af.
 */
export async function reserveringAnnuleren(rijId: string, ownerId: string, terugOpLijst: boolean) {
  const r = await rijVanEigenaar(rijId, ownerId);
  if (!r) return { fout: 'Deze aanmelding hoort niet bij jouw nestjes.' };
  if (r.rij.status !== 'geaccepteerd') return { fout: 'Er is geen reservering om te annuleren.' };

  let kittenNaam = 'het kitten';
  if (r.rij.kitten_id) {
    const { data: k } = await db().from('kittens').select('naam').eq('id', r.rij.kitten_id).maybeSingle<{ naam: string }>();
    if (k) kittenNaam = k.naam;
    await db().from('kittens').update({ status: 'vrij' }).eq('id', r.rij.kitten_id).eq('status', 'gereserveerd');
  }
  await db()
    .from('wachtlijst')
    .update(
      terugOpLijst
        ? { status: 'wachtend', kitten_id: null, aanbod_verloopt_op: null }
        : { status: 'afgemeld', gesloten_op: new Date().toISOString() },
    )
    .eq('id', r.rij.id);

  if (r.rij.email) {
    const m = mailReserveringGeannuleerd({
      naam: r.rij.naam, moeder: r.nest.moeder_naam, kitten: kittenNaam, slug: r.nest.slug, token: r.rij.token, terugOpLijst,
    });
    await stuurMail(r.rij.email, m.onderwerp, m.html);
  }
  return { ok: true };
}

// ─── Reactie van de koper op een aanbod ─────────────────────────

export async function reageerOpAanbod(token: string, ja: boolean) {
  const { data: rij } = await db().from('wachtlijst').select('*').eq('token', token).maybeSingle<WachtRij>();
  if (!rij || rij.status !== 'aangeboden' || !rij.kitten_id) return { fout: 'Dit aanbod staat niet meer open.' };
  const nest = await haalNest(rij.nest_id);
  const { data: kitten } = await db()
    .from('kittens').select('id, nest_id, naam, geslacht, vacht, status, notitie').eq('id', rij.kitten_id).maybeSingle<KittenRij>();
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
    // Notitie (alleen voor de verkoper zichtbaar) vullen met de gegevens van de koper, maar alleen als er nog niets in stond.
    if (!kitten.notitie) {
      const notitie = `Via wachtlijst: ${rij.naam}, ${rij.woonplaats}, ${rij.email}`;
      await db().from('kittens').update({ notitie }).eq('id', kitten.id);
    }
    if (rij.email) {
      const mk = mailGeaccepteerdKoper({ naam: rij.naam, moeder: nest.moeder_naam, kitten: kitten.naam, slug: nest.slug, verkoperEmail: ve });
      await stuurMail(rij.email, mk.onderwerp, mk.html, ve ?? undefined);
    }
    if (ve) {
      const mv = mailVerkoperReactie({ nestId: nest.id, moeder: nest.moeder_naam, naam: rij.naam, kitten: kitten.naam, soort: 'ja' });
      await stuurMail(ve, mv.onderwerp, mv.html, rij.email ?? undefined);
    }
    return { ok: true, kitten: kitten.naam };
  }

  await aanbodTerug(rij, true);
  if (ve) {
    const mv = mailVerkoperReactie({ nestId: nest.id, moeder: nest.moeder_naam, naam: rij.naam, kitten: kitten.naam, soort: 'nee' });
    await stuurMail(ve, mv.onderwerp, mv.html);
  }
  return { ok: true, kitten: kitten.naam };
}

async function verlopenAfhandelen(rij: WachtRij, nest: NestRij, kitten: KittenRij | null) {
  await aanbodTerug(rij, true);
  const ve = await verkoperEmail(nest.owner_id);
  if (ve) {
    const mv = mailVerkoperReactie({ nestId: nest.id, moeder: nest.moeder_naam, naam: rij.naam, kitten: kitten?.naam ?? 'het kitten', soort: 'verlopen' });
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
    if (rij.aangemeld_op.slice(0, 10) < nest.geboortedatum && rij.email) {
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
      if (rij.email) {
        const m = mailNestVol({ naam: rij.naam, moeder: nest.moeder_naam, ras, alternatieven });
        await stuurMail(rij.email, m.onderwerp, m.html);
      }
      await db().from('wachtlijst').update({ status: 'gesloten', gesloten_op: new Date().toISOString() }).eq('id', rij.id);
      n++;
    }
    await db().from('nests').update({ vol_mail_op: new Date().toISOString() }).eq('id', id);
  }
  return n;
}

/** Na hoeveel dagen zonder reactie de verkoper een herinnering krijgt over wachtende kopers. */
const WACHTLIJST_HERINNERING_NA_DAGEN = 5;
const ONAFGEMAAKT_HERINNERING_NA_UUR = 24;

/**
 * Nestjes waar de verkoper mee is begonnen maar halverwege is gestopt: nog geen kitten toegevoegd,
 * of kittens zonder foto's. 24 uur na aanmaken krijgt de verkoper daar één keer een vriendelijke
 * herinnering over (nooit vaker). Nestjes die nog moeten geboren worden slaan we over: daar kunnen
 * nog helemaal geen kittens of foto's zijn, dus "onafgemaakt" is dan geen eerlijke conclusie. We
 * markeren die ook niet als herinnerd, zodat ze na de geboorte alsnog in aanmerking komen.
 */
export async function onafgemaakteNestjes() {
  const drempel = new Date(Date.now() - ONAFGEMAAKT_HERINNERING_NA_UUR * 36e5).toISOString();
  const { data: kandidaten } = await db()
    .from('nests')
    .select('id, owner_id, slug, moeder_naam, geboortedatum')
    .lt('aangemaakt_op', drempel)
    .eq('afgerond', false)
    .is('onafgemaakt_herinnerd_op', null)
    .returns<{ id: string; owner_id: string; slug: string; moeder_naam: string; geboortedatum: string }[]>();

  let n = 0;
  for (const nest of kandidaten ?? []) {
    if (new Date(nest.geboortedatum).getTime() > Date.now()) continue; // nog niet geboren: nog geen foto's te verwachten

    const { data: kittens } = await db()
      .from('kittens').select('id, kitten_photos(id)').eq('nest_id', nest.id)
      .returns<{ id: string; kitten_photos: { id: string }[] }[]>();
    const rij = kittens ?? [];
    const compleetGenoeg = rij.length > 0 && rij.every((k) => k.kitten_photos.length > 0);
    if (compleetGenoeg) continue; // verder dan "halverwege gestopt"; geen herinnering en niet markeren

    const ve = await verkoperEmail(nest.owner_id);
    if (ve) {
      const m = mailVerkoperOnafgemaakteNestje({ nestId: nest.id, moeder: nest.moeder_naam });
      await stuurMail(ve, m.onderwerp, m.html);
      n++;
    }
    await db().from('nests').update({ onafgemaakt_herinnerd_op: new Date().toISOString() }).eq('id', nest.id);
  }
  return n;
}

/**
 * Herinnert een verkoper als er al een tijdje kopers op de wachtlijst van een nestje staan
 * zonder dat er een aanbod is gedaan. Stuurt per nestje hooguit één keer per
 * WACHTLIJST_HERINNERING_NA_DAGEN dagen, zolang de situatie niet verandert.
 */
export async function wachtlijstHerinneringen() {
  const nu = Date.now();
  const drempel = new Date(nu - WACHTLIJST_HERINNERING_NA_DAGEN * 864e5).toISOString();
  const { data: wachtend } = await db()
    .from('wachtlijst').select('nest_id, aangemeld_op').eq('status', 'wachtend').lt('aangemeld_op', drempel);
  const per = new Map<string, { aantal: number; oudste: string }>();
  for (const r of wachtend ?? []) {
    const huidig = per.get(r.nest_id);
    if (!huidig || r.aangemeld_op < huidig.oudste) per.set(r.nest_id, { aantal: (huidig?.aantal ?? 0) + 1, oudste: r.aangemeld_op });
    else huidig.aantal += 1;
  }
  let n = 0;
  for (const [nestId, { aantal, oudste }] of per) {
    const nest = await haalNest(nestId);
    if (!nest || nest.afgerond) continue;
    if (nest.wachtlijst_herinnerd_op && nest.wachtlijst_herinnerd_op > drempel) continue;
    const ve = await verkoperEmail(nest.owner_id);
    if (ve) {
      const oudsteDagen = Math.max(1, Math.round((nu - new Date(oudste).getTime()) / 864e5));
      const m = mailVerkoperWachtlijstHerinnering({ nestId: nest.id, moeder: nest.moeder_naam, aantal, oudsteDagen });
      await stuurMail(ve, m.onderwerp, m.html);
      n++;
    }
    await db().from('nests').update({ wachtlijst_herinnerd_op: new Date(nu).toISOString() }).eq('id', nest.id);
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
    if (!o || o.stamboom !== true) continue; // label "met stamboom" alleen met organisatie, cattery en vader
    const rassen = rassenVan(o);
    const { data: lijst } = await db()
      .from('wachtlijst_ras').select('id, rassen, naam, email, token')
      .not('bevestigd_op', 'is', null).gt('geldig_tot', new Date().toISOString());
    const regel = regelVoor(o);
    const gehad = new Set<string>();
    for (const r of lijst ?? []) {
      const zijnRassen = (r.rassen as string[]).map((x) => x.toLowerCase());
      const matcht = zijnRassen.includes(ALLE_RASSEN.toLowerCase()) || zijnRassen.some((x) => rassen.includes(x));
      if (!matcht) continue;
      const sleutel = String(r.email).toLowerCase();
      if (gehad.has(sleutel)) continue; // iemand op twee raslijsten krijgt één mail
      const rasDelenAlle = [...new Map([...rasDelen(o.moeder_ras), ...rasDelen(o.vader_ras)].map((x) => [x.toLowerCase(), x])).values()];
      const weergaveRas = rasDelenAlle.join(' × ') || 'raskat';
      gehad.add(sleutel);
      const m = mailNieuwNestRas({ naam: r.naam, ras: weergaveRas, token: r.token, moeder: o.moeder_naam, slug: o.slug, regel });
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
    .from('wachtlijst_ras').select('id, rassen, naam, email, token, geldig_tot')
    .not('bevestigd_op', 'is', null).is('herinnerd_op', null).lt('geldig_tot', overMaand);
  for (const r of bijna ?? []) {
    const m = mailRasHerinnering({ naam: r.naam, rassen: r.rassen as string[], token: r.token, tot: new Date(r.geldig_tot) });
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

