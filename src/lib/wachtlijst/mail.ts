import { CONFIG } from '@/lib/config';

/**
 * Mails versturen via Brevo (dezelfde dienst als de inlogmails).
 * Nodig in Vercel: BREVO_API_KEY. Het afzenderadres moet in Brevo geverifieerd zijn.
 */
const AFZENDER = { name: 'Nestje', email: 'nestje@kattenverzorging.com' };

export async function stuurMail(aan: string, onderwerp: string, html: string, antwoordAan?: string) {
  const sleutel = process.env.BREVO_API_KEY;
  if (!sleutel) {
    console.error('BREVO_API_KEY ontbreekt; mail niet verstuurd:', onderwerp);
    return false;
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': sleutel, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: AFZENDER,
      to: [{ email: aan }],
      subject: onderwerp,
      htmlContent: html,
      ...(antwoordAan ? { replyTo: { email: antwoordAan } } : {}),
    }),
  });
  if (!res.ok) console.error('Brevo-fout', res.status, await res.text().catch(() => ''));
  return res.ok;
}

export function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export const url = (pad: string) => `${CONFIG.siteUrl}${pad}`;

/** Eenvoudige, nette opmaak die in elke mailapp werkt. Alleen veilige (ge-escapete) tekst erin stoppen. */
function opmaak(kop: string, alineas: string[], knop?: { tekst: string; href: string }, voet?: string) {
  const p = alineas.map((a) => `<p style="margin:0 0 14px;line-height:1.5">${a}</p>`).join('');
  const b = knop
    ? `<p style="margin:22px 0"><a href="${knop.href}" style="background:#1F2A24;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;display:inline-block">${esc(knop.tekst)}</a></p>`
    : '';
  const v = voet ? `<p style="margin:24px 0 0;font-size:13px;color:#5E6B63;line-height:1.5">${voet}</p>` : '';
  return `<!doctype html><html lang="nl"><body style="margin:0;background:#EEF1EC;padding:24px 12px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1F2A24">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px 24px">
<p style="margin:0 0 18px"><img src="${url('/logo-nestje-mail.png')}" alt="Nestje" width="115" height="32" style="display:block;height:32px;width:auto;border:0" /></p>
<h1 style="font-size:22px;line-height:1.25;margin:0 0 16px">${esc(kop)}</h1>${p}${b}${v}
</div>
<p style="max-width:520px;margin:14px auto 0;font-size:12px;color:#5E6B63;line-height:1.5;text-align:center">
Volg ons op <a href="https://www.instagram.com/nestjespagina/" style="color:#5E6B63">Instagram: @nestjespagina</a><br>
Nestje is onderdeel van <a href="https://www.kattenverzorging.com/" style="color:#5E6B63">kattenverzorging.com</a>
</p></body></html>`;
}

const beheerVoet = (token: string) =>
  `Gegevens wijzigen of afmelden? <a href="${url(`/wachtlijst/${token}`)}" style="color:#1F2A24">Bekijk je aanmelding</a>.`;
const rasVoet = (token: string) =>
  `Gegevens wijzigen of geen mails meer? <a href="${url(`/wachtlijst/ras/${token}`)}" style="color:#1F2A24">Bekijk je aanmelding</a>.`;

// ─── Mails aan kopers: nestlijst ───────────────────────────────

export function mailAanmeldingOntvangen(o: { naam: string; moeder: string; slug: string; token: string; verwacht: boolean }) {
  return {
    onderwerp: `Je staat op de wachtlijst voor het nestje van ${o.moeder}`,
    html: opmaak(
      `Je staat op de wachtlijst`,
      [
        `Hoi ${esc(o.naam)},`,
        `Je hebt je aangemeld voor het nestje van ${esc(o.moeder)}. De verkoper ziet je aanmelding en kiest zelf wie een kitten krijgt aangeboden.`,
        o.verwacht
          ? 'De kittens zijn nog niet geboren. Je krijgt een mail zodra ze er zijn.'
          : 'Krijg je een kitten aangeboden, dan ontvang je een mail. Je hebt dan 72 uur om te reageren.',
      ],
      { tekst: 'Bekijk het nestje', href: url(`/n/${o.slug}`) },
      beheerVoet(o.token),
    ),
  };
}

