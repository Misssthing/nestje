'use client';

import { useEffect, useMemo, useState } from 'react';
import KopieerLink from '@/components/KopieerLink';
import { useToast } from '@/components/Toast';
import { CONFIG } from '@/lib/config';
import { ORGANISATIES, schoonLink } from '@/lib/nest';
import SocialIcoon from '@/components/SocialIcoon';
import { createClient } from '@/lib/supabase/browser';
import type { Profiel } from '@/lib/types';

const MAX_INTRO = 500;

/** Maakt een webadres-deel van vrije tekst. Een geplakt website-adres wordt opgeschoond:
 *  "https://www.xarana.nl/index.html" wordt "xarana". */
/** Webadressen van platforms die je niet als eigen Nestje-link kunt gebruiken. */
const PLATFORMS = /(^|\.)(facebook|fb|instagram|tiktok|whatsapp|wa|youtube|google|marktplaats|kittentekoop|nestjes)\.[a-z]{2,}/i;
const PLATFORMNAAM: Record<string, string> = { fb: 'Facebook', wa: 'WhatsApp' };

/** Namen die gereserveerd zijn voor Nestje of die verwarring geven. */
const GERESERVEERD = new Set([
  'facebook', 'fb', 'instagram', 'insta', 'tiktok', 'whatsapp', 'youtube', 'google', 'marktplaats',
  'nestje', 'nestjes', 'kattenverzorging', 'admin', 'beheer', 'login', 'kittens', 'huisregels', 'hulp',
  'privacy', 'voorwaarden', 'www', 'http', 'https',
]);

/** Herkent een geplakte link naar Facebook, Instagram en dergelijke. Geeft de naam van het platform terug. */
function platformLink(t: string) {
  const tekst = t.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0];
  const m = tekst.match(PLATFORMS);
  if (!m) return null;
  return PLATFORMNAAM[m[2]] ?? m[2].charAt(0).toUpperCase() + m[2].slice(1);
}

function maakSlug(t: string, tijdensTypen = false) {
  let tekst = tijdensTypen ? t.toLowerCase().trimStart() : t.trim().toLowerCase();
  if (/^https?:\/\/|^www\.|\.[a-z]{2,}(\/|$)/.test(tekst)) {
    tekst = tekst.replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0].replace(/\.[a-z]{2,}$/, '');
  }
  const slug = tekst
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, '-en-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 40);
  // Tijdens het typen mag een streepje aan het eind blijven staan, anders kun je geen woorden scheiden.
  return tijdensTypen ? slug : slug.replace(/-+$/, '');
}

