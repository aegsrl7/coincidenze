import { Hono } from 'hono'
import type { Env } from '../index'
import { resolveEdition } from '../lib/edition'

export const menuRoutes = new Hono<Env>()

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

async function ensureMenuCategory(db: D1Database, label: string): Promise<void> {
  const trimmed = label.trim()
  if (!trimmed) return
  const slug = slugify(trimmed)
  if (!slug) return
  const existing = await db
    .prepare('SELECT id FROM categories WHERE type = ? AND slug = ?')
    .bind('menu', slug)
    .first()
  if (existing) return
  const next = await db
    .prepare("SELECT COALESCE(MAX(sort_order), -10) + 10 AS next FROM categories WHERE type = 'menu'")
    .first<{ next: number }>()
  await db
    .prepare('INSERT INTO categories (id, type, slug, label, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), 'menu', slug, trimmed, '', next?.next ?? 0)
    .run()
}

// GET / — pubblico (filtrato per edizione)
menuRoutes.get('/', async (c) => {
  const edition = await resolveEdition(c)
  const { results } = edition
    ? await c.env.DB
        .prepare('SELECT * FROM menu_items WHERE edition_id = ? ORDER BY sort_order, name')
        .bind(edition.id)
        .all()
    : await c.env.DB.prepare('SELECT * FROM menu_items ORDER BY sort_order, name').all()
  return c.json(results)
})

menuRoutes.post('/', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const category = body.category || ''
  const edition = await resolveEdition(c)
  const editionId = body.edition_id || edition?.id || null
  await db.prepare(
    'INSERT INTO menu_items (id, edition_id, category, name, description, price, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id,
    editionId,
    category,
    body.name || '',
    body.description || '',
    body.price || '',
    body.notes || '',
    body.sort_order ?? 0
  ).run()
  await ensureMenuCategory(db, category)
  return c.json({ id, edition_id: editionId, ...body }, 201)
})

// IMPORTANTE: la route specifica /reorder DEVE precedere /:id, altrimenti
// Hono matcha /:id prima e l'update finisce su un id="reorder" inesistente.
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

menuRoutes.put('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()
  const category = body.category || ''
  if (body.edition_id !== undefined) {
    await db
      .prepare("UPDATE menu_items SET edition_id = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(body.edition_id || null, id)
      .run()
  }
  await db.prepare(
    `UPDATE menu_items SET category = ?, name = ?, description = ?, price = ?, notes = ?, sort_order = ?,
     updated_at = datetime('now') WHERE id = ?`
  ).bind(
    category,
    body.name || '',
    body.description || '',
    body.price || '',
    body.notes || '',
    body.sort_order ?? 0,
    id
  ).run()
  await ensureMenuCategory(db, category)
  return c.json({ id, ...body })
})

menuRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM menu_items WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})
