import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import type { Env } from '../index'
import { createToken, getRequestRole, safeEqual, type Role } from '../lib/session'

export const authRoutes = new Hono<Env>()

const LOGIN_MAX_FAILURES = 5
const LOGIN_WINDOW_MIN = 15

function clientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  return (
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  )
}

// POST /auth/login — la password decide il ruolo: AUTH_SECRET = admin, AGENCY_PASSWORD = agenzia
authRoutes.post('/login', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { password?: unknown }
  const password = typeof body.password === 'string' ? body.password : ''

  if (!c.env.AUTH_SECRET) {
    return c.json({ error: 'AUTH_SECRET non configurato' }, 500)
  }

  // Throttle: max LOGIN_MAX_FAILURES tentativi falliti per IP nella finestra.
  const ip = clientIp(c)
  const since = new Date(Date.now() - LOGIN_WINDOW_MIN * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const failuresRow = await c.env.DB
    .prepare("SELECT COUNT(*) AS c FROM login_attempts WHERE ip = ? AND failed_at > ?")
    .bind(ip, since)
    .first<{ c: number }>()
  if ((failuresRow?.c ?? 0) >= LOGIN_MAX_FAILURES) {
    return c.json(
      { error: `Troppi tentativi falliti. Riprova fra ${LOGIN_WINDOW_MIN} minuti.` },
      429
    )
  }

  let role: Role | null = null
  if (password && safeEqual(password, c.env.AUTH_SECRET)) role = 'admin'
  else if (password && c.env.AGENCY_PASSWORD && safeEqual(password, c.env.AGENCY_PASSWORD)) role = 'agency'

  if (!role) {
    await c.env.DB
      .prepare("INSERT INTO login_attempts (ip, failed_at) VALUES (?, datetime('now'))")
      .bind(ip)
      .run()
    return c.json({ error: 'Password errata' }, 401)
  }

  // Login OK: pulisci i fallimenti pregressi per questo IP.
  await c.env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run()

  const token = await createToken(c.env, role)
  if (!token) return c.json({ error: 'Configurazione sessione mancante' }, 500)

  const isLocal = new URL(c.req.url).hostname === 'localhost'
  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: !isLocal,
    sameSite: isLocal ? 'Lax' : 'None',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return c.json({ authenticated: true, role })
})

// POST /auth/logout
authRoutes.post('/logout', async (c) => {
  const isLocal = new URL(c.req.url).hostname === 'localhost'
  deleteCookie(c, 'auth_token', {
    path: '/',
    secure: !isLocal,
    sameSite: isLocal ? 'Lax' : 'None',
  })
  return c.json({ authenticated: false, role: null })
})

// GET /auth/me
authRoutes.get('/me', async (c) => {
  const role = await getRequestRole(c)
  return c.json({ authenticated: role !== null, role })
})
