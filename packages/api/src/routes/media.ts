import { Hono } from 'hono'
import type { Env } from '../index'
import { resolveEdition } from '../lib/edition'

export const mediaRoutes = new Hono<Env>()

mediaRoutes.get('/', async (c) => {
  const edition = await resolveEdition(c)
  const { results } = edition
    ? await c.env.DB
        .prepare('SELECT * FROM media_items WHERE edition_id = ? ORDER BY created_at DESC')
        .bind(edition.id)
        .all()
    : await c.env.DB.prepare('SELECT * FROM media_items ORDER BY created_at DESC').all()
  return c.json(results)
})

mediaRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const edition = await resolveEdition(c)
  const editionId = body.edition_id || edition?.id || null
  await c.env.DB.prepare(
    'INSERT INTO media_items (id, edition_id, title, type, url, thumbnail_url, artist_id, category, duration, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, editionId, body.title, body.type, body.url, body.thumbnailUrl || '', body.artistId || null, body.category || null, body.duration || null, body.notes || '').run()
  return c.json({ id, edition_id: editionId, ...body }, 201)
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
  await c.env.DB.prepare(
    'UPDATE media_items SET title = ?, type = ?, url = ?, thumbnail_url = ?, artist_id = ?, category = ?, duration = ?, notes = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(body.title, body.type, body.url, body.thumbnailUrl || '', body.artistId || null, body.category || null, body.duration || null, body.notes || '', id).run()
  return c.json({ id, ...body })
})

mediaRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM media_items WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})
