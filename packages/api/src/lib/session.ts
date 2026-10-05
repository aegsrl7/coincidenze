import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Env } from '../index'
import { rolePermissions } from './permissions'

/** Utente della sessione, ricaricato dal DB a ogni richiesta autenticata. */
export interface SessionUser {
  id: string
  email: string
  name: string
  roleId: string
  roleName: string
  permissions: Set<string>
}

type Bindings = Env['Bindings']

const COOKIE = 'auth_token'
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 giorni

function importKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  )
}

/** Confronto a tempo costante, per non rivelare quanti caratteri sono giusti. */
export function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a)
  const y = new TextEncoder().encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}

/**
 * Token di sessione: "v1.<userId>.<sessionVersion>.<timestamp>.<firma>", firmato con
 * SESSION_SECRET (casuale, non lo conosce nessuno). Alzare users.session_version
 * chiude tutte le sessioni di quell'utente.
 */
export async function createSessionToken(env: Bindings, userId: string, sessionVersion: number): Promise<string | null> {
  if (!env.SESSION_SECRET) return null
  const payload = `v1.${userId}.${sessionVersion}.${Date.now()}`
  const key = await importKey(env.SESSION_SECRET, 'sign')
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return `${payload}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`
}

async function parseSessionToken(token: string, env: Bindings): Promise<{ userId: string; version: number } | null> {
  try {
    if (!env.SESSION_SECRET) return null
    const [v, userId, version, timestamp, sig] = token.split('.')
    if (v !== 'v1' || !userId || !version || !timestamp || !sig) return null

    const age = Date.now() - parseInt(timestamp, 10)
    if (!(age >= 0 && age <= TOKEN_MAX_AGE_MS)) return null

    const key = await importKey(env.SESSION_SECRET, 'verify')
    const sigBytes = Uint8Array.from(atob(sig), (ch) => ch.charCodeAt(0))
    const payload = `v1.${userId}.${version}.${timestamp}`
    const ok = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload))
    return ok ? { userId, version: parseInt(version, 10) } : null
  } catch {
    return null
  }
}

/** Utente della richiesta corrente, null se anonima, sessione scaduta o utente disattivato. */
export async function loadSessionUser(c: Context<Env>): Promise<SessionUser | null> {
  const token = getCookie(c, COOKIE)
  if (!token) return null
  const parsed = await parseSessionToken(token, c.env)
  if (!parsed) return null

  const row = await c.env.DB
    .prepare(
      `SELECT u.id, u.email, u.name, u.active, u.session_version, u.password_hash,
              r.id AS role_id, r.name AS role_name, r.is_system, r.permissions
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?`
    )
    .bind(parsed.userId)
    .first<{
      id: string; email: string; name: string; active: number; session_version: number; password_hash: string | null
      role_id: string; role_name: string; is_system: number; permissions: string
    }>()

  if (!row || row.active !== 1 || !row.password_hash || row.session_version !== parsed.version) return null

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    roleId: row.role_id,
    roleName: row.role_name,
    permissions: new Set(rolePermissions(row)),
  }
}

export function setSessionCookie(c: Context<Env>, token: string): void {
  const isLocal = new URL(c.req.url).hostname === 'localhost'
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure: !isLocal,
    sameSite: isLocal ? 'Lax' : 'None',
    path: '/',
    maxAge: TOKEN_MAX_AGE_MS / 1000,
  })
}

export function clearSessionCookie(c: Context<Env>): void {
  const isLocal = new URL(c.req.url).hostname === 'localhost'
  deleteCookie(c, COOKIE, { path: '/', secure: !isLocal, sameSite: isLocal ? 'Lax' : 'None' })
}

/** true se l'utente della richiesta ha il permesso. */
export function can(c: Context<Env>, permission: string): boolean {
  return c.get('user')?.permissions.has(permission) ?? false
}

/** true se l'utente della richiesta ha almeno uno dei permessi. */
export function canAny(c: Context<Env>, permissions: string[]): boolean {
  return permissions.some((p) => can(c, p))
}

/** Toglie il campo note dalle risposte per chi non ha il permesso note.view. */
export function withoutNotes<T extends Record<string, unknown>>(row: T): Omit<T, 'notes'> {
  const { notes: _notes, ...rest } = row
  return rest
}
