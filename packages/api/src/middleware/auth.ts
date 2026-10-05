import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { Env } from '../index'
import type { Role } from '../lib/session'

export const ADMIN: Role[] = ['admin']
/** Admin più agenzia social/marketing. */
export const STAFF: Role[] = ['admin', 'agency']

interface Access {
  /** Chi può leggere (GET). 'public' = anche senza login. */
  read: Role[] | 'public'
  /** Chi può scrivere (POST/PUT/PATCH, e DELETE se `remove` non è indicato). */
  write: Role[]
  /** Chi può cancellare (DELETE). Se assente vale `write`. */
  remove?: Role[]
}

/**
 * Controllo d'accesso per gruppo di rotte. Il ruolo arriva da `c.get('role')`,
 * impostato in index.ts per tutte le richieste /api/*.
 * Le OPTIONS di preflight le chiude prima il middleware CORS.
 */
export function requireRole(access: Access) {
  return createMiddleware<Env>(async (c, next) => {
    const isRead = c.req.method === 'GET' || c.req.method === 'HEAD'
    const allowed = isRead
      ? access.read
      : c.req.method === 'DELETE' && access.remove ? access.remove : access.write
    if (allowed === 'public') return next()

    const role = c.get('role')
    if (!role) return c.json({ error: 'Non autenticato' }, 401)
    if (!allowed.includes(role)) return c.json({ error: 'Non autorizzato' }, 403)
    return next()
  })
}

export function isAdmin(c: Context<Env>): boolean {
  return c.get('role') === 'admin'
}

/** Risposta per chi non può: 401 se anonimo, 403 se loggato con un ruolo insufficiente. */
export function deny(c: Context<Env>) {
  return c.get('role')
    ? c.json({ error: 'Non autorizzato' }, 403)
    : c.json({ error: 'Non autenticato' }, 401)
}