export function mailGeboren(o: { naam: string; moeder: string; slug: string; token: string; aantal: number }) {
  return {
    onderwerp: `De kittens van ${o.moeder} zijn geboren`,
    html: opmaak(
      `De kittens zijn geboren`,
      [
        `Hoi ${esc(o.naam)},`,
        `Goed nieuws: ${esc(o.moeder)} heeft ${o.aantal === 1 ? '1 kitten' : `${o.aantal} kittens`} gekregen. Je staat nog steeds op de wachtlijst.`,
        'De verkoper laat je weten als er een kitten voor je is. Op de nestjespagina zie je de foto’s en hoe oud ze zijn.',
      ],
      { tekst: 'Bekijk de kittens', href: url(`/n/${o.slug}`) },
      beheerVoet(o.token),
    ),
  };
}

export function mailAanbod(o: {
  naam: string; moeder: string; kitten: string; omschrijving: string; token: string; verlooptOp: Date;
  slug: string; kittenId: string; foto: string | null;
}) {
  const tot = o.verlooptOp.toLocaleString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam',
  });
  const kittenLink = url(`/n/${o.slug}#kitten-${o.kittenId}`);
  const foto = o.foto
    ? `<a href="${kittenLink}"><img src="${o.foto}" alt="${esc(o.kitten)}" width="472" style="display:block;width:100%;max-width:472px;height:auto;border-radius:14px;margin:0 0 6px" /></a>`
    : '';
  return {
    onderwerp: `Er is een kitten voor je: ${o.kitten}`,
    html: opmaak(
      `Er is een kitten voor je`,
      [
        `Hoi ${esc(o.naam)},`,
        `De verkoper van het nestje van ${esc(o.moeder)} biedt je <strong>${esc(o.kitten)}</strong> aan (${esc(o.omschrijving)}).`,
        ...(foto ? [foto] : []),
        `<a href="${kittenLink}" style="color:#1F2A24;font-weight:600">Bekijk ${esc(o.kitten)} en de rest van het nestje →</a>`,
        `Laat vóór <strong>${esc(tot)}</strong> weten of je dit kitten wilt. Daarna kan de verkoper het aan iemand anders aanbieden.`,
        'Zeg je nee, dan blijf je gewoon op de wachtlijst staan.',
      ],
      { tekst: 'Ja of nee zeggen', href: url(`/wachtlijst/${o.token}`) },
      'Kom altijd eerst kijken bij het kitten en de moeder, en betaal nooit vooruit aan iemand die je niet hebt ontmoet.',
    ),
  };
}

export function mailGeaccepteerdKoper(o: { naam: string; moeder: string; kitten: string; slug: string; verkoperEmail: string | null }) {
  return {
    onderwerp: `${o.kitten} is voor je gereserveerd`,
    html: opmaak(
      `${o.kitten} is voor je gereserveerd`,
      [
        `Hoi ${esc(o.naam)},`,
        `Je hebt ja gezegd tegen ${esc(o.kitten)} uit het nestje van ${esc(o.moeder)}. De verkoper heeft hier ook een mail over gekregen en neemt contact met je op om een bezoek af te spreken.`,
        o.verkoperEmail
          ? `Wil je zelf alvast contact? Beantwoord deze mail, dan komt je bericht bij de verkoper.`
          : '',
        `Alvast voorbereiden? Lees <a href="${url('/eerste-dagen')}" style="color:#1F2A24;font-weight:600">hoe je een kitten de eerste dagen rustig laat wennen</a>.`,
      ].filter(Boolean),
      { tekst: 'Bekijk het nestje', href: url(`/n/${o.slug}`) },
      'Kom altijd eerst kijken bij het kitten en de moeder, en betaal nooit vooruit aan iemand die je niet hebt ontmoet.',
    ),
  };
}

