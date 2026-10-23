# Nestje

Eén deelbare pagina per nestje kittens. Verkopers beheren alles vanaf hun telefoon; kopers zien een alleen-lezen pagina en vragen met één tik via WhatsApp naar een kitten.

Draait op **nestje.kattenverzorging.com**. Stack: Next.js 15 (App Router) + Supabase (auth, Postgres, storage) + Vercel.

## Wat zit erin

| Pad | Wat |
|---|---|
| `/` | Korte startpagina met knop naar inloggen |
| `/login` | Inloggen met magic link of de code uit de mail (geen wachtwoorden) |
| `/beheer` | Nestje aanmaken en beheren: nestfoto's, kittens met foto's en karakteromschrijving, status met één tik, gegevens (vader optioneel), link kopiëren |
| `/n/[slug]` | Openbare nestjespagina met nestfoto's, aftelling, kittenkaarten, "Vraag naar …", de ouders en een blok met link naar kattenverzorging.com |
| `/n/[slug]/opengraph-image` | Automatische deelafbeelding (1200×630) voor WhatsApp en Facebook |
| `/n/[slug]/vraag/[kittenId]` | Stuurt door naar WhatsApp; het nummer staat nooit in de HTML |
| `/privacy`, `/voorwaarden` | Concepteksten, nog zelf nakijken |

Vaste instellingen (link naar kattenverzorging.com, max. foto's, fotoformaat, standaard verhuisleeftijd) staan in `src/lib/config.ts`.

## Beveiliging in het kort

- RLS staat aan op `nests`, `kittens` en `kitten_photos`. Alleen de eigenaar (`auth.uid()`) leest en schrijft. Anoniem heeft geen rechten op de tabellen.
- De openbare pagina leest via de views `openbare_nesten`, `openbare_kittens` en `openbare_fotos`. Daarin zitten geen `owner_id`, e-mail of telefoonnummer.
- Het WhatsApp-nummer komt alleen vrij via de functie `whatsapp_gegevens(slug, kitten)`, en alleen voor een kitten met status *vrij*. De route `/n/[slug]/vraag/[id]` gebruikt die functie en stuurt direct door naar `wa.me`.
- Foto's staan in de publieke bucket `kitten-fotos` onder `<nest_id>/<kitten_id>/<uuid>.jpg` (kittens) en `<nest_id>/nest/<uuid>.jpg` (nestfoto's). Uploaden, wijzigen en verwijderen mag alleen in de map van je eigen nestje.
- Max. 5 foto's per kitten en 3 nestfoto's wordt ook in de database afgedwongen (triggers). Foto's worden in de browser verkleind tot max. 1600px (JPEG, kwaliteit 0,85) vóór upload.
- Nestjespagina's staan op `noindex`: verkopers delen hun woonplaats en dat hoort niet in Google.

> **Let op:** Supabase's Security Advisor meldt de drie views als *security definer view*. Dat is hier bewust: de views tonen alleen veilige kolommen. Wie de anon-key heeft, kan wel de lijst van alle nestjes opvragen (moedernaam, woonplaats, geboortedatum). Wil je dat later dichtzetten, vervang de views dan door een RPC-functie die alleen op slug zoekt.

---

## 1. Supabase-project opzetten

