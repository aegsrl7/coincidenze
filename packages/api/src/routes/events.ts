import { Hono } from 'hono'
import type { Env } from '../index'

export const eventsRoutes = new Hono<Env>()

eventsRoutes.get('/', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare('SELECT * FROM events ORDER BY date, start_time').all()
  return c.json(results)
})

eventsRoutes.get('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const result = await db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result)
})

eventsRoutes.post('/', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = crypto.randomUUID()
  await db.prepare(
    'INSERT INTO events (id, title, description, date, start_time, end_time, location, category, artist_id, exhibitor_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, body.title, body.description || '', body.date, body.startTime, body.endTime || '', body.location || '', body.category, body.artistId || null, body.exhibitorId || null, body.notes || '').run()
  return c.json({ id, ...body }, 201)
})

eventsRoutes.put('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()
  await db.prepare(
    'UPDATE events SET title = ?, description = ?, date = ?, start_time = ?, end_time = ?, location = ?, category = ?, artist_id = ?, exhibitor_id = ?, notes = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(body.title, body.description || '', body.date, body.startTime, body.endTime || '', body.location || '', body.category, body.artistId || null, body.exhibitorId || null, body.notes || '', id).run()
  return c.json({ id, ...body })
})

eventsRoutes.delete('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})