export function mailReserveringGeannuleerd(o: {
  naam: string; moeder: string; kitten: string; slug: string; token: string; terugOpLijst: boolean;
}) {
  return {
    onderwerp: `Reservering van ${o.kitten} gaat niet door`,
    html: opmaak(
      `De reservering gaat niet door`,
      [
        `Hoi ${esc(o.naam)},`,
        `De verkoper van het nestje van ${esc(o.moeder)} heeft de reservering van ${esc(o.kitten)} geannuleerd.`,
        o.terugOpLijst
          ? 'Je staat weer op de wachtlijst, met je oorspronkelijke aanmelddatum. Komt er een kitten voor je vrij, dan krijg je een mail.'
          : 'Je staat niet meer op de wachtlijst van dit nestje. In het overzicht vind je andere nestjes met kittens die nog vrij zijn.',
      ],
      o.terugOpLijst
        ? { tekst: 'Bekijk het nestje', href: url(`/n/${o.slug}`) }
        : { tekst: 'Bekijk andere nestjes', href: url('/kittens') },
      o.terugOpLijst ? beheerVoet(o.token) : 'Vragen hierover? Neem contact op met de verkoper.',
    ),
  };
}

export function mailDoorgeschoven(o: { naam: string; vanMoeder: string; naarMoeder: string; naarSlug: string; token: string }) {
  return {
    onderwerp: `Je staat nu op de wachtlijst voor het nestje van ${o.naarMoeder}`,
    html: opmaak(
      `Je bent doorgeschoven`,
      [
        `Hoi ${esc(o.naam)},`,
        `De verkoper heeft je aanmelding voor het nestje van ${esc(o.vanMoeder)} overgezet naar het nestje van ${esc(o.naarMoeder)}. Je houdt je oorspronkelijke aanmelddatum.`,
      ],
      { tekst: 'Bekijk het nieuwe nestje', href: url(`/n/${o.naarSlug}`) },
      beheerVoet(o.token),
    ),
  };
}

export function mailNestVol(o: {
  naam: string; moeder: string; ras: string | null;
  alternatieven: { slug: string; moeder: string; regel: string }[];
}) {
  const lijst = o.alternatieven.length
    ? `<ul style="margin:0 0 14px;padding-left:20px;line-height:1.6">${o.alternatieven
        .map((a) => `<li><a href="${url(`/n/${a.slug}`)}" style="color:#1F2A24">Het nestje van ${esc(a.moeder)}</a>, ${esc(a.regel)}</li>`)
        .join('')}</ul>`
    : '';
  return {
    onderwerp: `Het nestje van ${o.moeder} is vol`,
    html: opmaak(
      `Dit nestje is vol`,
      [
        `Hoi ${esc(o.naam)},`,
        `Alle kittens uit het nestje van ${esc(o.moeder)} hebben een plek. Jammer dat het deze keer niet gelukt is. Je aanmelding voor dit nestje is daarmee gesloten.`,
        lijst ? `Deze nestjes${o.ras ? ` met ${esc(o.ras)}` : ''} hebben nog kittens vrij:${lijst}` : '',
        o.ras
          ? `Wil je een mail als er een nieuw nestje ${esc(o.ras)} bij komt? Zet je dan op de raslijst.`
          : 'In het overzicht vind je andere nestjes met kittens die nog vrij zijn.',
      ].filter(Boolean),
      o.ras
        ? { tekst: `Zet me op de raslijst ${o.ras}`, href: url(`/wachtlijst/ras?ras=${encodeURIComponent(o.ras)}`) }
        : { tekst: 'Bekijk andere nestjes', href: url('/kittens') },
    ),
  };
}

// ─── Mails aan kopers: raslijst ────────────────────────────────

