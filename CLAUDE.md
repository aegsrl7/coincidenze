# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Progetto
Dashboard organizzativa per COINCIDENZE — "raffinate casualità, occhi attenti".
Evento misto convegno/festival, Edizione 1, 25 aprile 2026, Marsam Locanda, Bene Vagienna.

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
npm run db:seed --workspace=packages/api      # carica seed.sql

# Deploy manuale (di solito non serve, vedi sotto)
npm run deploy --workspace=packages/api       # deploy Worker
```

In dev il frontend chiama `/api` e Vite fa proxy verso `http://localhost:8787` (`vite.config.ts`). In produzione il client usa direttamente `https://api.coincidenze.org/api` (`packages/web/src/lib/api.ts`).

## Deploy
Push su `main` → GitHub Actions (`.github/workflows/deploy.yml`) deploya in parallelo:
- Pages (`coincidenze.org`) da `packages/web/dist`
- Worker (`api.coincidenze.org`) da `packages/api`

**Le migration D1 di produzione sono manuali**: applicare i file in `packages/api/src/db/migrations/NNNN_*.sql` con `wrangler d1 execute coincidenze-db --remote --file=...`.

## Architettura

### Routing & auth
- `packages/api/src/index.ts` monta tutte le route Hono sotto `/api/*`, più `/dati` (HTML statico).
- Il middleware `requireAuth` (`packages/api/src/middleware/auth.ts`) **lascia passare i GET** e blocca solo POST/PUT/DELETE: questo permette letture pubbliche su risorse altrimenti admin. Le route pubbliche di mutazione (es. `/api/accrediti` POST, `/api/spuntino` POST) montano l'auth selettivamente al loro interno invece che a livello router.
- Frontend: rotte pubbliche in `App.tsx` (es. `/biglietto/:code`, `/accrediti`, `/spuntino`, `/:editionSlug`), tutto `/admin/*` è dietro `<RequireAuth>` + `<AppShell>`. Esistono redirect legacy da `/canvas`, `/programma`, ecc. verso `/admin/*`.
- React Router v7 **non supporta param parziali** (es. `/edizione-:slug`): le edizioni usano un full-segment param `/:editionSlug` validato in `EditionRoute` (vedi commento in `App.tsx:88`).

### Multi-edizione (concetto centrale)
La tabella `editions` è il punto di scoping per quasi tutti i contenuti (`artists`, `events`, `media`, `menu_items`, accrediti, spuntino). I flag `is_current`, `accrediti_open`, `spuntino_open` sull'edizione corrente guidano la home pubblica e l'apertura dei form.

Sul backend `packages/api/src/lib/edition.ts` espone `resolveEdition(c)` che legge `?edition=<slug>` dalla query e ricade sull'edizione corrente. Le route che servono dati pubblici scoped per edizione devono usarlo.

Sul frontend l'helper `withEdition(path, slug)` in `packages/web/src/lib/api.ts` aggiunge `?edition=...` alle chiamate. Lo store `editionsStore` mantiene la lista, `editionStore` l'edizione attiva nella UI.

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
