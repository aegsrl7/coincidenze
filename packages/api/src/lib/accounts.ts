import type { Env } from '../index'
import { rolePermissions } from './permissions'
import { randomToken, sha256Hex } from './passwords'
import { sendEmail, buildInviteEmail, buildResetEmail } from './email'

type Bindings = Env['Bindings']

// ── Limiti ai tentativi (login, primo accesso, richieste di reset) ─────────

export type AttemptKind = 'login' | 'setup' | 'forgot'

const WINDOW_MIN = 15
const MAX_ATTEMPTS = 5

export function clientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  return (
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  )
}

export async function tooManyAttempts(db: D1Database, ip: string, kind: AttemptKind): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MIN * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  const row = await db
    .prepare('SELECT COUNT(*) AS c FROM login_attempts WHERE ip = ? AND kind = ? AND failed_at > ?')
    .bind(ip, kind, since)
    .first<{ c: number }>()
  return (row?.c ?? 0) >= MAX_ATTEMPTS
}

export const TOO_MANY = `Troppi tentativi. Riprova fra ${WINDOW_MIN} minuti.`

export async function recordAttempt(db: D1Database, ip: string, kind: AttemptKind): Promise<void> {
  await db.prepare("INSERT INTO login_attempts (ip, kind, failed_at) VALUES (?, ?, datetime('now'))").bind(ip, kind).run()
}

export async function clearAttempts(db: D1Database, ip: string, kind: AttemptKind): Promise<void> {
  await db.prepare('DELETE FROM login_attempts WHERE ip = ? AND kind = ?').bind(ip, kind).run()
}

// ── Utenti ─────────────────────────────────────────────────────────────

export function normalizeEmail(s: unknown): string {
  return typeof s === 'string' ? s.trim().toLowerCase().slice(0, 254) : ''
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Quanti utenti attivi (con password già scelta) possono gestire utenti e ruoli,
 * applicando una modifica ipotetica. Serve a non lasciare il sistema senza
 * amministratori.
 */
export async function countManagers(
  db: D1Database,
  change: {
    removeUserId?: string
    user?: { id: string; roleId: string; active: boolean }
    role?: { id: string; permissions: string[] }
  } = {}
): Promise<number> {
  const { results: roles } = await db
    .prepare('SELECT id, is_system, permissions FROM roles')
    .all<{ id: string; is_system: number; permissions: string }>()
  const perms = new Map(roles.map((r) => [r.id, r.id === change.role?.id ? change.role.permissions : rolePermissions(r)]))

  const { results: users } = await db
    .prepare('SELECT id, role_id, active FROM users WHERE password_hash IS NOT NULL')
    .all<{ id: string; role_id: string; active: number }>()

  let count = 0
  for (const u of users) {
    if (u.id === change.removeUserId) continue
    const roleId = u.id === change.user?.id ? change.user.roleId : u.role_id
    const active = u.id === change.user?.id ? change.user.active : u.active === 1
    if (active && perms.get(roleId)?.includes('utenti.manage')) count++
  }
  return count
}

export const LAST_MANAGER = 'Deve restare almeno un utente attivo che può gestire utenti e ruoli'

// ── Link di invito e reset ─────────────────────────────────────────────

export type TokenPurpose = 'invite' | 'reset'

const TTL_HOURS: Record<TokenPurpose, number> = { invite: 24 * 7, reset: 1 }

/** Crea un link monouso. Un nuovo link annulla quelli precedenti non usati. */
export async function createUserToken(db: D1Database, userId: string, purpose: TokenPurpose, ttlHours = TTL_HOURS[purpose]): Promise<string> {
  const token = randomToken()
  const expires = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  await db.batch([
    db.prepare('DELETE FROM user_tokens WHERE user_id = ? AND used_at IS NULL').bind(userId),
    db.prepare('INSERT INTO user_tokens (token_hash, user_id, purpose, expires_at) VALUES (?, ?, ?, ?)')
      .bind(await sha256Hex(token), userId, purpose, expires),
  ])
  return token
}

export interface TokenInfo {
  tokenHash: string
  purpose: TokenPurpose
  userId: string
  email: string
  name: string
}

/** Link valido: non usato, non scaduto, utente attivo. */
export async function findUserToken(db: D1Database, token: string): Promise<TokenInfo | null> {
  if (!token || token.length > 100) return null
  const tokenHash = await sha256Hex(token)
  const row = await db
    .prepare(
      `SELECT t.token_hash, t.purpose, u.id AS user_id, u.email, u.name
       FROM user_tokens t JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = ? AND t.used_at IS NULL AND t.expires_at > datetime('now') AND u.active = 1`
    )
    .bind(tokenHash)
    .first<{ token_hash: string; purpose: TokenPurpose; user_id: string; email: string; name: string }>()
  if (!row) return null
  return { tokenHash: row.token_hash, purpose: row.purpose, userId: row.user_id, email: row.email, name: row.name }
}

function accessLink(env: Bindings, token: string): string {
  const base = env.PUBLIC_BASE_URL?.replace(/\/$/, '') || 'https://coincidenze.org'
  return `${base}/accesso/${token}`
}

/**
 * Manda l'invito (se l'utente non ha ancora una password) o il link di reset.
 * Se l'email non parte restituisce il link, così l'admin può inoltrarlo a mano.
 */
export async function sendAccessLink(
  env: Bindings,
  user: { id: string; email: string; name: string; hasPassword: boolean; roleName?: string },
  resetTtlHours?: number
): Promise<{ emailSent: boolean; link?: string }> {
  const purpose: TokenPurpose = user.hasPassword ? 'reset' : 'invite'
  const token = await createUserToken(env.DB, user.id, purpose, purpose === 'reset' ? resetTtlHours : undefined)
  const link = accessLink(env, token)
  const mail = purpose === 'invite'
    ? buildInviteEmail({ name: user.name, link, roleName: user.roleName ?? '' })
    : buildResetEmail({ name: user.name, link, hours: resetTtlHours ?? TTL_HOURS.reset })
  const res = await sendEmail(env, { to: user.email, subject: mail.subject, html: mail.html, text: mail.text })
  if (!res.ok) console.error('Email di accesso non inviata', user.id, res.error)
  return res.ok ? { emailSent: true } : { emailSent: false, link }
}
