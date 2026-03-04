import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import type { Env } from '../index'

export const authRoutes = new Hono<Env>()

// POST /auth/login
authRoutes.post('/login', async (c) => {
  const { password } = await c.req.json()
  const secret = c.env.AUTH_SECRET

  if (!secret) {
    return c.json({ error: 'AUTH_SECRET non configurato' }, 500)
  }

  if (password !== secret) {
    return c.json({ error: 'Password errata' }, 401)
  }

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
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return c.json({ authenticated: true })
})

// POST /auth/logout
authRoutes.post('/logout', async (c) => {
  deleteCookie(c, 'auth_token', { path: '/' })
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
