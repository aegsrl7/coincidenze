import { Hono } from 'hono'
import type { Env } from '../index'

export const artistsRoutes = new Hono<Env>()

artistsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM artists ORDER BY name').all()
  return c.json(results)
})

artistsRoutes.get('/:id', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM artists WHERE id = ?').bind(c.req.param('id')).first()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result)
})

artistsRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    'INSERT INTO artists (id, name, bio, category, image_url, website, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, body.name, body.bio || '', body.category, body.imageUrl || '', body.website || '', body.notes || '').run()
  return c.json({ id, ...body }, 201)
})

artistsRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE artists SET name = ?, bio = ?, category = ?, image_url = ?, website = ?, notes = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(body.name, body.bio || '', body.category, body.imageUrl || '', body.website || '', body.notes || '', id).run()
  return c.json({ id, ...body })
})

artistsRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM artists WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})
