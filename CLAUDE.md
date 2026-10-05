# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Progetto
Dashboard organizzativa per COINCIDENZE — "raffinate casualità, occhi attenti".
Evento misto convegno/festival, una giornata l'anno (25 aprile) a Marsam Locanda, Bene Vagienna.
Edizione 0 (2025) ed Edizione 1 (2026) archiviate; Edizione 2 (`ed-2`, 2027-04-25) in preparazione.

## Tech Stack
- **Frontend**: React 18 + Vite + TypeScript, shadcn/ui + Tailwind CSS v4, React Flow (`@xyflow/react`), Zustand, React Router v7
- **Backend**: Cloudflare Workers + Hono + D1 (SQLite) + R2 (media)
- **Monorepo**: npm workspaces (`packages/web`, `packages/api`)

## Comandi
```bash
npm run dev                              # frontend (5173) + backend (8787) in parallelo
npm run dev:web                          # solo frontend
npm run dev:api                          # solo backend (wrangler dev)
npm run build                            # build frontend (tsc -b && vite build)
npm run build:api                        # type-check Worker

# Database (locale)
npm run db:migrate --workspace=packages/api   # applica schema.sql al D1 locale
npm run db:seed --workspace=packages/api      # dati demo + edizioni 0/1/2 (la 1 corrente)

# Deploy manuale (di solito non serve, vedi sotto)
npm run deploy --workspace=packages/api       # deploy Worker
```

In dev il frontend chiama `/api` e Vite fa proxy verso `http://localhost:8787` (`vite.config.ts`). In produzione il client usa direttamente `https://api.coincidenze.org/api` (`packages/web/src/lib/api.ts`).

Per il login in locale serve `packages/api/.dev.vars` (non committato) con `AUTH_SECRET=...` e `SESSION_SECRET=...` (casuale). Con il DB vuoto `/login` mostra il "Primo accesso": si crea l'amministratore inserendo `AUTH_SECRET`. Senza `RESEND_API_KEY` le email non partono (l'errore finisce solo nel log) e la pagina Utenti mostra il link di invito da copiare. `wrangler dev` presenta l'host di produzione, quindi il cookie di sessione arriva `Secure`: il browser lo accetta su localhost, client come curl o Python no.

## Deploy
Push su `main` → GitHub Actions (`.github/workflows/deploy.yml`) deploya in parallelo:
- Pages (`coincidenze.org`) da `packages/web/dist`
- Worker (`api.coincidenze.org`) da `packages/api`

