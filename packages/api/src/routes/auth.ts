import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Env } from '../index'
import {
  createSessionToken, setSessionCookie, clearSessionCookie, safeEqual, type SessionUser,
} from '../lib/session'
import { hashPassword, verifyPassword, spendPasswordTime, passwordProblem } from '../lib/passwords'
import {
  clientIp, tooManyAttempts, recordAttempt, clearAttempts, TOO_MANY,
  normalizeEmail, isValidEmail, countManagers, findUserToken, sendAccessLink,
} from '../lib/accounts'

export const authRoutes = new Hono<Env>()

const ADMIN_ROLE_ID = 'role-admin'

function mePayload(user: SessionUser | null) {
  if (!user) return { authenticated: false, user: null, permissions: [] as string[] }
  return {
    authenticated: true,
    user: { id: user.id, name: user.name, email: user.email, role: { id: user.roleId, name: user.roleName } },
    permissions: [...user.permissions],
  }
}

/** Apre la sessione: cookie firmato, ultimo accesso aggiornato. */
async function startSession(c: Context<Env>, userId: string): Promise<boolean> {
  const row = await c.env.DB
    .prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ? RETURNING session_version")
    .bind(userId)
    .first<{ session_version: number }>()
  if (!row) return false
  const token = await createSessionToken(c.env, userId, row.session_version)
  if (!token) return false
  setSessionCookie(c, token)
  return true
}

const SESSION_ERROR = 'Configurazione delle sessioni mancante (SESSION_SECRET)'

// GET /auth/me
authRoutes.get('/me', (c) => c.json(mePayload(c.get('user'))))

// POST /auth/login — email e password personali
authRoutes.post('/login', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { email?: unknown; password?: unknown }
  const email = normalizeEmail(body.email)
  const password = typeof body.password === 'string' ? body.password : ''

  const ip = clientIp(c)
  if (await tooManyAttempts(c.env.DB, ip, 'login')) return c.json({ error: TOO_MANY }, 429)

  const user = email
    ? await c.env.DB
        .prepare('SELECT id, password_hash, active FROM users WHERE email = ?')
        .bind(email)
        .first<{ id: string; password_hash: string | null; active: number }>()
    : null

  let ok = false
  if (user && user.active === 1 && user.password_hash) {
    ok = await verifyPassword(password, user.password_hash)
  } else {
    await spendPasswordTime(password)
  }

  if (!ok || !user) {
    await recordAttempt(c.env.DB, ip, 'login')
    return c.json({ error: 'Email o password errate' }, 401)
  }

  await clearAttempts(c.env.DB, ip, 'login')
  if (!(await startSession(c, user.id))) return c.json({ error: SESSION_ERROR }, 500)
  return c.json({ ok: true })
})

// POST /auth/logout
authRoutes.post('/logout', (c) => {
  clearSessionCookie(c)
  return c.json(mePayload(null))
})

// GET /auth/setup-status — serve il primo accesso? (nessun amministratore attivo)
authRoutes.get('/setup-status', async (c) => {
  return c.json({ needsSetup: (await countManagers(c.env.DB)) === 0 })
})

// POST /auth/setup — crea (o ripristina) un amministratore con la password condivisa
// AUTH_SECRET. Funziona solo quando non c'è nessun amministratore attivo.
authRoutes.post('/setup', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const ip = clientIp(c)
  if (await tooManyAttempts(c.env.DB, ip, 'setup')) return c.json({ error: TOO_MANY }, 429)

  if ((await countManagers(c.env.DB)) > 0) {
    return c.json({ error: 'Esiste già un amministratore: entra con email e password' }, 409)
  }
  const secret = typeof body.secret === 'string' ? body.secret : ''
  if (!c.env.AUTH_SECRET || !secret || !safeEqual(secret, c.env.AUTH_SECRET)) {
    await recordAttempt(c.env.DB, ip, 'setup')
    return c.json({ error: 'Password attuale errata' }, 401)
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : ''
  const email = normalizeEmail(body.email)
  if (!name) return c.json({ error: 'Nome obbligatorio' }, 400)
  if (!isValidEmail(email)) return c.json({ error: 'Email non valida' }, 400)
  const problem = passwordProblem(body.password)
  if (problem) return c.json({ error: problem }, 400)

  const hash = await hashPassword(body.password as string)
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>()
  const userId = existing?.id ?? crypto.randomUUID()
  if (existing) {
    await c.env.DB
      .prepare(
        `UPDATE users SET name = ?, role_id = ?, password_hash = ?, active = 1,
           session_version = session_version + 1, updated_at = datetime('now') WHERE id = ?`
      )
      .bind(name, ADMIN_ROLE_ID, hash, userId)
      .run()
  } else {
    await c.env.DB
      .prepare('INSERT INTO users (id, email, name, role_id, password_hash) VALUES (?, ?, ?, ?, ?)')
      .bind(userId, email, name, ADMIN_ROLE_ID, hash)
      .run()
  }

  await clearAttempts(c.env.DB, ip, 'setup')
  if (!(await startSession(c, userId))) return c.json({ error: SESSION_ERROR }, 500)
  return c.json({ ok: true }, existing ? 200 : 201)
})

