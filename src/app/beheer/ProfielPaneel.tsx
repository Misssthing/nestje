'use client';

import { useMemo, useState } from 'react';
import KopieerLink from '@/components/KopieerLink';
import { useToast } from '@/components/Toast';
import { CONFIG } from '@/lib/config';
import { createClient } from '@/lib/supabase/browser';
import type { Profiel } from '@/lib/types';

const MAX_INTRO = 500;

/** Maakt een webadres-deel van vrije tekst. Een geplakt website-adres wordt opgeschoond:
 *  "https://www.xarana.nl/index.html" wordt "xarana". */
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
  const [fout, setFout] = useState('');
  const [bezig, setBezig] = useState(false);

  async function bewaar(e: React.FormEvent) {
    e.preventDefault();
    setFout('');
    if (!naam.trim()) return setFout('Vul een naam in, bijvoorbeeld je eigen naam of die van je cattery of opvang.');
    const schoon = maakSlug(slug);
    setSlug(schoon);
    if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(schoon))
      return setFout('Het webadres moet minstens 3 tekens zijn, met alleen kleine letters, cijfers en streepjes.');

    setBezig(true);
    const { data, error } = await supabase
      .from('profielen')
      .upsert({ slug: schoon, naam: naam.trim(), intro: intro.trim() || null, zichtbaar }, { onConflict: 'owner_id' })
      .select('owner_id, slug, naam, intro, zichtbaar')
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
    <details className="panel" open={Boolean(opgeslagen?.zichtbaar)}>
      <summary>Profielpagina (optioneel)</summary>
      <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>
        Eén vaste link met al je lopende nestjes, handig als je vaker een nestje hebt. Afgeronde nestjes verdwijnen er
        vanzelf van af. Zet je hem uit, dan is de pagina weg.
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
              setSlug(maakSlug(e.target.value, true));
            }}
          />
          <p className="hint">
            Wordt: nestje.kattenverzorging.com/van/{slug || 'jouw-naam'}. Dit is niet het adres van je eigen website.
          </p>
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
        <div className="veld">
          <span>Profielpagina</span>
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
