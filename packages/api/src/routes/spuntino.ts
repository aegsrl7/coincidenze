import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Context } from 'hono'
import type { Env } from '../index'
import { verifyToken } from './auth'
import { sendEmail, buildSpuntinoEmail, buildSpuntinoAdminNotificationEmail } from '../lib/email'

export const spuntinoRoutes = new Hono<Env>()

const ADMIN_NOTIFICATION_TO = 'coincidenze.arte@gmail.com'
const STATUS_KEY = 'spuntino_status' // valore atteso: 'open' | 'closed'

// Bootstrap lazy: la prima richiesta per isolate verifica/crea le tabelle.
// Idempotente, evita migrazioni manuali separate.
let schemaReady = false
async function ensureSchema(db: D1Database): Promise<void> {
  if (schemaReady) return
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS spuntino_bookings (
         id TEXT PRIMARY KEY,
         name TEXT NOT NULL,
         surname TEXT NOT NULL,
         email TEXT NOT NULL,
         phone TEXT DEFAULT '',
         seats INTEGER NOT NULL DEFAULT 1,
         notes TEXT DEFAULT '',
         consent_privacy INTEGER NOT NULL DEFAULT 0,
         email_sent_at TEXT,
         created_at TEXT DEFAULT (datetime('now')),
         updated_at TEXT DEFAULT (datetime('now'))
       )`
    )
    .run()
  // edizione1_content esiste già — la usiamo per persistere lo stato apri/chiudi
  schemaReady = true
}

spuntinoRoutes.use('*', async (c, next) => {
  await ensureSchema(c.env.DB)
  await next()
})

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

async function sumSeats(db: D1Database): Promise<number> {
  const row = await db
    .prepare('SELECT COALESCE(SUM(seats), 0) AS total FROM spuntino_bookings')
    .first<{ total: number }>()
  return row?.total ?? 0
}

async function isOpen(db: D1Database): Promise<boolean> {
  const row = await db
    .prepare('SELECT content FROM edizione1_content WHERE section = ?')
    .bind(STATUS_KEY)
    .first<{ content: string }>()
  // default = aperto se mai impostato
  return (row?.content ?? 'open') !== 'closed'
}

// IMPORTANTE: route specifiche prima di /:id, vedi memoria.

// GET /status — pubblico: stato apri/chiudi e contatore prenotazioni
spuntinoRoutes.get('/status', async (c) => {
  const [open, taken] = await Promise.all([isOpen(c.env.DB), sumSeats(c.env.DB)])
  return c.json({ open, taken })
})

// PUT /status — admin: cambia stato
spuntinoRoutes.put('/status', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const body = (await c.req.json().catch(() => ({}))) as { open?: unknown }
  const value = body.open ? 'open' : 'closed'
  await c.env.DB
    .prepare(
      `INSERT INTO edizione1_content (id, section, content, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(section) DO UPDATE SET content = ?, updated_at = datetime('now')`
    )
    .bind(crypto.randomUUID(), STATUS_KEY, value, value)
    .run()
  return c.json({ open: value === 'open' })
})

// POST / — pubblico: crea prenotazione
spuntinoRoutes.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>

  if (typeof body.company === 'string' && body.company.trim().length > 0) {
    return c.json({ ok: true }, 201) // honeypot
  }

  if (!(await isOpen(c.env.DB))) {
    return c.json({ error: 'Le prenotazioni sono chiuse.' }, 423)
  }

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
      `INSERT INTO spuntino_bookings (id, name, surname, email, phone, seats, notes, consent_privacy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, name, surname, email, phone, seats, notes, 1)
    .run()

  // Conta dopo l'insert per la mail admin (no race conditions sul counter pubblico)
  const totalBookedSeats = await sumSeats(c.env.DB)

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

// GET / — admin: lista completa
spuntinoRoutes.get('/', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const { results } = await c.env.DB
    .prepare('SELECT * FROM spuntino_bookings ORDER BY created_at DESC')
    .all()
  return c.json(results)
})

// DELETE /:id — admin
spuntinoRoutes.delete('/:id', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM spuntino_bookings WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})