export default function ProfielPaneel({ profiel }: { profiel: Profiel | null }) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();
  const [opgeslagen, setOpgeslagen] = useState<Profiel | null>(profiel);
  const [naam, setNaam] = useState(profiel?.naam ?? '');
  const [slug, setSlug] = useState(profiel?.slug ?? '');
  const [slugAangepast, setSlugAangepast] = useState(Boolean(profiel));
  const [intro, setIntro] = useState(profiel?.intro ?? '');
  const [zichtbaar, setZichtbaar] = useState(profiel?.zichtbaar ?? false);
  const [website, setWebsite] = useState(profiel?.website ?? '');
  const [facebook, setFacebook] = useState(profiel?.facebook ?? '');
  const [instagram, setInstagram] = useState(profiel?.instagram ?? '');
  const [sinds, setSinds] = useState(profiel?.sinds_jaar ? String(profiel.sinds_jaar) : '');
  const [rassen, setRassen] = useState(profiel?.rassen ?? '');
  const [vereniging, setVereniging] = useState(profiel?.vereniging ?? '');
  const [open, setOpen] = useState(Boolean(profiel?.zichtbaar));
  // Via de checklist (#profiel): openklappen en ernaartoe scrollen
  useEffect(() => {
    if (window.location.hash === '#profiel') {
      setOpen(true);
      setTimeout(() => document.getElementById('profiel')?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, []);
  const [fout, setFout] = useState('');
  const [slugFout, setSlugFout] = useState('');
  const [bezig, setBezig] = useState(false);

  async function bewaar(e: React.FormEvent) {
    e.preventDefault();
    setFout('');
    if (!naam.trim()) return setFout('Vul een naam in, bijvoorbeeld je eigen naam of die van je cattery of opvang.');
    const schoon = maakSlug(slug);
    setSlug(schoon);
    if (GERESERVEERD.has(schoon))
      return setFout(`“${schoon}” kun je niet als je link op Nestje gebruiken. Kies je eigen naam, bijvoorbeeld je catterynaam.`);
    if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(schoon))
      return setFout('Het webadres moet minstens 3 tekens zijn, met alleen kleine letters, cijfers en streepjes.');

    const w = schoonLink(website, 'website');
    if (w.fout) return setFout(`Website: ${w.fout}`);
    const f = schoonLink(facebook, 'facebook');
    if (f.fout) return setFout(`Facebook: ${f.fout}`);
    const i = schoonLink(instagram, 'instagram');
    if (i.fout) return setFout(`Instagram: ${i.fout}`);
    setWebsite(w.url ?? '');
    setFacebook(f.url ?? '');
    setInstagram(i.url ?? '');

    const jaar = sinds.trim() ? Number(sinds) : null;
    if (jaar != null && (!Number.isInteger(jaar) || jaar < 1950 || jaar > new Date().getFullYear()))
      return setFout('Vul bij “Fokt sinds” een jaartal in, bijvoorbeeld 2018.');

    setBezig(true);
    const { data, error } = await supabase
      .from('profielen')
      .upsert(
        {
          slug: schoon,
          naam: naam.trim(),
          intro: intro.trim() || null,
          zichtbaar,
          website: w.url,
          facebook: f.url,
          instagram: i.url,
          sinds_jaar: jaar,
          rassen: rassen.trim() || null,
          vereniging: vereniging || null,
        },
        { onConflict: 'owner_id' },
      )
      .select('owner_id, slug, naam, intro, zichtbaar, website, facebook, instagram, sinds_jaar, rassen, vereniging')
      .single<Profiel>();
    setBezig(false);

    if (error) {
      if (error.code === '23505') return setFout('Dit webadres is al in gebruik. Kies een ander.');
      return setFout('Opslaan lukte niet. Probeer het nog eens.');
    }
    setOpgeslagen(data);
    toast(data.zichtbaar ? 'Profielpagina staat aan' : 'Profiel opgeslagen');
  }

  const url = opgeslagen ? `${CONFIG.siteUrl}/van/${opgeslagen.slug}` : '';

  return (
    <details className="panel" id="profiel" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="aanpassen">
        <span aria-hidden="true">✎</span> Over jou en je profielpagina
        <small>Wie je bent, je cattery, je links</small>
      </summary>
      <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
        Kopers vertrouwen een verkoper die ze een beetje kennen. Wat je hier invult, komt op je profielpagina en als blokje
        “Over de verkoper” bij je nestjes. Je profielpagina is ook één vaste link met al je lopende nestjes.
      </p>

      {opgeslagen?.zichtbaar && (
        <div className="profiel-link">
          <a href={url} target="_blank" rel="noopener">{url.replace(/^https?:\/\//, '')}</a>
          <KopieerLink url={url} className="btn ghost klein" />
        </div>
      )}

      <form onSubmit={bewaar}>
        <label className="veld">
          <span>Naam</span>
          <input
            value={naam}
            maxLength={80}
            placeholder="Bijvoorbeeld Cattery De Spinner"
            onChange={(e) => {
              setNaam(e.target.value);
              if (!slugAangepast) setSlug(maakSlug(e.target.value));
            }}
          />
        </label>
        <label className="veld">
          <span>Je link op Nestje</span>
          <input
            value={slug}
            maxLength={40}
            inputMode="url"
            autoCapitalize="none"
            onChange={(e) => {
              setSlugAangepast(true);
              const platform = platformLink(e.target.value);
              if (platform) {
                setSlugFout(
                  `Dit is een link naar ${platform}. Vul hier de naam in die je in je Nestje-link wilt, bijvoorbeeld je catterynaam. Je ${platform}-link zet je hieronder bij “Je links”.`,
                );
                return;
              }
              setSlugFout('');
              setSlug(maakSlug(e.target.value, true));
            }}
          />
          <p className="hint">
            Wordt: nestje.kattenverzorging.com/van/{slug || 'jouw-naam'}. Dit is niet het adres van je eigen website.
          </p>
          {slugFout && <p className="fout" role="alert">{slugFout}</p>}
        </label>
        <label className="veld">
          <span>Over jou <span className="hint">(optioneel)</span></span>
          <textarea
            value={intro}
            maxLength={MAX_INTRO}
            placeholder="Een paar zinnen over jou, je katten of je opvang."
            onChange={(e) => setIntro(e.target.value)}
          />
          <p className="hint teller">{intro.length}/{MAX_INTRO}</p>
        </label>
        <div className="paneelkop">
          <h3>Fokker of cattery <small className="opt">optioneel</small></h3>
          <p className="hint">
            Fok je met stamboom? Dan helpt dit kopers om je te leren kennen. Je catterynaam en vereniging verschijnen vanzelf op je
            profielpagina, met het label “Fokker · met stamboom”, zodra een van je nestjes de stamboomgegevens compleet heeft. Staat je
            profielpagina aan en is dat nestje goedgekeurd, dan sta je ook op de pagina <a href="/catteries">Catteries</a>.
          </p>
        </div>
        <div className="row stapel">
          <label className="veld">
            <span>Fokt sinds (jaar)</span>
            <input inputMode="numeric" value={sinds} onChange={(e) => setSinds(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Bijv. 2018" />
          </label>
          <label className="veld">
            <span>Aangesloten bij</span>
            <select value={vereniging} onChange={(e) => setVereniging(e.target.value)}>
              <option value="">Geen of niet vermelden</option>
              {ORGANISATIES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        </div>
        <label className="veld">
          <span>Rassen</span>
          <input value={rassen} onChange={(e) => setRassen(e.target.value)} maxLength={120} placeholder="Bijv. Maine Coon, Noorse boskat" />
        </label>
        <div className="paneelkop">
          <h3>Je links <small className="opt">optioneel</small></h3>
          <p className="hint">Kopers zien deze als knoppen op je profielpagina. Zo zien ze dat je echt bestaat.</p>
        </div>
        <label className="veld">
          <span className="metlogo"><SocialIcoon soort="website" maat={16} /> Website</span>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} inputMode="url" autoCapitalize="none" placeholder="jouwcattery.nl" maxLength={200} />
        </label>
        <div className="row stapel">
          <label className="veld">
            <span className="metlogo"><SocialIcoon soort="facebook" maat={16} /> Facebook-pagina</span>
            <input value={facebook} onChange={(e) => setFacebook(e.target.value)} inputMode="url" autoCapitalize="none" placeholder="facebook.com/jouwcattery" maxLength={200} />
          </label>
          <label className="veld">
            <span className="metlogo"><SocialIcoon soort="instagram" maat={16} /> Instagram</span>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} autoCapitalize="none" placeholder="@jouwcattery" maxLength={200} />
          </label>
        </div>
        <p className="hint" style={{ marginTop: -4 }}>
          Tip: zet op je eigen website ook een link naar je profiel op Nestje.
        </p>
        <div className="veld paneelscheiding">
          <span>Profielpagina tonen</span>
          <div className="seg" role="group" aria-label="Profielpagina aan of uit">
            <button type="button" aria-pressed={!zichtbaar} onClick={() => setZichtbaar(false)}>Uit</button>
            <button type="button" aria-pressed={zichtbaar} onClick={() => setZichtbaar(true)}>Aan</button>
          </div>
        </div>
        {fout && <p className="fout" role="alert">{fout}</p>}
        <div className="actions">
          <button className="btn primary" disabled={bezig}>{bezig ? 'Bezig…' : 'Opslaan'}</button>
        </div>
      </form>
    </details>
  );
}