Secret del Worker: `AUTH_SECRET` (password condivisa, serve solo al primo amministratore), `SESSION_SECRET` (firma delle sessioni, casuale), `RESEND_API_KEY`, `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (notifiche push; senza, le push tacciono).

**Le migration D1 di produzione sono manuali**: applicare i file in `packages/api/src/db/migrations/NNNN_*.sql` con `wrangler d1 execute coincidenze-db --remote --file=...`, **prima** del push che porta il codice che le usa. Il 12 maggio 2026 il codice di 0004/0005 è andato online senza migration e il login ha risposto 500 fino al 5 ottobre. Prima di scrivere in prod prendere il punto di ripristino con `wrangler d1 time-travel info coincidenze-db` (con la wrangler 3 del progetto dà errore di autenticazione, usare la wrangler 4 globale).

## Architettura

### Routing & auth
- `packages/api/src/index.ts` monta tutte le route Hono sotto `/api/*`, più `/dati` (HTML statico).
- Utenti personali (email + password PBKDF2, `lib/passwords.ts`) con un ruolo ciascuno; i ruoli sono insiemi di permessi gestiti dalle pagine `/admin/utenti` e `/admin/ruoli`. Catalogo dei permessi in `lib/permissions.ts` (unica fonte, esposto a `/api/roles/catalog`); il ruolo di sistema Amministratore li ha tutti. Ruoli iniziali: Amministratore, Organizzazione, Agenzia, Check-in (migration 0008).
- Nuovi utenti: invito via email con link monouso (7 giorni); password dimenticata: link da 1 ora (`lib/accounts.ts`, tabella `user_tokens`, nel DB solo l'hash del token). `AUTH_SECRET` serve solo a `/api/auth/setup`, che funziona quando non c'è nessun amministratore attivo. Il sistema impedisce di restare senza un utente con `utenti.manage`.
- Sessione: cookie `v1.<userId>.<sessionVersion>.<ts>.<firma>` firmato con `SESSION_SECRET` (`lib/session.ts`). A ogni richiesta `/api/*` l'utente viene ricaricato dal DB in `c.get('user')`: cambi di ruolo valgono subito, disattivare o cambiare password alza `session_version` e chiude le sessioni.
- Ogni gruppo di rotte dichiara i permessi con `requirePermission({ read, write, remove })` (`middleware/auth.ts`): letture pubbliche solo per quello che serve alle pagine pubbliche (eventi, artisti, media, menu, categorie, edizioni). Le route miste (edizioni, accrediti, spuntino, upload) controllano dentro con `can(c, '...')` / `deny(c)`; restano pubblici POST accrediti/spuntino, il biglietto by-code e il self check-in. Il campo `notes` lo legge e lo scrive solo chi ha `note.view`.
- Frontend: rotte pubbliche in `App.tsx` (es. `/biglietto/:code`, `/accesso/:token`, `/accrediti`, `/spuntino`, `/:editionSlug`); tutto `/admin/*` è dietro `<RequireAuth>` + `<AppShell>` e ogni sezione dietro il permesso indicato in `lib/adminNav.ts`, che alimenta anche la sidebar. Nei componenti si usa `useCan('...')` dallo store `authStore`. `/admin` apre la prima sezione permessa. Esistono redirect legacy da `/canvas`, `/programma`, ecc. verso `/admin/*`.
- React Router v7 **non supporta param parziali** (es. `/edizione-:slug`): le edizioni usano un full-segment param `/:editionSlug` validato in `EditionRoute` (vedi commento in `App.tsx:107`).

### Multi-edizione (concetto centrale)
La tabella `editions` è il punto di scoping per quasi tutti i contenuti (`artists`, `events`, `media`, `menu_items`, accrediti, spuntino). I flag `is_current`, `accrediti_open`, `spuntino_open` sull'edizione corrente guidano la home pubblica e l'apertura dei form.

Sul backend `packages/api/src/lib/edition.ts` espone `resolveEdition(c)` che legge `?edition=<slug>` dalla query e ricade sull'edizione corrente. Le route che servono dati pubblici scoped per edizione devono usarlo.

Sul frontend l'helper `withEdition(path, slug)` in `packages/web/src/lib/api.ts` aggiunge `?edition=...` alle chiamate. Lo store `editionsStore` mantiene la lista, `editionStore` l'edizione attiva nella UI.

Niente testi fissi sull'edizione: le pagine pubbliche e `/dati` leggono l'edizione corrente; biglietto, email e check-in usano l'edizione del biglietto (un biglietto di un'altra edizione non fa check-in). I meta di `index.html` sono neutri perché i social non eseguono JavaScript. Anche i task sono per edizione (migration 0007); team, canvas (non più raggiungibile dalla UI), espositori e categorie restano globali.

### Stato e dati
- Stores Zustand in `packages/web/src/stores/` (uno per dominio: `eventsStore`, `artistsStore`, `mediaStore`, ...). Ogni feature legge/scrive il proprio store, non chiama direttamente `api.ts` da un componente.
- Tipi condivisi UI in `packages/web/src/types/` (i payload API sono tipati in `lib/api.ts`).
- Path alias: `@/...` → `packages/web/src/` (vite + tsconfig).

### Storage
- D1: binding `DB`, database `coincidenze-db`. Schema in `src/db/schema.sql`, migration incrementali in `src/db/migrations/` (numerate).
- R2: binding `MEDIA_BUCKET`, bucket `coincidenze-media`. Upload via `/api/upload`, validazione in `routes/upload.ts`.
- Email transazionali via Resend (binding env `RESEND_API_KEY`, sender `RESEND_FROM`).

### Quirk noto
`packages/api/src/index.ts` ha un middleware che riscrive al volo nelle response JSON i vecchi URL `coincidenze-api.lamaz7.workers.dev` → `api.coincidenze.org`, perché alcuni `image_url` salvati in DB prima dello switch al custom domain puntano ancora lì. Da rimuovere quando il DB sarà ripulito.

### App installabile e notifiche push
Stesso impianto di Cadenza (progetto APILATES): l'area riservata è una PWA. `public/manifest.webmanifest` (start `/admin`, icone `icon-192/512`, `icon-512-maskable`, `apple-touch-icon`) e `public/sw.js` (niente cache e niente fetch handler, solo push e tocco sulla notifica). Manifest, meta per iPhone e service worker li aggiunge `enableAppMode()` (`src/lib/pwa.ts`) solo in AppShell, login e `/accesso/:token`: il sito pubblico non è installabile. La scheda "App e notifiche" sta in `/admin/account`. Lato API: tabella `push_subscriptions` (migration 0009), rotte `/api/push/*`, invio cifrato con `@block65/webcrypto-web-push` in `lib/push.ts`; `notifyPermission(env, permesso, nota)` avvisa gli utenti il cui ruolo ha quel permesso (nuovo accredito → `accrediti.view`, prenotazione spuntino → `spuntino.view`, promemoria delle 18 → `editoriale.view`). Su iPhone le push funzionano solo con l'app aggiunta alla Home.

### Header di sicurezza
CSP e Permissions-Policy del sito stanno in `packages/web/public/_headers`. Librerie e font sono nel bundle (html5-qrcode, qrcode-generator, Fontsource): niente CDN per gli script. Esterni ammessi: Cloudflare Web Analytics, player YouTube/Vimeo/SoundCloud (react-player), iframe di Google Maps, immagini QR da api.qrserver.com. Una nuova risorsa esterna va aggiunta alla CSP, altrimenti il browser la blocca senza errori visibili.

## Convenzioni
- Lingua UI: italiano. Identificatori in inglese (camelCase variabili, PascalCase componenti).
- CSS: Tailwind utility classes con palette custom COINCIDENZE.
- Mai committare i flag `--no-verify` o aggirare CI/hook.

## Palette
- Background: beige/crema `#F5F0E8`
- Primario: navy `#2C3E6B`
- Accento viola: `#6B3FA0` · bordeaux: `#8B2252`
- Testo: `#1a1a1a`
- Font titoli: Playfair Display · corpo: Inter
