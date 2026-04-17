import { Hono } from 'hono'
import type { Env } from '../index'

export const eventsRoutes = new Hono<Env>()

// Parse artist_ids from DB: JSON array string or empty
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
  const db = c.env.DB
  const { results } = await db.prepare('SELECT * FROM events ORDER BY date, start_time').all()
  const mapped = (results as Record<string, unknown>[]).map((r) => ({
    ...r,
    artist_ids: parseArtistIds(r.artist_ids),
  }))
  return c.json(mapped)
})

eventsRoutes.get('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const result = await db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json({
    ...result,
    artist_ids: parseArtistIds((result as Record<string, unknown>).artist_ids),
  })
})

eventsRoutes.post('/', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const artistIdsJson = body.artist_ids?.length ? JSON.stringify(body.artist_ids) : '[]'
  await db.prepare(
    'INSERT INTO events (id, title, description, date, start_time, end_time, location, category, artist_ids, exhibitor_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, body.title, body.description || '', body.date, body.start_time || body.startTime, body.end_time || body.endTime || '', body.location || '', body.category, artistIdsJson, body.exhibitor_id || body.exhibitorId || null, body.notes || '').run()
  return c.json({ id, ...body, artist_ids: body.artist_ids || [] }, 201)
})

eventsRoutes.put('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()
  const artistIdsJson = body.artist_ids?.length ? JSON.stringify(body.artist_ids) : '[]'
  await db.prepare(
    'UPDATE events SET title = ?, description = ?, date = ?, start_time = ?, end_time = ?, location = ?, category = ?, artist_ids = ?, exhibitor_id = ?, notes = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(body.title, body.description || '', body.date, body.start_time || body.startTime, body.end_time || body.endTime || '', body.location || '', body.category, artistIdsJson, body.exhibitor_id || body.exhibitorId || null, body.notes || '', id).run()
  return c.json({ id, ...body, artist_ids: body.artist_ids || [] })
})

eventsRoutes.delete('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})
