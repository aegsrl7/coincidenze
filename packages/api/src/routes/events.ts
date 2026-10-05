import { Hono } from 'hono'
import type { Env } from '../index'
import { resolveEdition } from '../lib/edition'
import { can, withoutNotes } from '../lib/session'

export const eventsRoutes = new Hono<Env>()

function parseArtistIds(raw: unknown): string[] {
  if (!raw || typeof raw !== 'string' || raw === '[]') return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

eventsRoutes.get('/', async (c) => {
  const edition = await resolveEdition(c)
  const db = c.env.DB
  let results: Record<string, unknown>[] = []
  if (edition) {
    const r = await db
      .prepare('SELECT * FROM events WHERE edition_id = ? ORDER BY date, start_time')
      .bind(edition.id)
      .all()
    results = r.results as Record<string, unknown>[]
  } else {
    const r = await db.prepare('SELECT * FROM events ORDER BY date, start_time').all()
    results = r.results as Record<string, unknown>[]
  }
  const mapped = results.map((r) => ({
    ...r,
    artist_ids: parseArtistIds(r.artist_ids),
  }))
  return c.json(can(c, 'note.view') ? mapped : mapped.map(withoutNotes))
})

eventsRoutes.get('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const result = await db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first<Record<string, unknown>>()
  if (!result) return c.json({ error: 'Not found' }, 404)
  const event = { ...result, artist_ids: parseArtistIds(result.artist_ids) }
  return c.json(can(c, 'note.view') ? event : withoutNotes(event))
})

eventsRoutes.post('/', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const artistIdsJson = body.artist_ids?.length ? JSON.stringify(body.artist_ids) : '[]'
  const edition = await resolveEdition(c)
  const editionId = body.edition_id || edition?.id || null
  const withNotes = can(c, 'note.view')
  await db.prepare(
    'INSERT INTO events (id, edition_id, title, description, date, start_time, end_time, location, category, artist_ids, exhibitor_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id,
    editionId,
    body.title,
    body.description || '',
    body.date,
    body.start_time || body.startTime,
    body.end_time || body.endTime || '',
    body.location || '',
    body.category,
    artistIdsJson,
    body.exhibitor_id || body.exhibitorId || null,
    withNotes ? body.notes || '' : ''
  ).run()
  const created = { id, edition_id: editionId, ...body, artist_ids: body.artist_ids || [] }
  return c.json(withNotes ? created : withoutNotes(created), 201)
})

eventsRoutes.put('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()
  const artistIdsJson = body.artist_ids?.length ? JSON.stringify(body.artist_ids) : '[]'
  // edition_id è cambiabile via PUT solo esplicitamente
  if (body.edition_id !== undefined) {
    await db
      .prepare('UPDATE events SET edition_id = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(body.edition_id || null, id)
      .run()
  }
  // Le note le scrive solo chi ha note.view: per gli altri restano quelle già salvate
  const withNotes = can(c, 'note.view')
  await db.prepare(
    `UPDATE events SET title = ?, description = ?, date = ?, start_time = ?, end_time = ?, location = ?, category = ?, artist_ids = ?, exhibitor_id = ?${withNotes ? ', notes = ?' : ''}, updated_at = datetime('now') WHERE id = ?`
  ).bind(
    body.title,
    body.description || '',
    body.date,
    body.start_time || body.startTime,
    body.end_time || body.endTime || '',
    body.location || '',
    body.category,
    artistIdsJson,
    body.exhibitor_id || body.exhibitorId || null,
    ...(withNotes ? [body.notes || ''] : []),
    id
  ).run()
  const updated = { id, ...body, artist_ids: body.artist_ids || [] }
  return c.json(withNotes ? updated : withoutNotes(updated))
})

eventsRoutes.delete('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})
