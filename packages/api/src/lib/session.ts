import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Env } from '../index'

/**
 * Ruoli dell'area riservata.
 * - admin: tutto
 * - agency: agenzia social/marketing (programma, artisti, media, piano editoriale)
 */
export type Role = 'admin' | 'agency'

type Bindings = Env['Bindings']

const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 giorni

/**
 * Chiave HMAC per ruolo. Quella dell'agenzia dipende anche da AGENCY_PASSWORD:
 * cambiando la password agenzia si invalidano tutte le sue sessioni senza toccare
 * quelle admin. Senza AGENCY_PASSWORD il ruolo agency è disattivato.
 */
function signingKey(env: Bindings, role: Role): string | null {
  if (!env.AUTH_SECRET) return null
  if (role === 'admin') return env.AUTH_SECRET
  if (!env.AGENCY_PASSWORD) return null
  return `${env.AUTH_SECRET}:agency:${env.AGENCY_PASSWORD}`
}

function importKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  )
}

/** Confronto a tempo costante, per non rivelare quanti caratteri della password sono giusti. */
export function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a)
  const y = new TextEncoder().encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}

/** Token di sessione: "ruolo.timestamp.firma", firma HMAC-SHA256 su "ruolo.timestamp". */
export async function createToken(env: Bindings, role: Role): Promise<string | null> {
  const secret = signingKey(env, role)
  if (!secret) return null
  const payload = `${role}.${Date.now()}`
  const key = await importKey(secret, 'sign')
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return `${payload}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`
}

/** Ruolo del token se valido e non scaduto, altrimenti null. */
export async function verifyToken(token: string, env: Bindings): Promise<Role | null> {
  try {
    const [role, timestamp, sig] = token.split('.')
    if (role !== 'admin' && role !== 'agency') return null
    if (!timestamp || !sig) return null

    const age = Date.now() - parseInt(timestamp, 10)
    if (!(age >= 0 && age <= TOKEN_MAX_AGE_MS)) return null

    const secret = signingKey(env, role)
    if (!secret) return null

    const key = await importKey(secret, 'verify')
    const sigBytes = Uint8Array.from(atob(sig), (ch) => ch.charCodeAt(0))
    const ok = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(`${role}.${timestamp}`))
    return ok ? role : null
  } catch {
    return null
  }
}

/** Ruolo della richiesta corrente dal cookie di sessione, null se anonima. */
export async function getRequestRole(c: Context<Env>): Promise<Role | null> {
  const token = getCookie(c, 'auth_token')
  if (!token) return null
  return verifyToken(token, c.env)
}

/** Le note (compensi, contatti, appunti) le legge e le scrive solo l'admin. */
export function canSeeNotes(role: Role | null): boolean {
  return role === 'admin'
}

/** Toglie il campo note dalle risposte per chi non è admin. */
export function withoutNotes<T extends Record<string, unknown>>(row: T): Omit<T, 'notes'> {
  const { notes: _notes, ...rest } = row
  return rest
}
