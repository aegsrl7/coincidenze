import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Context } from 'hono'
import type { Env } from '../index'
import { verifyToken } from './auth'
import { getCurrentEdition, getEditionBySlug, type EditionRow } from '../lib/edition'

export const editionsRoutes = new Hono<Env>()

async function isAuthed(c: Context<Env>): Promise<boolean> {
  const token = getCookie(c, 'auth_token')
  if (!token) return false
  const secret = c.env.AUTH_SECRET
  if (!secret) return false
  return verifyToken(token, secret)
}

function sanitize(s: unknown, max = 500): string {
  if (typeof s !== 'string') return ''
  return s.trim().slice(0, max)
}

function toBool(v: unknown): 0 | 1 {
  return v ? 1 : 0
}

// GET /editions — lista pubblica (senza dati sensibili)
editionsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM editions ORDER BY sort_order, year')
    .all<EditionRow>()
  return c.json(results)
})

// GET /editions/current — pubblico
editionsRoutes.get('/current', async (c) => {
  const edition = await getCurrentEdition(c.env.DB)
  if (!edition) return c.json({ error: 'Nessuna edizione attiva' }, 404)
  return c.json(edition)
})

// GET /editions/:slug — pubblico
editionsRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const edition = await getEditionBySlug(c.env.DB, slug)
  if (!edition) return c.json({ error: 'Edizione non trovata' }, 404)
  return c.json(edition)
})

