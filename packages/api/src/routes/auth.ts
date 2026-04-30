import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import type { Env } from '../index'

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

// POST /auth/login
authRoutes.post('/login', async (c) => {
  const { password } = await c.req.json().catch(() => ({}))
  const secret = c.env.AUTH_SECRET

  if (!secret) {
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

  if (password !== secret) {
    await c.env.DB
      .prepare("INSERT INTO login_attempts (ip, failed_at) VALUES (?, datetime('now'))")
      .bind(ip)
      .run()
    return c.json({ error: 'Password errata' }, 401)
  }

  // Login OK: pulisci i fallimenti pregressi per questo IP.
  await c.env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run()

  // Create a session token (HMAC-based)
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const timestamp = Date.now().toString()
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp))
  const token = `${timestamp}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`

  const isLocal = new URL(c.req.url).hostname === 'localhost'
  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: !isLocal,
    sameSite: isLocal ? 'Lax' : 'None',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return c.json({ authenticated: true })
})

// POST /auth/logout
authRoutes.post('/logout', async (c) => {
  const isLocal = new URL(c.req.url).hostname === 'localhost'
  deleteCookie(c, 'auth_token', {
    path: '/',
    secure: !isLocal,
    sameSite: isLocal ? 'Lax' : 'None',
  })
  return c.json({ authenticated: false })
})

// GET /auth/me
authRoutes.get('/me', async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) {
    return c.json({ authenticated: false })
  }

  const secret = c.env.AUTH_SECRET
  if (!secret) {
    return c.json({ authenticated: false })
  }

  const valid = await verifyToken(token, secret)
  return c.json({ authenticated: valid })
})

export async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    const [timestamp, sig] = token.split('.')
    if (!timestamp || !sig) return false

    // Token expires after 7 days
    const age = Date.now() - parseInt(timestamp)
    if (age > 7 * 24 * 60 * 60 * 1000) return false

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const sigBytes = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0))
    return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(timestamp))
  } catch {
    return false
  }
}