export function mailRasBevestigen(o: { naam: string; ras: string; token: string; nieuwsbrief?: boolean }) {
  return {
    onderwerp: `Bevestig je aanmelding voor de raslijst ${o.ras}`,
    html: opmaak(
      `Bevestig je e-mailadres`,
      [
        `Hoi ${esc(o.naam)},`,
        `Je wilt een mail krijgen als er een nieuw nestje ${esc(o.ras)} met stamboom op Nestje komt. Bevestig eerst dat dit jouw e-mailadres is.`,
        ...(o.nieuwsbrief ? ['Je hebt ook aangegeven dat je de Nestje-nieuwsbrief wilt ontvangen. Met dezelfde knop bevestig je die aanmelding.'] : []),
      ],
      { tekst: 'Bevestig mijn aanmelding', href: url(`/wachtlijst/ras/${o.token}`) },
      'Heb je je niet aangemeld? Dan kun je deze mail negeren. Zonder bevestiging sturen we je niets meer.',
    ),
  };
}

export function mailNieuwNestRas(o: {
  naam: string; ras: string; token: string; moeder: string; slug: string; regel: string;
}) {
  return {
    onderwerp: `Nieuw nestje ${o.ras}: het nestje van ${o.moeder}`,
    html: opmaak(
      `Nieuw nestje ${o.ras}`,
      [
        `Hoi ${esc(o.naam)},`,
        `Er staat een nieuw nestje ${esc(o.ras)} met stamboom op Nestje: <a href="${url(`/n/${o.slug}`)}" style="color:#1F2A24">het nestje van ${esc(o.moeder)}</a>, ${esc(o.regel)}.`,
        'Wil je op de wachtlijst van dit nestje? Met één klik geef je je gegevens door aan de verkoper.',
      ],
      { tekst: 'Meld me aan voor dit nestje', href: url(`/wachtlijst/ras/${o.token}/nestje/${o.slug}`) },
      rasVoet(o.token),
    ),
  };
}

export function mailRasHerinnering(o: { naam: string; ras: string; token: string; tot: Date }) {
  return {
    onderwerp: `Wil je op de raslijst ${o.ras} blijven?`,
    html: opmaak(
      `Wil je op de raslijst blijven?`,
      [
        `Hoi ${esc(o.naam)},`,
        `Je staat bijna een jaar op de raslijst ${esc(o.ras)}. Op ${esc(o.tot.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' }))} verloopt je aanmelding en verwijderen we je gegevens.`,
        'Wil je blijven? Klik op de knop, dan verlengen we je aanmelding met een jaar.',
      ],
      { tekst: 'Ik wil blijven', href: url(`/wachtlijst/ras/${o.token}`) },
    ),
  };
}

// ─── Mails aan verkopers ──────────────────────────────────────

/** Rechtstreeks naar de wachtlijst van dit nestje in het beheer (klapt vanzelf open). */
const beheerLink = (nestId: string) => url(`/beheer/${nestId}#wachtlijst`);

export function mailVerkoperNieuweAanmelding(o: {
  nestId: string; moeder: string; naam: string; woonplaats: string;
  voorkeur_geslacht: string; voorkeur_vacht: string | null; motivatie: string | null;
}) {
  const voorkeur = [o.voorkeur_geslacht === 'geen' ? '' : o.voorkeur_geslacht, o.voorkeur_vacht ?? ''].filter(Boolean).join(', ');
  return {
    onderwerp: `Nieuwe aanmelding voor het nestje van ${o.moeder}`,
    html: opmaak(
      `Nieuwe aanmelding op je wachtlijst`,
      [
        `${esc(o.naam)} uit ${esc(o.woonplaats)} heeft zich aangemeld voor het nestje van ${esc(o.moeder)}.`,
        voorkeur ? `<strong>Voorkeur:</strong> ${esc(voorkeur)}` : '',
        o.motivatie ? `<strong>Over ${esc(o.naam)}:</strong><br>${esc(o.motivatie).replace(/\n/g, '<br>')}` : '',
      ].filter(Boolean),
      { tekst: 'Bekijk je wachtlijst', href: beheerLink(o.nestId) },
      `Beantwoord deze mail om ${esc(o.naam)} direct te mailen.`,
    ),
  };
}

