import { Hono } from 'hono'
import type { Env } from '../index'
import { resolveEdition } from '../lib/edition'
import { canSeeNotes, withoutNotes } from '../lib/session'

export const mediaRoutes = new Hono<Env>()

mediaRoutes.get('/', async (c) => {
  const edition = await resolveEdition(c)
  const { results } = edition
    ? await c.env.DB
        .prepare('SELECT * FROM media_items WHERE edition_id = ? ORDER BY created_at DESC')
        .bind(edition.id)
        .all()
    : await c.env.DB.prepare('SELECT * FROM media_items ORDER BY created_at DESC').all()
  const rows = results as Record<string, unknown>[]
  return c.json(canSeeNotes(c.get('role')) ? rows : rows.map(withoutNotes))
})

mediaRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const edition = await resolveEdition(c)
  const editionId = body.edition_id || edition?.id || null
  const adminNotes = canSeeNotes(c.get('role'))
  await c.env.DB.prepare(
    'INSERT INTO media_items (id, edition_id, title, type, url, thumbnail_url, artist_id, category, duration, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, editionId, body.title, body.type, body.url, body.thumbnailUrl || '', body.artistId || null, body.category || null, body.duration || null, adminNotes ? body.notes || '' : '').run()
  const created = { id, edition_id: editionId, ...body }
  return c.json(adminNotes ? created : withoutNotes(created), 201)
})

mediaRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  if (body.edition_id !== undefined) {
    await c.env.DB
      .prepare("UPDATE media_items SET edition_id = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(body.edition_id || null, id)
      .run()
  }
  // Le note le scrive solo l'admin: per gli altri restano quelle già salvate
  const adminNotes = canSeeNotes(c.get('role'))
  await c.env.DB.prepare(
    `UPDATE media_items SET title = ?, type = ?, url = ?, thumbnail_url = ?, artist_id = ?, category = ?, duration = ?${adminNotes ? ', notes = ?' : ''}, updated_at = datetime('now') WHERE id = ?`
  ).bind(body.title, body.type, body.url, body.thumbnailUrl || '', body.artistId || null, body.category || null, body.duration || null, ...(adminNotes ? [body.notes || ''] : []), id).run()
  const updated = { id, ...body }
  return c.json(adminNotes ? updated : withoutNotes(updated))
})

mediaRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM media_items WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})
