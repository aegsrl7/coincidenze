/**
 * Notifiche push sul telefono (stesso impianto di Cadenza). L'app installata lascia in
 * push_subscriptions l'abbonamento del dispositivo; qui si cifra il messaggio (RFC 8291, VAPID)
 * con @block65/webcrypto-web-push e lo si consegna al servizio push del browser (FCM per Chrome,
 * APNs per Safari). Chiavi nei secret VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY: senza, le push tacciono.
 */
import { buildPushPayload, type PushSubscription } from '@block65/webcrypto-web-push'
import type { Env } from '../index'
import { rolePermissions } from './permissions'

type Bindings = Env['Bindings']

export interface PushNote {
  title: string
  body: string
  /** Pagina da aprire toccando la notifica */
  url?: string
  /** Notifiche con lo stesso tag si sostituiscono invece di accumularsi */
  tag?: string
}

interface SubRow { id: number; endpoint: string; p256dh: string; auth: string; failures: number }

const MAX_FAILURES = 5
const CONCURRENCY = 3
const FETCH_TIMEOUT_MS = 5000
const TTL_SECONDS = 24 * 3600
export const MAX_DEVICES_PER_USER = 5

export const pushConfigured = (env: Bindings) => !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY)

/** Consegna ai dispositivi; endpoint morti (404/410) o con 5 errori di fila vengono tolti. Non lancia mai. */
async function deliver(env: Bindings, subs: SubRow[], note: PushNote): Promise<{ sent: number; failed: number }> {
  if (!pushConfigured(env) || subs.length === 0) return { sent: 0, failed: 0 }
  const vapid = {
    subject: env.PUBLIC_BASE_URL || 'https://coincidenze.org',
    publicKey: env.VAPID_PUBLIC_KEY!,
    privateKey: env.VAPID_PRIVATE_KEY!,
  }
  const data = JSON.stringify({ title: note.title, body: note.body, url: note.url ?? '/admin', tag: note.tag ?? '' })
  let sent = 0
  let failed = 0

  const one = async (s: SubRow) => {
    const sub: PushSubscription = { endpoint: s.endpoint, expirationTime: null, keys: { p256dh: s.p256dh, auth: s.auth } }
    let status = 0
    try {
      const payload = await buildPushPayload({ data, options: { ttl: TTL_SECONDS, urgency: 'high' } }, sub, vapid)
      status = (await fetch(s.endpoint, { ...payload, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })).status
    } catch (e) {
      console.error('push', e)
    }
    if (status >= 200 && status < 300) {
      sent++
      await env.DB.prepare("UPDATE push_subscriptions SET last_ok = datetime('now'), failures = 0 WHERE id = ?").bind(s.id).run()
    } else {
      failed++
      if (status === 404 || status === 410 || s.failures + 1 >= MAX_FAILURES) {
        await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(s.id).run()
      } else {
        await env.DB.prepare('UPDATE push_subscriptions SET failures = failures + 1 WHERE id = ?').bind(s.id).run()
      }
    }
  }

  for (let i = 0; i < subs.length; i += CONCURRENCY) await Promise.all(subs.slice(i, i + CONCURRENCY).map(one))
  return { sent, failed }
}

/** A tutti i dispositivi degli utenti attivi il cui ruolo ha il permesso (es. accrediti.view). */
export async function notifyPermission(env: Bindings, permission: string, note: PushNote): Promise<{ sent: number; failed: number }> {
  try {
    if (!pushConfigured(env)) return { sent: 0, failed: 0 }
    const { results } = await env.DB
      .prepare(
        `SELECT s.id, s.endpoint, s.p256dh, s.auth, s.failures, r.is_system, r.permissions
         FROM push_subscriptions s
         JOIN users u ON u.id = s.user_id
         JOIN roles r ON r.id = u.role_id
         WHERE u.active = 1 AND u.password_hash IS NOT NULL`
      )
      .all<SubRow & { is_system: number; permissions: string }>()
    return await deliver(env, results.filter((r) => rolePermissions(r).includes(permission)), note)
  } catch (e) {
    console.error('push', e)
    return { sent: 0, failed: 0 }
  }
}

/** A tutti i dispositivi di un utente (es. la notifica di prova). */
export async function notifyUser(env: Bindings, userId: string, note: PushNote): Promise<{ sent: number; failed: number }> {
  try {
    const { results } = await env.DB
      .prepare('SELECT id, endpoint, p256dh, auth, failures FROM push_subscriptions WHERE user_id = ? ORDER BY id DESC')
      .bind(userId)
      .all<SubRow>()
    return await deliver(env, results, note)
  } catch (e) {
    console.error('push', e)
    return { sent: 0, failed: 0 }
  }
}

/** Fa partire la consegna senza far aspettare la risposta HTTP (waitUntil dei Workers). */
export function inBackground(c: { executionCtx: ExecutionContext }, task: Promise<unknown>): void {
  try {
    c.executionCtx.waitUntil(task)
  } catch {
    // fuori dai Workers (test): la promessa prosegue da sola
  }
}