export function mailVerkoperReactie(o: { nestId: string; moeder: string; naam: string; kitten: string; soort: 'ja' | 'nee' | 'verlopen' }) {
  const kop = {
    ja: `${o.naam} zegt ja tegen ${o.kitten}`,
    nee: `${o.naam} zegt nee tegen ${o.kitten}`,
    verlopen: `Aanbod voor ${o.kitten} is verlopen`,
  }[o.soort];
  const tekst = {
    ja: `${esc(o.kitten)} staat nu op gereserveerd. Neem contact op met ${esc(o.naam)} om een bezoek af te spreken. Beantwoord deze mail om ${esc(o.naam)} direct te mailen.`,
    nee: `${esc(o.kitten)} staat weer op vrij. ${esc(o.naam)} blijft op je wachtlijst staan. Je kunt het kitten aan iemand anders aanbieden.`,
    verlopen: `${esc(o.naam)} heeft binnen 72 uur niet gereageerd. ${esc(o.kitten)} staat weer op vrij en ${esc(o.naam)} blijft op je wachtlijst staan.`,
  }[o.soort];
  return {
    onderwerp: kop,
    html: opmaak(kop, [tekst, `Nestje van ${esc(o.moeder)}.`], { tekst: 'Naar je wachtlijst', href: beheerLink(o.nestId) }),
  };
}

// ─── Controle voor het overzicht (uitbreiding 26) ─────────────

export function mailGoedgekeurd(o: { moeder: string; slug: string; nestId: string }) {
  return {
    onderwerp: `Het nestje van ${o.moeder} staat in het overzicht`,
    html: opmaak(
      'Je nestje staat in het overzicht',
      [
        `We hebben het nestje van ${esc(o.moeder)} bekeken. Het staat nu in het overzicht op Nestje, zodat kopers het ook zonder jouw link kunnen vinden.`,
        'Tip: deel je link ook zelf, bijvoorbeeld in je WhatsApp-status of op Facebook. Daar komen de meeste kopers vandaan.',
      ],
      { tekst: 'Bekijk je pagina', href: url(`/n/${o.slug}`) },
      `Iets aanpassen? <a href="${url(`/beheer/${o.nestId}`)}" style="color:#1F2A24">Ga naar je beheer</a>.`,
    ),
  };
}

export function mailAanpassen(o: { moeder: string; nestId: string; reden: string }) {
  return {
    onderwerp: `Pas het nestje van ${o.moeder} aan voor het overzicht`,
    html: opmaak(
      'Nog even aanpassen',
      [
        `We hebben het nestje van ${esc(o.moeder)} bekeken. Voordat het in het overzicht kan, vragen we je dit aan te passen:`,
        `<span style="display:block;background:#FBE9CF;border-radius:12px;padding:12px 14px">${esc(o.reden).replace(/\n/g, '<br>')}</span>`,
        'Je eigen link blijft gewoon werken. Klik na het aanpassen in je beheer op “Controleer opnieuw”.',
      ],
      { tekst: 'Naar je beheer', href: url(`/beheer/${o.nestId}`) },
      'Vragen? Beantwoord deze mail.',
    ),
  };
}

export function mailAdminControle(o: { aantal: number }) {
  return {
    onderwerp: `${o.aantal} ${o.aantal === 1 ? 'nestje wacht' : 'nestjes wachten'} op controle`,
    html: opmaak(
      'Nestjes wachten op controle',
      [`Er ${o.aantal === 1 ? 'wacht 1 nestje' : `wachten ${o.aantal} nestjes`} op je controle voor het overzicht.`],
      { tekst: 'Naar de controle', href: url('/beheer/controle') },
    ),
  };
}

