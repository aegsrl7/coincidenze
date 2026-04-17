import { Hono } from 'hono'
import type { Env } from '../index'

export const menuRoutes = new Hono<Env>()

// GET / — pubblico
menuRoutes.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM menu_items ORDER BY category, sort_order, name')
    .all()
  return c.json(results)
})

menuRoutes.post('/', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = crypto.randomUUID()
  await db.prepare(
    'INSERT INTO menu_items (id, category, name, description, price, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id,
    body.category || '',
    body.name || '',
    body.description || '',
    body.price || '',
    body.notes || '',
    body.sort_order ?? 0
  ).run()
  return c.json({ id, ...body }, 201)
})

menuRoutes.put('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()
  await db.prepare(
    `UPDATE menu_items SET category = ?, name = ?, description = ?, price = ?, notes = ?, sort_order = ?,
     updated_at = datetime('now') WHERE id = ?`
  ).bind(
    body.category || '',
    body.name || '',
    body.description || '',
    body.price || '',
    body.notes || '',
    body.sort_order ?? 0,
    id
  ).run()
  return c.json({ id, ...body })
})

menuRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM menu_items WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

menuRoutes.put('/reorder', async (c) => {
  const db = c.env.DB
  const { order } = await c.req.json() as { order: string[] }
  if (!Array.isArray(order)) return c.json({ error: 'order must be an array' }, 400)

  const stmts = order.map((id, idx) =>
    db.prepare('UPDATE menu_items SET sort_order = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(idx, id)
  )
  await db.batch(stmts)
  return c.json({ ok: true })
})
