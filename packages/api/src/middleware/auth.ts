import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { Env } from '../index'

interface Access {
  /** Permesso per leggere (GET). 'public' = anche senza login. */
  read: string | 'public'
  /** Permesso per scrivere (POST/PUT/PATCH, e DELETE se `remove` non è indicato). */
  write: string
  /** Permesso per cancellare (DELETE). Se assente vale `write`. */
  remove?: string
}

/**
 * Controllo d'accesso per gruppo di rotte. L'utente arriva da `c.get('user')`,
 * impostato in index.ts per tutte le richieste /api/*.
 * Le OPTIONS di preflight le chiude prima il middleware CORS.
 */
export function requirePermission(access: Access) {
  return createMiddleware<Env>(async (c, next) => {
    const isRead = c.req.method === 'GET' || c.req.method === 'HEAD'
    const needed = isRead
      ? access.read
      : c.req.method === 'DELETE' && access.remove ? access.remove : access.write
    if (needed === 'public') return next()

    const user = c.get('user')
    if (!user) return c.json({ error: 'Non autenticato' }, 401)
    if (!user.permissions.has(needed)) return c.json({ error: 'Non autorizzato' }, 403)
    return next()
  })
}

/** Risposta per chi non può: 401 se anonimo, 403 se loggato senza il permesso. */
export function deny(c: Context<Env>) {
  return c.get('user')
    ? c.json({ error: 'Non autorizzato' }, 403)
    : c.json({ error: 'Non autenticato' }, 401)
}
