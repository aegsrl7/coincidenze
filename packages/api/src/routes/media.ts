import { Hono } from 'hono'
import type { Env } from '../index'

export const mediaRoutes = new Hono<Env>()

mediaRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM media_items ORDER BY created_at DESC').all()
  return c.json(results)
})

mediaRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    'INSERT INTO media_items (id, title, type, url, thumbnail_url, artist_id, category, duration, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, body.title, body.type, body.url, body.thumbnailUrl || '', body.artistId || null, body.category || null, body.duration || null, body.notes || '').run()
  return c.json({ id, ...body }, 201)
})

mediaRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE media_items SET title = ?, type = ?, url = ?, thumbnail_url = ?, artist_id = ?, category = ?, duration = ?, notes = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(body.title, body.type, body.url, body.thumbnailUrl || '', body.artistId || null, body.category || null, body.duration || null, body.notes || '', id).run()
  return c.json({ id, ...body })
})

mediaRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM media_items WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})
