import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Context } from 'hono'
import type { Env } from '../index'
import { verifyToken } from './auth'
import { sendEmail, buildSpuntinoEmail, buildSpuntinoAdminNotificationEmail } from '../lib/email'
import { resolveEdition, getCurrentEdition } from '../lib/edition'

export const spuntinoRoutes = new Hono<Env>()

const ADMIN_NOTIFICATION_TO = 'coincidenze.arte@gmail.com'

async function isAuthed(c: Context<Env>): Promise<boolean> {
  const token = getCookie(c, 'auth_token')
  if (!token) return false
  const secret = c.env.AUTH_SECRET
  if (!secret) return false
  return verifyToken(token, secret)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitize(s: unknown): string {
  if (typeof s !== 'string') return ''
  return s.trim().slice(0, 500)
}

async function sumSeats(db: D1Database, editionId: string): Promise<number> {
  const row = await db
    .prepare('SELECT COALESCE(SUM(seats), 0) AS total FROM spuntino_bookings WHERE edition_id = ?')
    .bind(editionId)
    .first<{ total: number }>()
  return row?.total ?? 0
}

// GET /status — pubblico: stato apri/chiudi e contatore prenotazioni dell'edizione corrente
spuntinoRoutes.get('/status', async (c) => {
  const edition = await getCurrentEdition(c.env.DB)
  if (!edition) return c.json({ open: false, taken: 0 })
  const taken = await sumSeats(c.env.DB, edition.id)
  return c.json({ open: edition.spuntino_open === 1, taken })
})

// PUT /status — admin: cambia spuntino_open dell'edizione corrente
// (workflow legacy; oggi consigliamo PATCH /editions/:id)
spuntinoRoutes.put('/status', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const edition = await getCurrentEdition(c.env.DB)
  if (!edition) return c.json({ error: 'Nessuna edizione attiva' }, 503)
  const body = (await c.req.json().catch(() => ({}))) as { open?: unknown }
  const value = body.open ? 1 : 0
  await c.env.DB
    .prepare("UPDATE editions SET spuntino_open = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(value, edition.id)
    .run()
  return c.json({ open: value === 1 })
})

// POST / — pubblico: crea prenotazione per l'edizione corrente
spuntinoRoutes.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>

  if (typeof body.company === 'string' && body.company.trim().length > 0) {
    return c.json({ ok: true }, 201) // honeypot
  }

  const edition = await getCurrentEdition(c.env.DB)
  if (!edition) return c.json({ error: 'Nessuna edizione attiva' }, 503)
  if (edition.spuntino_open !== 1) return c.json({ error: 'Le prenotazioni sono chiuse.' }, 423)

  const name = sanitize(body.name)
  const surname = sanitize(body.surname)
  const email = sanitize(body.email).toLowerCase()
  const phone = sanitize(body.phone)
  const notes = sanitize(body.notes)
  const seats = Math.max(1, Math.min(20, Number.parseInt(String(body.seats ?? '1'), 10) || 1))

  if (!name || !surname) return c.json({ error: 'Nome e cognome obbligatori' }, 400)
  if (!isValidEmail(email)) return c.json({ error: 'Email non valida' }, 400)
  if (!phone) return c.json({ error: 'Telefono obbligatorio' }, 400)
  if (!body.consent_privacy) return c.json({ error: 'Consenso privacy obbligatorio' }, 400)

  const id = crypto.randomUUID()
  await c.env.DB
    .prepare(
      `INSERT INTO spuntino_bookings (id, edition_id, name, surname, email, phone, seats, notes, consent_privacy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, edition.id, name, surname, email, phone, seats, notes, 1)
    .run()

  const totalBookedSeats = await sumSeats(c.env.DB, edition.id)

  const participantEmail = buildSpuntinoEmail({ name: `${name} ${surname}`, seats })
  const adminEmail = buildSpuntinoAdminNotificationEmail({
    name, surname, email, phone, seats, notes, totalBookedSeats,
  })

  const [emailRes, adminRes] = await Promise.all([
    sendEmail(c.env, { to: email, subject: participantEmail.subject, html: participantEmail.html, text: participantEmail.text }),
    sendEmail(c.env, { to: ADMIN_NOTIFICATION_TO, subject: adminEmail.subject, html: adminEmail.html, text: adminEmail.text }),
  ])

  if (emailRes.ok) {
    await c.env.DB
      .prepare("UPDATE spuntino_bookings SET email_sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?")
      .bind(id)
      .run()
  } else {
    console.error('Email spuntino fallita per', id, emailRes.error)
  }
  if (!adminRes.ok) {
    console.error('Notifica admin spuntino fallita per', id, adminRes.error)
  }

  return c.json({ id, seats, total_booked: totalBookedSeats, email_sent: emailRes.ok }, 201)
})

// GET / — admin: lista (filtrata per edizione, default = corrente o ?edition=slug)
spuntinoRoutes.get('/', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const edition = await resolveEdition(c)
  const { results } = edition
    ? await c.env.DB
        .prepare('SELECT * FROM spuntino_bookings WHERE edition_id = ? ORDER BY created_at DESC')
        .bind(edition.id)
        .all()
    : await c.env.DB.prepare('SELECT * FROM spuntino_bookings ORDER BY created_at DESC').all()
  return c.json(results)
})

spuntinoRoutes.put('/:id', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>

  const existing = await c.env.DB
    .prepare('SELECT id FROM spuntino_bookings WHERE id = ?')
    .bind(id)
    .first()
  if (!existing) return c.json({ error: 'Prenotazione non trovata' }, 404)

  const name = sanitize(body.name)
  const surname = sanitize(body.surname)
  const email = sanitize(body.email).toLowerCase()
  const phone = sanitize(body.phone)
  const notes = sanitize(body.notes)
  const seats = Math.max(1, Math.min(20, Number.parseInt(String(body.seats ?? '1'), 10) || 1))

  if (!name || !surname) return c.json({ error: 'Nome e cognome obbligatori' }, 400)
  if (!isValidEmail(email)) return c.json({ error: 'Email non valida' }, 400)

  await c.env.DB
    .prepare(
      `UPDATE spuntino_bookings
       SET name = ?, surname = ?, email = ?, phone = ?, seats = ?, notes = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(name, surname, email, phone, seats, notes, id)
    .run()

  const row = await c.env.DB
    .prepare('SELECT * FROM spuntino_bookings WHERE id = ?')
    .bind(id)
    .first()
  return c.json(row)
})

spuntinoRoutes.delete('/:id', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM spuntino_bookings WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})
