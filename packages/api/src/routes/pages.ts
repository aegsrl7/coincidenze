import { Hono } from 'hono'
import type { Env } from '../index'
import { resolveEdition } from '../lib/edition'
import { can } from '../lib/session'

/**
 * Spunti: pagine e sottopagine per edizione. Lettura con spunti.view, scrittura con spunti.edit,
 * eliminazione con spunti.delete (middleware in index.ts). Il testo arriva come JSON dell'editor:
 * si controlla che lo sia e non si salva mai HTML.
 */
export const pagesRoutes = new Hono<Env>()

const MAX_JSON = 500_000
const MAX_TEXT = 200_000
const MAX_TAGS = 12

type PageRow = Record<string, unknown> & { tags: string }

const SELECT_PAGE = `
  SELECT p.*, e.slug AS edition_slug, cu.name AS created_by_name, uu.name AS updated_by_name
  FROM pages p
  LEFT JOIN editions e ON e.id = p.edition_id
  LEFT JOIN users cu ON cu.id = p.created_by
  LEFT JOIN users uu ON uu.id = p.updated_by`

const withTags = <T extends PageRow>(row: T) => {
  let tags: unknown = []
  try { tags = JSON.parse(row.tags) } catch { /* resta vuoto */ }
  return { ...row, tags: Array.isArray(tags) ? tags : [] }
}

async function getPage(db: D1Database, id: string) {
  const row = await db.prepare(`${SELECT_PAGE} WHERE p.id = ?`).bind(id).first<PageRow>()
  return row ? withTags(row) : null
}

function cleanTags(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const out: string[] = []
  for (const t of input) {
    if (typeof t !== 'string') continue
    const tag = t.trim().replace(/\s+/g, ' ').slice(0, 30)
    if (tag && !out.some((o) => o.toLowerCase() === tag.toLowerCase())) out.push(tag)
  }
  return out.slice(0, MAX_TAGS)
}

/** '' (pagina vuota) oppure un documento dell'editor: { type: 'doc', content: [...] } */
function cleanContent(input: unknown): string | null {
  if (input === '' || input == null) return ''
  if (typeof input !== 'string' || input.length > MAX_JSON) return null
  try {
    const doc = JSON.parse(input)
    return doc && doc.type === 'doc' && (doc.content === undefined || Array.isArray(doc.content)) ? input : null
  } catch {
    return null
  }
}

// GET / — pagine dell'edizione (?edition=slug, default corrente), senza il JSON del testo
pagesRoutes.get('/', async (c) => {
  const edition = await resolveEdition(c)
  const { results } = await c.env.DB
    .prepare(
      `SELECT p.id, p.parent_id, p.title, p.tags, p.sort_order, p.created_at, p.updated_at,
              substr(p.content_text, 1, 2000) AS text,
              cu.name AS created_by_name, uu.name AS updated_by_name,
              (SELECT count(*) FROM page_comments pc WHERE pc.page_id = p.id) AS comment_count
       FROM pages p
       LEFT JOIN users cu ON cu.id = p.created_by
       LEFT JOIN users uu ON uu.id = p.updated_by
       WHERE ${edition ? 'p.edition_id = ?' : 'p.edition_id IS NULL'}
       ORDER BY p.sort_order, p.created_at`
    )
    .bind(...(edition ? [edition.id] : []))
    .all<PageRow>()
  return c.json(results.map(withTags))
})

pagesRoutes.get('/:id', async (c) => {
  const page = await getPage(c.env.DB, c.req.param('id'))
  if (!page) return c.json({ error: 'Pagina non trovata' }, 404)
  return c.json(page)
})

