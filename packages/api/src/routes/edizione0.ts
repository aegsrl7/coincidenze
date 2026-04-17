import { Hono } from 'hono'
import type { Env } from '../index'

export const edizione0Routes = new Hono<Env>()

// Gallery
edizione0Routes.get('/gallery', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare('SELECT * FROM edizione0_gallery ORDER BY sort_order, created_at').all()
  return c.json(results)
})

edizione0Routes.post('/gallery', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = crypto.randomUUID()
  await db.prepare(
    'INSERT INTO edizione0_gallery (id, image_url, caption, sort_order) VALUES (?, ?, ?, ?)'
  ).bind(id, body.image_url, body.caption || '', body.sort_order || 0).run()
  const result = await db.prepare('SELECT * FROM edizione0_gallery WHERE id = ?').bind(id).first()
  return c.json(result, 201)
})

edizione0Routes.put('/gallery/reorder', async (c) => {
  const db = c.env.DB
  const body = await c.req.json<{ order: string[] }>()
  const stmts = body.order.map((id, i) =>
    db.prepare('UPDATE edizione0_gallery SET sort_order = ? WHERE id = ?').bind(i, id)
  )
  await db.batch(stmts)
  return c.json({ ok: true })
})

edizione0Routes.delete('/gallery/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  await db.prepare('DELETE FROM edizione0_gallery WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// Content sections
edizione0Routes.get('/content', async (c) => {
  const db = c.env.DB
  const { results } = await db.prepare('SELECT * FROM edizione0_content').all()
  return c.json(results)
})

edizione0Routes.put('/content/:section', async (c) => {
  const db = c.env.DB
  const section = c.req.param('section')
  const body = await c.req.json()
  await db.prepare(
    `INSERT INTO edizione0_content (id, section, content, updated_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(section) DO UPDATE SET content = ?, updated_at = datetime('now')`
  ).bind(crypto.randomUUID(), section, body.content, body.content).run()
  const result = await db.prepare('SELECT * FROM edizione0_content WHERE section = ?').bind(section).first()
  return c.json(result)
})
