import { Hono } from 'hono'
import type { Env } from '../index'
import { resolveEdition } from '../lib/edition'

export const editorialRoutes = new Hono<Env>()

function parseArtistiCoinvolti(raw: unknown): string[] {
  if (!raw || typeof raw !== 'string' || raw === '[]') return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

editorialRoutes.get('/', async (c) => {
  const edition = await resolveEdition(c)
  const db = c.env.DB
  const { results } = edition
    ? await db.prepare('SELECT * FROM editorial_posts WHERE edition_id = ? ORDER BY data').bind(edition.id).all()
    : await db.prepare('SELECT * FROM editorial_posts ORDER BY data').all()
  const mapped = (results as Record<string, unknown>[]).map((r) => ({
    ...r,
    artisti_coinvolti: parseArtistiCoinvolti(r.artisti_coinvolti),
  }))
  return c.json(mapped)
})

editorialRoutes.get('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const result = await db.prepare('SELECT * FROM editorial_posts WHERE id = ?').bind(id).first()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json({
    ...result,
    artisti_coinvolti: parseArtistiCoinvolti((result as Record<string, unknown>).artisti_coinvolti),
  })
})

editorialRoutes.post('/', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const artistiJson = body.artisti_coinvolti?.length ? JSON.stringify(body.artisti_coinvolti) : '[]'
  const edition = await resolveEdition(c)
  const editionId = body.edition_id || edition?.id || null
  await db.prepare(
    'INSERT INTO editorial_posts (id, edition_id, data, fase, tag, emoji, titolo, descrizione, caption_suggerita, formato, stato, canva_design_id, artisti_coinvolti, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id,
    editionId,
    body.data,
    body.fase ?? 1,
    body.tag || 'teaser',
    body.emoji || '',
    body.titolo,
    body.descrizione || '',
    body.caption_suggerita || '',
    body.formato || '',
    body.stato || 'da_fare',
    body.canva_design_id || null,
    artistiJson,
    body.note || ''
  ).run()
  return c.json({ id, edition_id: editionId, ...body, artisti_coinvolti: body.artisti_coinvolti || [] }, 201)
})

editorialRoutes.put('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.json()
  const artistiJson = body.artisti_coinvolti?.length ? JSON.stringify(body.artisti_coinvolti) : '[]'
  if (body.edition_id !== undefined) {
    await db
      .prepare("UPDATE editorial_posts SET edition_id = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(body.edition_id || null, id)
      .run()
  }
  await db.prepare(
    'UPDATE editorial_posts SET data = ?, fase = ?, tag = ?, emoji = ?, titolo = ?, descrizione = ?, caption_suggerita = ?, formato = ?, stato = ?, canva_design_id = ?, artisti_coinvolti = ?, note = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(
    body.data,
    body.fase ?? 1,
    body.tag || 'teaser',
    body.emoji || '',
    body.titolo,
    body.descrizione || '',
    body.caption_suggerita || '',
    body.formato || '',
    body.stato || 'da_fare',
    body.canva_design_id || null,
    artistiJson,
    body.note || '',
    id
  ).run()
  return c.json({ id, ...body, artisti_coinvolti: body.artisti_coinvolti || [] })
})

editorialRoutes.delete('/:id', async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  await db.prepare('DELETE FROM editorial_posts WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})
