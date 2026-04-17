import { Hono } from 'hono'
import type { Env } from '../index'

export const categoriesRoutes = new Hono<Env>()

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

// GET / — pubblico (label/color sono informazioni pubbliche)
categoriesRoutes.get('/', async (c) => {
  const type = c.req.query('type')
  const db = c.env.DB
  let result
  if (type === 'artist' || type === 'menu') {
    const r = await db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY sort_order, label').bind(type).all()
    result = r.results
  } else {
    const r = await db.prepare('SELECT * FROM categories ORDER BY type, sort_order, label').all()
    result = r.results
  }
  return c.json(result)
})

categoriesRoutes.post('/', async (c) => {
  const body = await c.req.json() as Record<string, unknown>
  const type = String(body.type || '')
  if (type !== 'artist' && type !== 'menu') return c.json({ error: 'type deve essere artist o menu' }, 400)

  const label = String(body.label || '').trim()
  if (!label) return c.json({ error: 'Label obbligatoria' }, 400)

  const providedSlug = typeof body.slug === 'string' ? body.slug.trim() : ''
  const slug = providedSlug ? slugify(providedSlug) : slugify(label)
  if (!slug) return c.json({ error: 'Slug non valido' }, 400)

  const color = typeof body.color === 'string' ? body.color : ''
  const sort_order = typeof body.sort_order === 'number' ? body.sort_order : 999

  const id = crypto.randomUUID()
  try {
    await c.env.DB
      .prepare('INSERT INTO categories (id, type, slug, label, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, type, slug, label, color, sort_order)
      .run()
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (/UNIQUE/.test(msg)) return c.json({ error: `Categoria "${slug}" già esistente per ${type}` }, 409)
    return c.json({ error: 'Errore creazione' }, 500)
  }
  const row = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first()
  return c.json(row, 201)
})

categoriesRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json() as Record<string, unknown>

  const existing = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first<{ slug: string; type: string }>()
  if (!existing) return c.json({ error: 'Non trovata' }, 404)

  const label = typeof body.label === 'string' ? body.label : undefined
  const color = typeof body.color === 'string' ? body.color : undefined
  const sort_order = typeof body.sort_order === 'number' ? body.sort_order : undefined

  const fields: string[] = []
  const params: unknown[] = []
  if (label !== undefined) { fields.push('label = ?'); params.push(label) }
  if (color !== undefined) { fields.push('color = ?'); params.push(color) }
  if (sort_order !== undefined) { fields.push('sort_order = ?'); params.push(sort_order) }
  if (fields.length === 0) return c.json({ error: 'Nessun campo da aggiornare' }, 400)

  fields.push("updated_at = datetime('now')")
  params.push(id)
  await c.env.DB.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).bind(...params).run()

  const row = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first()
  return c.json(row)
})

categoriesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// PUT /reorder — bulk reorder for a given type. body: { type, order: [id1, id2, ...] }
categoriesRoutes.put('/reorder', async (c) => {
  const body = await c.req.json() as { order?: string[] }
  const order = body.order
  if (!Array.isArray(order)) return c.json({ error: 'order deve essere un array di id' }, 400)

  const stmts = order.map((id, idx) =>
    c.env.DB.prepare("UPDATE categories SET sort_order = ?, updated_at = datetime('now') WHERE id = ?").bind(idx * 10, id)
  )
  await c.env.DB.batch(stmts)
  return c.json({ ok: true })
})