// POST /auth/forgot — manda il link per scegliere una nuova password.
// Risponde sempre allo stesso modo, così non rivela quali email sono registrate.
authRoutes.post('/forgot', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { email?: unknown }
  const email = normalizeEmail(body.email)
  const ip = clientIp(c)
  if (await tooManyAttempts(c.env.DB, ip, 'forgot')) return c.json({ error: TOO_MANY }, 429)
  await recordAttempt(c.env.DB, ip, 'forgot')

  if (isValidEmail(email)) {
    const user = await c.env.DB
      .prepare(
        `SELECT u.id, u.email, u.name, u.password_hash, r.name AS role_name
         FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ? AND u.active = 1`
      )
      .bind(email)
      .first<{ id: string; email: string; name: string; password_hash: string | null; role_name: string }>()
    if (user) {
      await sendAccessLink(c.env, {
        id: user.id, email: user.email, name: user.name, hasPassword: !!user.password_hash, roleName: user.role_name,
      })
    }
  }
  return c.json({ ok: true })
})

// GET /auth/token/:token — dati per la pagina "scegli la password"
authRoutes.get('/token/:token', async (c) => {
  const info = await findUserToken(c.env.DB, c.req.param('token'))
  if (!info) return c.json({ error: 'Link non valido o scaduto' }, 404)
  return c.json({ purpose: info.purpose, email: info.email, name: info.name })
})

// POST /auth/set-password — sceglie la password da un link di invito o reset
authRoutes.post('/set-password', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { token?: unknown; password?: unknown }
  const info = await findUserToken(c.env.DB, typeof body.token === 'string' ? body.token : '')
  if (!info) return c.json({ error: 'Link non valido o scaduto' }, 404)
  const problem = passwordProblem(body.password)
  if (problem) return c.json({ error: problem }, 400)

  const hash = await hashPassword(body.password as string)
  await c.env.DB.batch([
    c.env.DB
      .prepare(
        `UPDATE users SET password_hash = ?, session_version = session_version + 1,
           updated_at = datetime('now') WHERE id = ?`
      )
      .bind(hash, info.userId),
    c.env.DB.prepare("UPDATE user_tokens SET used_at = datetime('now') WHERE token_hash = ?").bind(info.tokenHash),
  ])

  if (!(await startSession(c, info.userId))) return c.json({ error: SESSION_ERROR }, 500)
  return c.json({ ok: true })
})

// POST /auth/password — cambia la propria password (chiude le altre sessioni)
authRoutes.post('/password', async (c) => {
  const user = c.get('user')
  if (!user) return c.json({ error: 'Non autenticato' }, 401)
  const body = (await c.req.json().catch(() => ({}))) as { current?: unknown; password?: unknown }

  const row = await c.env.DB
    .prepare('SELECT password_hash FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ password_hash: string }>()
  const current = typeof body.current === 'string' ? body.current : ''
  if (!row || !(await verifyPassword(current, row.password_hash))) {
    return c.json({ error: 'Password attuale errata' }, 400)
  }
  const problem = passwordProblem(body.password)
  if (problem) return c.json({ error: problem }, 400)

  await c.env.DB
    .prepare(
      `UPDATE users SET password_hash = ?, session_version = session_version + 1,
         updated_at = datetime('now') WHERE id = ?`
    )
    .bind(await hashPassword(body.password as string), user.id)
    .run()

  if (!(await startSession(c, user.id))) return c.json({ error: SESSION_ERROR }, 500)
  return c.json({ ok: true })
})