export function mailAdminNieuwNestje(o: {
  moeder: string; slug: string; plaats: string; ras: string; vondeling: boolean;
  foto: string | null; verkoper: string; opnieuw: boolean;
}) {
  const foto = o.foto
    ? `<img src="${o.foto}" alt="" width="240" style="display:block;width:240px;max-width:100%;height:auto;border-radius:12px" />`
    : '<em>Geen foto van de moeder</em>';
  return {
    onderwerp: `${o.opnieuw ? 'Opnieuw ter controle' : 'Nieuw ter controle'}: het nestje van ${o.moeder}`,
    html: opmaak(
      o.opnieuw ? 'Opnieuw ter controle' : 'Nieuw nestje ter controle',
      [
        `<strong>Het nestje van ${esc(o.moeder)}</strong>${o.vondeling ? ' (vondelingen)' : ''}<br>${esc(o.ras)}<br>${esc(o.plaats)}<br>Verkoper: ${esc(o.verkoper)}`,
        foto,
        `<a href="${url(`/n/${o.slug}`)}" style="color:#1F2A24;font-weight:600">Bekijk de pagina →</a>`,
      ],
      { tekst: 'Naar de controle', href: url('/beheer/controle') },
    ),
  };
}

export function mailAdminUitslag(o: { moeder: string; slug: string; aantal: number; verkoper: string }) {
  return {
    onderwerp: `Testuitslag om te bekijken: het nestje van ${o.moeder}`,
    html: opmaak(
      'Nieuwe testuitslag',
      [
        `Bij <strong>het nestje van ${esc(o.moeder)}</strong> ${o.aantal === 1 ? 'wacht 1 testuitslag' : `wachten ${o.aantal} testuitslagen`} op je controle.<br>Verkoper: ${esc(o.verkoper)}`,
        `<a href="${url(`/n/${o.slug}`)}" style="color:#1F2A24;font-weight:600">Bekijk de pagina →</a>`,
      ],
      { tekst: 'Naar de controle', href: url('/beheer/controle#testuitslagen') },
    ),
  };
}

export function mailUitslagKloptNiet(o: { moeder: string; nestId: string; test: string; ouder: string; reden: string }) {
  return {
    onderwerp: `Over de testuitslag ${o.test} (${o.ouder})`,
    html: opmaak(
      'De uitslag klopte niet helemaal',
      [
        `We hebben de uitslag van <strong>${esc(o.test)}</strong> van de ${esc(o.ouder)} bij het nestje van ${esc(o.moeder)} bekeken. Hij klopte niet met wat je had ingevuld.`,
        o.reden
          ? `<span style="display:block;background:#FBE9CF;border-radius:12px;padding:12px 14px">${esc(o.reden).replace(/\n/g, '<br>')}</span>`
          : '',
        'Het bestand hebben we verwijderd. Pas de test aan of voeg een andere uitslag toe, dan kijken we opnieuw.',
      ].filter(Boolean),
      { tekst: 'Naar je beheer', href: url(`/beheer/${o.nestId}`) },
      'Vragen? Beantwoord deze mail.',
    ),
  };
}

// ─── Nieuwsbrief ───────────────────────────────────────────────

export function mailNieuwsbriefBevestigen(o: { naam: string | null; token: string }) {
  return {
    onderwerp: 'Bevestig je aanmelding voor de Nestje-nieuwsbrief',
    html: opmaak(
      'Wil je de nieuwsbrief ontvangen?',
      [
        o.naam ? `Hoi ${esc(o.naam)},` : 'Hoi,',
        'Je hebt aangegeven dat je de nieuwsbrief van Nestje wilt ontvangen, met tips over kittens, zoals verzorging en tam maken. Bevestig dat even met de knop hieronder.',
      ],
      { tekst: 'Ja, stuur mij de nieuwsbrief', href: url(`/nieuwsbrief/${o.token}`) },
      'Heb je dit niet aangevraagd? Dan kun je deze mail negeren. Zonder bevestiging sturen we je geen nieuwsbrief.',
    ),
  };
}
