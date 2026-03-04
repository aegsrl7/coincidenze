import { Hono } from 'hono'
import type { Env } from '../index'

export const exhibitorsRoutes = new Hono<Env>()

exhibitorsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM exhibitors ORDER BY name').all()
  return c.json(results)
})

exhibitorsRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    'INSERT INTO exhibitors (id, name, description, category, contact_info, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, body.name, body.description || '', body.category, body.contactInfo || '', body.notes || '').run()
  return c.json({ id, ...body }, 201)
})

exhibitorsRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE exhibitors SET name = ?, description = ?, category = ?, contact_info = ?, notes = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(body.name, body.description || '', body.category, body.contactInfo || '', body.notes || '', id).run()
  return c.json({ id, ...body })
})

exhibitorsRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM exhibitors WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})
