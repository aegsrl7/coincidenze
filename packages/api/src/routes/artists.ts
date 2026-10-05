import { Hono } from 'hono'
import type { Env } from '../index'
import { resolveEdition } from '../lib/edition'
import { can, withoutNotes } from '../lib/session'

export const artistsRoutes = new Hono<Env>()

artistsRoutes.get('/', async (c) => {
  const edition = await resolveEdition(c)
  const { results } = edition
    ? await c.env.DB.prepare('SELECT * FROM artists WHERE edition_id = ? ORDER BY name').bind(edition.id).all()
    : await c.env.DB.prepare('SELECT * FROM artists ORDER BY name').all()
  const rows = results as Record<string, unknown>[]
  return c.json(can(c, 'note.view') ? rows : rows.map(withoutNotes))
})

artistsRoutes.get('/:id', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM artists WHERE id = ?').bind(c.req.param('id')).first<Record<string, unknown>>()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(can(c, 'note.view') ? result : withoutNotes(result))
})

artistsRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const edition = await resolveEdition(c)
  const editionId = body.edition_id || edition?.id || null
  const withNotes = can(c, 'note.view')
  await c.env.DB.prepare(
    'INSERT INTO artists (id, edition_id, name, bio, category, image_url, website, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, editionId, body.name, body.bio || '', body.category, body.imageUrl || '', body.website || '', withNotes ? body.notes || '' : '').run()
  const created = { id, edition_id: editionId, ...body }
  return c.json(withNotes ? created : withoutNotes(created), 201)
})

artistsRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  if (body.edition_id !== undefined) {
    await c.env.DB
      .prepare("UPDATE artists SET edition_id = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(body.edition_id || null, id)
      .run()
  }
  // Le note le scrive solo chi ha note.view: per gli altri restano quelle già salvate
  const withNotes = can(c, 'note.view')
  await c.env.DB.prepare(
    `UPDATE artists SET name = ?, bio = ?, category = ?, image_url = ?, website = ?${withNotes ? ', notes = ?' : ''}, updated_at = datetime('now') WHERE id = ?`
  ).bind(body.name, body.bio || '', body.category, body.imageUrl || '', body.website || '', ...(withNotes ? [body.notes || ''] : []), id).run()
  const updated = { id, ...body }
  return c.json(withNotes ? updated : withoutNotes(updated))
})

artistsRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM artists WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})
