import { Hono } from 'hono'
import type { Env } from '../index'

// Riunioni organizzative. Lettura con riunioni.view, scrittura con riunioni.edit (middleware in index.ts)
export const meetingsRoutes = new Hono<Env>()

// Testi lunghi ma non illimitati: una trascrizione di 3 ore sta sotto i 300 KB
const LIMITS = { title: 200, participants: 300, summary: 50_000, prep_notes: 100_000, transcript: 600_000 }

function readFields(body: Record<string, unknown>) {
  const text = (k: keyof typeof LIMITS) => (typeof body[k] === 'string' ? (body[k] as string).trim().slice(0, LIMITS[k]) : '')
  const date = typeof body.meeting_date === 'string' ? body.meeting_date.trim() : ''
  return {
    title: text('title'),
    meeting_date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
    participants: text('participants'),
    summary: text('summary'),
    prep_notes: text('prep_notes'),
    transcript: text('transcript'),
  }
}

// GET / — elenco senza i testi lunghi
meetingsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare(
      `SELECT id, title, meeting_date, participants, substr(summary, 1, 400) AS summary_preview,
              length(transcript) > 0 AS has_transcript, length(prep_notes) > 0 AS has_prep_notes,
              created_at, updated_at
       FROM meetings ORDER BY meeting_date DESC, created_at DESC`
    )
    .all()
  return c.json(results.map((r) => ({ ...r, has_transcript: r.has_transcript === 1, has_prep_notes: r.has_prep_notes === 1 })))
})

// GET /:id — riunione completa
meetingsRoutes.get('/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM meetings WHERE id = ?').bind(c.req.param('id')).first()
  if (!row) return c.json({ error: 'Riunione non trovata' }, 404)
  return c.json(row)
})

meetingsRoutes.post('/', async (c) => {
  const f = readFields((await c.req.json().catch(() => ({}))) as Record<string, unknown>)
  if (!f.title) return c.json({ error: 'Titolo obbligatorio' }, 400)
  if (!f.meeting_date) return c.json({ error: 'Data non valida (AAAA-MM-GG)' }, 400)
  const id = crypto.randomUUID()
  await c.env.DB
    .prepare(
      `INSERT INTO meetings (id, title, meeting_date, participants, summary, prep_notes, transcript, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, f.title, f.meeting_date, f.participants, f.summary, f.prep_notes, f.transcript, c.get('user')!.id)
    .run()
  return c.json(await c.env.DB.prepare('SELECT * FROM meetings WHERE id = ?').bind(id).first(), 201)
})

meetingsRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare('SELECT id FROM meetings WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ error: 'Riunione non trovata' }, 404)
  const f = readFields((await c.req.json().catch(() => ({}))) as Record<string, unknown>)
  if (!f.title) return c.json({ error: 'Titolo obbligatorio' }, 400)
  if (!f.meeting_date) return c.json({ error: 'Data non valida (AAAA-MM-GG)' }, 400)
  await c.env.DB
    .prepare(
      `UPDATE meetings SET title = ?, meeting_date = ?, participants = ?, summary = ?, prep_notes = ?,
         transcript = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .bind(f.title, f.meeting_date, f.participants, f.summary, f.prep_notes, f.transcript, id)
    .run()
  return c.json(await c.env.DB.prepare('SELECT * FROM meetings WHERE id = ?').bind(id).first())
})

meetingsRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM meetings WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})
