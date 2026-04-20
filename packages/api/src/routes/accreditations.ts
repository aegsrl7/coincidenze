import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Context } from 'hono'
import type { Env } from '../index'
import { verifyToken } from './auth'
import { sendEmail, buildTicketEmail, buildAdminNotificationEmail } from '../lib/email'

const ADMIN_NOTIFICATION_TO = 'coincidenze.arte@gmail.com'

export const accreditationsRoutes = new Hono<Env>()

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

// POST / — pubblico: crea un accredito
accreditationsRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>

  // Honeypot: campo nascosto "company" — se compilato = bot, rispondi 200 senza salvare
  if (typeof body.company === 'string' && body.company.trim().length > 0) {
    return c.json({ ticket_code: 'ok' }, 201)
  }

  const name = sanitize(body.name)
  const surname = sanitize(body.surname)
  const email = sanitize(body.email).toLowerCase()
  const phone = sanitize(body.phone)
  const cap = sanitize(body.cap)
  const birthDate = sanitize(body.birth_date)
  const notes = sanitize(body.notes)

  if (!name || !surname) return c.json({ error: 'Nome e cognome obbligatori' }, 400)
  if (!isValidEmail(email)) return c.json({ error: 'Email non valida' }, 400)
  if (!body.consent_privacy) return c.json({ error: 'Consenso privacy obbligatorio' }, 400)

  const db = c.env.DB

  // Se l'email esiste già, restituisci il ticket esistente (idempotenza soft)
  const existing = await db
    .prepare('SELECT ticket_code FROM accreditations WHERE email = ?')
    .bind(email)
    .first<{ ticket_code: string }>()

  if (existing) {
    return c.json({ ticket_code: existing.ticket_code, existing: true }, 200)
  }

  const id = crypto.randomUUID()
  const ticketCode = crypto.randomUUID()

  await db
    .prepare(
      `INSERT INTO accreditations (
        id, ticket_code, name, surname, email, phone, cap, birth_date,
        consent_privacy, consent_newsletter, consent_photo, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      ticketCode,
      name,
      surname,
      email,
      phone,
      cap,
      birthDate,
      body.consent_privacy ? 1 : 0,
      body.consent_newsletter ? 1 : 0,
      body.consent_photo ? 1 : 0,
      notes
    )
    .run()

  // Invia email di conferma + notifica admin in parallelo
  const base = c.env.PUBLIC_BASE_URL?.replace(/\/$/, '') || 'https://coincidenze.org'
  const ticketUrl = `${base}/biglietto/${ticketCode}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=440x440&margin=10&data=${encodeURIComponent(ticketUrl)}`
  const ticketEmail = buildTicketEmail({ name: `${name} ${surname}`, ticketUrl, qrUrl })

  const totalRow = await db
    .prepare('SELECT COUNT(*) as c FROM accreditations')
    .first<{ c: number }>()
  const totalCount = totalRow?.c ?? 0
  const adminEmail = buildAdminNotificationEmail({ name, surname, email, phone, cap, totalCount })

  const [emailRes, adminRes] = await Promise.all([
    sendEmail(c.env, { to: email, subject: ticketEmail.subject, html: ticketEmail.html, text: ticketEmail.text }),
    sendEmail(c.env, { to: ADMIN_NOTIFICATION_TO, subject: adminEmail.subject, html: adminEmail.html, text: adminEmail.text }),
  ])

  if (emailRes.ok) {
    await db
      .prepare('UPDATE accreditations SET email_sent_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?')
      .bind(id)
      .run()
  } else {
    console.error('Email fallita per accredito', id, emailRes.error)
  }

  if (!adminRes.ok) {
    console.error('Notifica admin fallita per accredito', id, adminRes.error)
  }

  return c.json({ ticket_code: ticketCode, email_sent: emailRes.ok }, 201)
})

// GET /:code — pubblico: recupera un accredito tramite ticket_code (per la pagina biglietto)
accreditationsRoutes.get('/by-code/:code', async (c) => {
  const code = c.req.param('code')
  const row = await c.env.DB
    .prepare(
      `SELECT id, ticket_code, name, surname, email, checked_in_at, created_at
       FROM accreditations WHERE ticket_code = ?`
    )
    .bind(code)
    .first()

  if (!row) return c.json({ error: 'Biglietto non trovato' }, 404)
  return c.json(row)
})

// GET / — admin: lista completa
accreditationsRoutes.get('/', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)

  const { results } = await c.env.DB
    .prepare('SELECT * FROM accreditations ORDER BY created_at DESC')
    .all()
  return c.json(results)
})

// POST /:code/check-in — admin: segna l'accredito come presente
accreditationsRoutes.post('/:code/check-in', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)

  const code = c.req.param('code')
  const row = await c.env.DB
    .prepare('SELECT id, checked_in_at FROM accreditations WHERE ticket_code = ?')
    .bind(code)
    .first<{ id: string; checked_in_at: string | null }>()

  if (!row) return c.json({ error: 'Biglietto non trovato' }, 404)

  const alreadyCheckedIn = row.checked_in_at !== null
  const now = new Date().toISOString()

  if (!alreadyCheckedIn) {
    await c.env.DB
      .prepare('UPDATE accreditations SET checked_in_at = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(now, row.id)
      .run()
  }

  const full = await c.env.DB
    .prepare('SELECT * FROM accreditations WHERE id = ?')
    .bind(row.id)
    .first()

  return c.json({ accreditation: full, already_checked_in: alreadyCheckedIn })
})

// POST /:code/uncheck-in — admin: annulla il check-in
accreditationsRoutes.post('/:code/uncheck-in', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)

  const code = c.req.param('code')
  const row = await c.env.DB
    .prepare('SELECT id, checked_in_at FROM accreditations WHERE ticket_code = ?')
    .bind(code)
    .first<{ id: string; checked_in_at: string | null }>()

  if (!row) return c.json({ error: 'Biglietto non trovato' }, 404)

  if (row.checked_in_at !== null) {
    await c.env.DB
      .prepare("UPDATE accreditations SET checked_in_at = NULL, updated_at = datetime('now') WHERE id = ?")
      .bind(row.id)
      .run()
  }

  const full = await c.env.DB
    .prepare('SELECT * FROM accreditations WHERE id = ?')
    .bind(row.id)
    .first()

  return c.json({ accreditation: full })
})

// DELETE /:id — admin
accreditationsRoutes.delete('/:id', async (c) => {
  if (!(await isAuthed(c))) return c.json({ error: 'Non autenticato' }, 401)

  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM accreditations WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})