// POST / — nuova pagina; una sottopagina sta sempre nell'edizione della pagina madre
pagesRoutes.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const parentId = typeof body.parent_id === 'string' && body.parent_id ? body.parent_id : null
  let editionId: string | null
  if (parentId) {
    const parent = await c.env.DB.prepare('SELECT edition_id FROM pages WHERE id = ?').bind(parentId).first<{ edition_id: string | null }>()
    if (!parent) return c.json({ error: 'Pagina madre non trovata' }, 404)
    editionId = parent.edition_id
  } else {
    editionId = (await resolveEdition(c))?.id ?? null
  }
  const next = await c.env.DB
    .prepare(`SELECT coalesce(max(sort_order), 0) + 1 AS n FROM pages WHERE ${parentId ? 'parent_id = ?' : 'parent_id IS NULL AND edition_id IS ?'}`)
    .bind(parentId ?? editionId)
    .first<{ n: number }>()
  const id = crypto.randomUUID()
  const userId = c.get('user')!.id
  await c.env.DB
    .prepare(
      `INSERT INTO pages (id, edition_id, parent_id, title, tags, sort_order, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, editionId, parentId, typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '',
      JSON.stringify(cleanTags(body.tags)), next?.n ?? 1, userId, userId)
    .run()
  return c.json(await getPage(c.env.DB, id), 201)
})

// PUT /:id — salva titolo, testo ed etichette. Serve la versione letta: se nel frattempo
// qualcun altro ha salvato, risponde 409 con la pagina aggiornata e non sovrascrive.
pagesRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const version = Number(body.version)
  if (!Number.isInteger(version)) return c.json({ error: 'Versione mancante' }, 400)
  const content = cleanContent(body.content_json)
  if (content === null) return c.json({ error: 'Testo non valido o troppo lungo' }, 400)
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : ''
  const text = typeof body.content_text === 'string' ? body.content_text.slice(0, MAX_TEXT) : ''

  const res = await c.env.DB
    .prepare(
      `UPDATE pages SET title = ?, content_json = ?, content_text = ?, tags = ?, version = version + 1,
         updated_by = ?, updated_at = datetime('now')
       WHERE id = ? AND version = ?`
    )
    .bind(title, content, text, JSON.stringify(cleanTags(body.tags)), c.get('user')!.id, id, version)
    .run()
  const page = await getPage(c.env.DB, id)
  if (!page) return c.json({ error: 'Pagina non trovata' }, 404)
  if (!res.meta.changes) return c.json({ error: 'La pagina è stata modificata nel frattempo', page }, 409)
  return c.json(page)
})

// DELETE /:id — la pagina, tutte le sottopagine e i loro commenti
pagesRoutes.delete('/:id', async (c) => {
  const tree = `WITH RECURSIVE sub(id) AS (SELECT id FROM pages WHERE id = ?1
                  UNION ALL SELECT p.id FROM pages p JOIN sub ON p.parent_id = sub.id)`
  const id = c.req.param('id')
  const [, removed] = await c.env.DB.batch([
    c.env.DB.prepare(`${tree} DELETE FROM page_comments WHERE page_id IN (SELECT id FROM sub)`).bind(id),
    c.env.DB.prepare(`${tree} DELETE FROM pages WHERE id IN (SELECT id FROM sub)`).bind(id),
  ])
  if (!removed.meta.changes) return c.json({ error: 'Pagina non trovata' }, 404)
  return c.json({ ok: true, deleted: removed.meta.changes })
})

/**
 * Commenti. Basta spunti.view per leggerli e scriverli (middleware in index.ts);
 * si cancellano i propri, quelli degli altri solo con spunti.delete.
 */
export const pageCommentsRoutes = new Hono<Env>()

const SELECT_COMMENT = `SELECT pc.id, pc.page_id, pc.user_id, pc.body, pc.created_at, u.name AS user_name
  FROM page_comments pc LEFT JOIN users u ON u.id = pc.user_id`

pageCommentsRoutes.get('/', async (c) => {
  const pageId = c.req.query('page') ?? ''
  const { results } = await c.env.DB.prepare(`${SELECT_COMMENT} WHERE pc.page_id = ? ORDER BY pc.created_at`).bind(pageId).all()
  return c.json(results)
})

pageCommentsRoutes.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const pageId = typeof body.page_id === 'string' ? body.page_id : ''
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 5000) : ''
  if (!text) return c.json({ error: 'Commento vuoto' }, 400)
  const page = await c.env.DB.prepare('SELECT id FROM pages WHERE id = ?').bind(pageId).first()
  if (!page) return c.json({ error: 'Pagina non trovata' }, 404)
  const id = crypto.randomUUID()
  await c.env.DB.prepare('INSERT INTO page_comments (id, page_id, user_id, body) VALUES (?, ?, ?, ?)')
    .bind(id, pageId, c.get('user')!.id, text).run()
  return c.json(await c.env.DB.prepare(`${SELECT_COMMENT} WHERE pc.id = ?`).bind(id).first(), 201)
})

pageCommentsRoutes.delete('/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT user_id FROM page_comments WHERE id = ?').bind(c.req.param('id')).first<{ user_id: string | null }>()
  if (!row) return c.json({ error: 'Commento non trovato' }, 404)
  if (row.user_id !== c.get('user')!.id && !can(c, 'spunti.delete')) return c.json({ error: 'Non autorizzato' }, 403)
  await c.env.DB.prepare('DELETE FROM page_comments WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})