// POST /editions — admin: crea
editionsRoutes.post('/', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>

  const slug = sanitize(body.slug, 64)
  const name = sanitize(body.name, 120)
  const year = Number.parseInt(String(body.year), 10)
  const eventDate = sanitize(body.event_date, 32)

  if (!slug || !/^edizione-[\w-]+$/.test(slug)) return c.json({ error: 'Slug invalido (es. edizione-2)' }, 400)
  if (!name) return c.json({ error: 'Nome obbligatorio' }, 400)
  if (!Number.isFinite(year) || year < 2024 || year > 2100) return c.json({ error: 'Anno invalido' }, 400)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return c.json({ error: 'Data evento invalida (YYYY-MM-DD)' }, 400)

  const id = `ed-${slug.replace(/^edizione-/, '')}`
  const existing = await c.env.DB.prepare('SELECT id FROM editions WHERE slug = ? OR id = ?').bind(slug, id).first()
  if (existing) return c.json({ error: 'Slug o ID già in uso' }, 409)

  const sortRow = await c.env.DB.prepare('SELECT MAX(sort_order) as m FROM editions').first<{ m: number | null }>()
  const sortOrder = (sortRow?.m ?? -1) + 1

  await c.env.DB
    .prepare(
      `INSERT INTO editions (
        id, slug, year, name, event_date, is_current, accrediti_open, spuntino_open,
        hero_image_url, hero_subtitle, hero_location, intro, sort_order
      ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      slug,
      year,
      name,
      eventDate,
      sanitize(body.hero_image_url, 500),
      sanitize(body.hero_subtitle, 200),
      sanitize(body.hero_location, 200) || 'Marsam Locanda · Bene Vagienna',
      sanitize(body.intro, 5000),
      sortOrder
    )
    .run()

  const row = await c.env.DB.prepare('SELECT * FROM editions WHERE id = ?').bind(id).first<EditionRow>()
  return c.json(row, 201)
})

// PATCH /editions/:id — admin: aggiorna campi liberamente
editionsRoutes.patch('/:id', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>

  const existing = await c.env.DB.prepare('SELECT * FROM editions WHERE id = ?').bind(id).first<EditionRow>()
  if (!existing) return c.json({ error: 'Edizione non trovata' }, 404)

  // Se cambia slug, valida formato e univocità
  let slug = existing.slug
  if (typeof body.slug === 'string' && body.slug !== existing.slug) {
    slug = sanitize(body.slug, 64)
    if (!/^edizione-[\w-]+$/.test(slug)) return c.json({ error: 'Slug invalido' }, 400)
    const dup = await c.env.DB.prepare('SELECT id FROM editions WHERE slug = ? AND id != ?').bind(slug, id).first()
    if (dup) return c.json({ error: 'Slug già in uso' }, 409)
  }

  const name = typeof body.name === 'string' ? sanitize(body.name, 120) : existing.name
  const year = typeof body.year === 'number' ? body.year : existing.year
  const eventDate = typeof body.event_date === 'string' ? sanitize(body.event_date, 32) : existing.event_date
  const heroImage = typeof body.hero_image_url === 'string' ? sanitize(body.hero_image_url, 500) : existing.hero_image_url
  const heroSubtitle = typeof body.hero_subtitle === 'string' ? sanitize(body.hero_subtitle, 200) : existing.hero_subtitle
  const heroLocation = typeof body.hero_location === 'string' ? sanitize(body.hero_location, 200) : existing.hero_location
  const intro = typeof body.intro === 'string' ? sanitize(body.intro, 5000) : existing.intro
  const accrediti = body.accrediti_open !== undefined ? toBool(body.accrediti_open) : existing.accrediti_open
  const spuntino = body.spuntino_open !== undefined ? toBool(body.spuntino_open) : existing.spuntino_open

  await c.env.DB
    .prepare(
      `UPDATE editions SET
        slug = ?, name = ?, year = ?, event_date = ?,
        hero_image_url = ?, hero_subtitle = ?, hero_location = ?, intro = ?,
        accrediti_open = ?, spuntino_open = ?,
        updated_at = datetime('now')
      WHERE id = ?`
    )
    .bind(slug, name, year, eventDate, heroImage, heroSubtitle, heroLocation, intro, accrediti, spuntino, id)
    .run()

  const row = await c.env.DB.prepare('SELECT * FROM editions WHERE id = ?').bind(id).first<EditionRow>()
  return c.json(row)
})

// POST /editions/:id/set-current — admin: imposta come edizione corrente
editionsRoutes.post('/:id/set-current', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const id = c.req.param('id')
  const exists = await c.env.DB.prepare('SELECT id FROM editions WHERE id = ?').bind(id).first()
  if (!exists) return c.json({ error: 'Edizione non trovata' }, 404)

  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE editions SET is_current = 0, updated_at = datetime(\'now\') WHERE is_current = 1'),
    c.env.DB.prepare('UPDATE editions SET is_current = 1, updated_at = datetime(\'now\') WHERE id = ?').bind(id),
  ])

  const row = await c.env.DB.prepare('SELECT * FROM editions WHERE id = ?').bind(id).first<EditionRow>()
  return c.json(row)
})

// DELETE /editions/:id — admin: elimina (cascade su gallery/content; eventi/accrediti scoped restano orfani)
editionsRoutes.delete('/:id', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const id = c.req.param('id')
  const row = await c.env.DB.prepare('SELECT is_current FROM editions WHERE id = ?').bind(id).first<{ is_current: number }>()
  if (!row) return c.json({ error: 'Edizione non trovata' }, 404)
  if (row.is_current === 1) return c.json({ error: 'Non puoi eliminare l\'edizione corrente' }, 400)

  await c.env.DB.prepare('DELETE FROM editions WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ── Gallery per edizione ────────────────────────────────────────────────

editionsRoutes.get('/:slug/gallery', async (c) => {
  const slug = c.req.param('slug')
  const edition = await getEditionBySlug(c.env.DB, slug)
  if (!edition) return c.json({ error: 'Edizione non trovata' }, 404)
  const { results } = await c.env.DB
    .prepare('SELECT * FROM editions_gallery WHERE edition_id = ? ORDER BY sort_order, created_at')
    .bind(edition.id)
    .all()
  return c.json(results)
})

editionsRoutes.post('/:slug/gallery', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const slug = c.req.param('slug')
  const edition = await getEditionBySlug(c.env.DB, slug)
  if (!edition) return c.json({ error: 'Edizione non trovata' }, 404)
  const body = await c.req.json()
  const id = crypto.randomUUID()
  await c.env.DB
    .prepare('INSERT INTO editions_gallery (id, edition_id, image_url, caption, sort_order) VALUES (?, ?, ?, ?, ?)')
    .bind(id, edition.id, body.image_url, body.caption || '', body.sort_order || 0)
    .run()
  const row = await c.env.DB.prepare('SELECT * FROM editions_gallery WHERE id = ?').bind(id).first()
  return c.json(row, 201)
})

editionsRoutes.put('/:slug/gallery/reorder', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const body = await c.req.json<{ order: string[] }>()
  const stmts = body.order.map((id, i) =>
    c.env.DB.prepare('UPDATE editions_gallery SET sort_order = ? WHERE id = ?').bind(i, id)
  )
  await c.env.DB.batch(stmts)
  return c.json({ ok: true })
})

editionsRoutes.delete('/:slug/gallery/:id', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM editions_gallery WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ── Content per edizione ────────────────────────────────────────────────

editionsRoutes.get('/:slug/content', async (c) => {
  const slug = c.req.param('slug')
  const edition = await getEditionBySlug(c.env.DB, slug)
  if (!edition) return c.json({ error: 'Edizione non trovata' }, 404)
  const { results } = await c.env.DB
    .prepare('SELECT * FROM editions_content WHERE edition_id = ?')
    .bind(edition.id)
    .all()
  return c.json(results)
})

editionsRoutes.put('/:slug/content/:section', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const slug = c.req.param('slug')
  const section = c.req.param('section')
  const edition = await getEditionBySlug(c.env.DB, slug)
  if (!edition) return c.json({ error: 'Edizione non trovata' }, 404)
  const body = await c.req.json()
  await c.env.DB
    .prepare(
      `INSERT INTO editions_content (id, edition_id, section, content, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(edition_id, section) DO UPDATE SET content = excluded.content, updated_at = datetime('now')`
    )
    .bind(crypto.randomUUID(), edition.id, section, body.content)
    .run()
  const row = await c.env.DB
    .prepare('SELECT * FROM editions_content WHERE edition_id = ? AND section = ?')
    .bind(edition.id, section)
    .first()
  return c.json(row)
})
