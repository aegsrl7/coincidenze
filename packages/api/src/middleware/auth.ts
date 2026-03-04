import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import type { Env } from '../index'
import { verifyToken } from '../routes/auth'

export const requireAuth = createMiddleware<Env>(async (c, next) => {
  // Only protect write operations
  if (c.req.method === 'GET') {
    return next()
  }

  const token = getCookie(c, 'auth_token')
  if (!token) {
    return c.json({ error: 'Non autenticato' }, 401)
  }

  const secret = c.env.AUTH_SECRET
  if (!secret) {
    return c.json({ error: 'AUTH_SECRET non configurato' }, 500)
  }

  const valid = await verifyToken(token, secret)
  if (!valid) {
    return c.json({ error: 'Sessione scaduta' }, 401)
  }

  return next()
})
