# COINCIDENZE - Dashboard Evento

## Progetto
Dashboard organizzativa per COINCIDENZE - "raffinate casualità, occhi attenti".
Evento misto convegno/festival, Edizione 1, 25 aprile 2026, Marsam Locanda, Bene Vagienna.

## Tech Stack
- **Frontend**: React 18 + Vite + TypeScript, shadcn/ui + Tailwind CSS v4, React Flow, Zustand
- **Backend**: Cloudflare Workers + Hono + D1 (SQLite)
- **Monorepo**: npm workspaces (`packages/web`, `packages/api`)

## Struttura
```
packages/web/   → Frontend React (Vite)
packages/api/   → Backend Cloudflare Worker (Hono)
```

## Comandi
```bash
npm run dev        # Avvia frontend + backend
npm run dev:web    # Solo frontend (porta 5173)
npm run dev:api    # Solo backend (porta 8787)
npm run build      # Build frontend
```

## Convenzioni
- Lingua UI: Italiano
- Nomi file/variabili: inglese (camelCase per variabili, PascalCase per componenti)
- CSS: Tailwind utility classes, palette custom COINCIDENZE
- Stato: Zustand stores in `packages/web/src/stores/`
- API: REST, routes in `packages/api/src/routes/`
- Database: Cloudflare D1, schema in `packages/api/src/db/schema.sql`

## Palette
- Background: beige/crema (#F5F0E8)
- Primario: navy (#2C3E6B)
- Accento viola: #6B3FA0
- Accento bordeaux: #8B2252
- Testo: #1a1a1a
- Font titoli: Playfair Display
- Font corpo: Inter
