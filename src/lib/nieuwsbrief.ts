import { NIEUWSBRIEF_VINKTEKST } from './nieuwsbrief-tekst';
import { mailNieuwsbriefBevestigen, stuurMail } from './wachtlijst/mail';
import { adminClient } from './wachtlijst/server';

/**
 * Nieuwsbrief met dubbele opt-in.
 *  1. De koper zet het vinkje aan (staat standaard uit).
 *  2. Pas na bevestiging via de mail telt de aanmelding (bevestigd_op).
 *  3. Is BREVO_NIEUWSBRIEF_LIJST ingesteld in Vercel, dan zet Nestje bevestigde adressen
 *     automatisch in die Brevo-lijst. Zo niet, dan download je ze als CSV in het beheer.
 */

export type NieuwsbriefRij = {
  id: string;
  email: string;
  naam: string | null;
  bron: 'nestlijst' | 'raslijst';
  toestemming_tekst: string;
  aangevraagd_op: string;
  bevestigd_op: string | null;
  afgemeld_op: string | null;
  in_brevo_op: string | null;
  token: string;
};

const lijstId = () => {
  const id = Number(process.env.BREVO_NIEUWSBRIEF_LIJST);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/** Zet een bevestigd adres in de Brevo-lijst. Lukt dat niet, dan blijft het adres gewoon in Nestje staan. */
export async function naarBrevo(rij: Pick<NieuwsbriefRij, 'id' | 'email' | 'naam'>) {
  const id = lijstId();
  const sleutel = process.env.BREVO_API_KEY;
  if (!id || !sleutel) return false;
  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'api-key': sleutel, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      email: rij.email,
      attributes: rij.naam ? { FIRSTNAME: rij.naam } : {},
      listIds: [id],
      updateEnabled: true,
    }),
  });
  if (!res.ok) {
    console.error('Brevo-contact mislukt', res.status, await res.text().catch(() => ''));
    return false;
  }
  await adminClient().from('nieuwsbrief').update({ in_brevo_op: new Date().toISOString() }).eq('id', rij.id);
  return true;
}

async function uitBrevo(email: string) {
  const id = lijstId();
  const sleutel = process.env.BREVO_API_KEY;
  if (!id || !sleutel) return;
  await fetch(`https://api.brevo.com/v3/contacts/lists/${id}/contacts/remove`, {
    method: 'POST',
    headers: { 'api-key': sleutel, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ emails: [email] }),
  }).catch(() => undefined);
}

/**
 * Vraagt de nieuwsbrief aan. Staat iemand er al bevestigd op, dan gebeurt er niets.
 * stuurBevestiging: false als de bevestiging meeloopt met een andere bevestiging (de raslijst).
 */
export async function nieuwsbriefAanvragen(
  o: { email: string; naam: string | null; bron: 'nestlijst' | 'raslijst' },
  { stuurBevestiging }: { stuurBevestiging: boolean },
) {
  const db = adminClient();
  const email = o.email.trim().toLowerCase();
  const { data: bestaand } = await db
    .from('nieuwsbrief').select('*').eq('email', email).maybeSingle<NieuwsbriefRij>();

  if (bestaand?.bevestigd_op && !bestaand.afgemeld_op) return;

  let token = bestaand?.token;
  const velden = {
    naam: o.naam,
    bron: o.bron,
    toestemming_tekst: NIEUWSBRIEF_VINKTEKST,
    aangevraagd_op: new Date().toISOString(),
    bevestigd_op: null,
    afgemeld_op: null,
  };
  if (bestaand) {
    await db.from('nieuwsbrief').update(velden).eq('id', bestaand.id);
  } else {
    const { data, error } = await db
      .from('nieuwsbrief').insert({ email, ...velden }).select('token').single<{ token: string }>();
    if (error || !data) {
      console.error('Nieuwsbrief opslaan mislukt', error?.message);
      return;
    }
    token = data.token;
  }

  if (stuurBevestiging && token) {
    const m = mailNieuwsbriefBevestigen({ naam: o.naam, token });
    await stuurMail(email, m.onderwerp, m.html);
  }
}

/** Bevestigen via de knop op /nieuwsbrief/[token]. */
export async function bevestigNieuwsbrief(token: string) {
  const { data: rij } = await adminClient()
    .from('nieuwsbrief')
    .update({ bevestigd_op: new Date().toISOString(), afgemeld_op: null })
    .eq('token', token)
    .select('id, email, naam')
    .maybeSingle<Pick<NieuwsbriefRij, 'id' | 'email' | 'naam'>>();
  if (rij) await naarBrevo(rij);
  return Boolean(rij);
}

/** Meebevestigen als de koper zijn raslijst bevestigt (zelfde e-mailadres, net aangetoond). */
export async function bevestigNieuwsbriefVoorEmail(email: string) {
  const { data: rij } = await adminClient()
    .from('nieuwsbrief')
    .update({ bevestigd_op: new Date().toISOString() })
    .eq('email', email.trim().toLowerCase())
    .is('bevestigd_op', null)
    .is('afgemeld_op', null)
    .select('id, email, naam')
    .maybeSingle<Pick<NieuwsbriefRij, 'id' | 'email' | 'naam'>>();
  if (rij) await naarBrevo(rij);
}

/** Afmelden via de pagina. Brevo heeft daarnaast zijn eigen afmeldlink in elke nieuwsbrief. */
export async function afmeldenNieuwsbrief(token: string) {
  const { data: rij } = await adminClient()
    .from('nieuwsbrief')
    .update({ afgemeld_op: new Date().toISOString(), naam: null })
    .eq('token', token)
    .select('email')
    .maybeSingle<{ email: string }>();
  if (rij) await uitBrevo(rij.email);
}

export const brevoGekoppeld = () => Boolean(lijstId() && process.env.BREVO_API_KEY);
