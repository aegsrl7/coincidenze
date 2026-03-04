import { Hono } from 'hono'
import type { Env } from '../index'

export const teamRoutes = new Hono<Env>()

teamRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM team_members ORDER BY name').all()
  return c.json(results)
})

teamRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    'INSERT INTO team_members (id, name, role, email, phone, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, body.name, body.role || '', body.email || '', body.phone || '', body.notes || '').run()
  return c.json({ id, ...body }, 201)
})

teamRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE team_members SET name = ?, role = ?, email = ?, phone = ?, notes = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(body.name, body.role || '', body.email || '', body.phone || '', body.notes || '', id).run()
  return c.json({ id, ...body })
})

teamRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM team_members WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})