1. Ga naar [supabase.com](https://supabase.com) → **New project**.
   - Naam: `nestje`
   - Region: **Central EU (Frankfurt)**, zodat gegevens in de EU blijven (zie privacyverklaring).
   - Bewaar het databasewachtwoord in je wachtwoordmanager.
2. **Database aanmaken:** open **SQL Editor** → **New query** en voer de bestanden uit `supabase/migrations/` één voor één uit, op volgorde van bestandsnaam (plakken, **Run**, volgende):
   1. `20261023000000_nestje.sql`: tabellen, RLS-policies, views, de WhatsApp-functie, de bucket `kitten-fotos` en de storage-policies.
   2. `20261024000000_ouders_omschrijving_nestfotos.sql`: vader (optioneel), karakteromschrijving per kitten en de tabel `nest_photos`.
   3. `20261025000000_ras.sql`: ras van moeder en vader (optioneel).
   4. `20261026000000_notitie.sql`: privénotitie per kitten, alleen zichtbaar voor de verkoper.
   - Controle: **Table Editor** toont `nests`, `kittens`, `kitten_photos` en `nest_photos` met het RLS-schildje; **Storage** toont de bucket `kitten-fotos` (Public).
   - Krijg je bij de storage-policies een melding over rechten, maak ze dan via **Storage → Policies** aan met dezelfde voorwaarden.
3. **Authenticatie instellen:** **Authentication → URL Configuration**
   - Site URL: `https://nestje.kattenverzorging.com`
   - Redirect URLs (toevoegen):
     - `https://nestje.kattenverzorging.com/**`
     - `http://localhost:3000/**`
     - `https://*-<jouw-vercel-team>.vercel.app/**` (voor preview-deploys)
4. **E-mailprovider:** **Authentication → Sign In / Providers → Email**: aan. "Confirm email" mag aan blijven. Zet **Email OTP Length** op 6.
5. **Inlogmail aanpassen:** **Authentication → Emails → Magic Link**
   - Onderwerp: `Je inloglink voor Nestje`
   - Body: plak de inhoud van `supabase/email-templates/magic-link.html`.
   - Doe hetzelfde voor de template **Confirm signup** (nieuwe gebruikers krijgen die mail bij hun eerste keer).

   Waarom: de standaardlink werkt alleen in dezelfde browser waarin je de mail aanvroeg. Op telefoons opent een mail-app links vaak in een eigen browser. Deze template werkt in elke browser, en de code in de mail is een extra terugvaloptie.
6. **Eigen SMTP instellen (nodig vóór livegang):** de ingebouwde mailer van Supabase verstuurt maar een paar mails per uur. Ga naar **Authentication → Emails → SMTP Settings** en koppel een mailprovider (bijv. Resend, Brevo of Postmark) met afzender `nestje@kattenverzorging.com`. Zet in die provider SPF/DKIM voor kattenverzorging.com aan, anders belanden mails in spam. Verhoog daarna onder **Authentication → Rate Limits** het aantal e-mails per uur.
7. **Sleutels ophalen:** **Project Settings → API** (of *API Keys*): kopieer de **Project URL** en de **anon / publishable key**. De service-role key heb je niet nodig.

## 2. Lokaal draaien

Vereist Node.js 20 of nieuwer.

```bash
npm install
cp .env.example .env.local     # vul de waarden uit stap 1.7 in
npm run dev
```

Open <http://localhost:3000>, log in met je eigen e-mailadres en maak een test-nestje.

## 3. Deployen op Vercel

1. Zet het project in een (privé) GitHub-repository.
2. Ga naar [vercel.com/new](https://vercel.com/new) → importeer de repository. Framework wordt automatisch herkend als Next.js.
3. Vul bij **Environment Variables** in (voor Production, Preview en Development):

   | Naam | Waarde |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL uit Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
   | `NEXT_PUBLIC_SITE_URL` | `https://nestje.kattenverzorging.com` |

4. Klik **Deploy**. Na een minuut staat de app op `nestje-xxx.vercel.app`.
5. Region: **Settings → Functions → Function Region** op **Frankfurt (fra1)**, dicht bij de database.

## 4. Subdomein nestje.kattenverzorging.com koppelen

1. In Vercel: **Project → Settings → Domains → Add** → `nestje.kattenverzorging.com`.
2. Vercel toont welk DNS-record nodig is. Meestal:

   | Type | Naam / Host | Waarde |
   |---|---|---|
   | CNAME | `nestje` | `cname.vercel-dns.com` |

   Neem de waarde over die Vercel bij jouw project toont; die kan projectspecifiek zijn.
3. Log in bij de partij waar de DNS van kattenverzorging.com staat (vaak je domeinregistrar of WordPress-hoster). Voeg het CNAME-record toe. Raak de bestaande records voor `@` en `www` niet aan, dan blijft de WordPress-site gewoon werken.
   - Gebruik je Cloudflare: zet de proxy (oranje wolk) voor dit record **uit** (DNS only), anders kan Vercel geen certificaat uitgeven.
4. Wacht tot Vercel bij het domein **Valid Configuration** toont (meestal binnen minuten, soms tot een paar uur). Het SSL-certificaat wordt automatisch aangemaakt.
5. Controleer in Supabase dat de Site URL (stap 1.3) op het nieuwe domein staat.

## 5. Testlijst na livegang

- [ ] Inloggen op je telefoon via de link in de mail, en apart via de code.
- [ ] Nestje aanmaken, WhatsApp-nummer invullen (06-notatie mag).
- [ ] Foto's uploaden vanaf iPhone en Android (ook een liggende foto: staat hij goed?), zowel nestfoto's als kittenfoto's.
- [ ] Vadervelden leeg laten: de pagina toont alleen "Over [moeder]". Ingevuld: het blok heet "De ouders".
- [ ] Status wisselen en de openbare pagina verversen.
- [ ] "Vraag naar …" opent WhatsApp met ingevuld bericht; bij een gereserveerd kitten is er geen knop.
- [ ] Link plakken in WhatsApp: verschijnt de deelafbeelding met aftelling en foto? (Facebook: test met de [Sharing Debugger](https://developers.facebook.com/tools/debug/).)
- [ ] In een privévenster `/beheer` openen: je wordt naar inloggen gestuurd.
- [ ] Privacy- en voorwaardenteksten nagekeken en `[blokhaken]` ingevuld, ook `contactEmail` in `src/lib/config.ts`.

## Later uitbreiden

- **Video:** bewust niet ingebouwd. Verkopers sturen filmpjes via WhatsApp, waar de koper toch al in gesprek is. Blijkt er toch vraag naar, begin dan met een optioneel YouTube-linkveld voordat je eigen videoverwerking toevoegt.

- **Meerdere nestjes per verkoper:** verwijder de unieke index `nests_een_per_verkoper` en voeg een nestjeskeuze toe in `/beheer`.
- **Gewichtslog en gezondheidschecklist:** het prototype heeft hier al een ontwerp voor; voeg tabellen `kitten_gewichten` en een `gezondheid jsonb`-kolom toe, met dezelfde RLS-aanpak.
- **Account verwijderen door de gebruiker zelf:** vraagt een server-route met de service-role key (`auth.admin.deleteUser`).
