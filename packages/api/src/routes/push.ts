import { Hono } from 'hono'
import type { Env } from '../index'
import { pushConfigured, notifyUser, MAX_DEVICES_PER_USER } from '../lib/push'

// Notifiche sul telefono: ogni utente gestisce i propri dispositivi (serve solo il login)
export const pushRoutes = new Hono<Env>()

pushRoutes.use('*', async (c, next) => {
  if (!c.get('user')) return c.json({ error: 'Non autenticato' }, 401)
  await next()
})

// GET /key — chiave pubblica VAPID per abbonarsi (null se le push non sono configurate)
pushRoutes.get('/key', (c) => c.json({ key: pushConfigured(c.env) ? c.env.VAPID_PUBLIC_KEY : null }))

// GET /subscribe?endpoint=… — questo dispositivo è registrato per l'utente?
pushRoutes.get('/subscribe', async (c) => {
  const endpoint = c.req.query('endpoint') ?? ''
  if (!endpoint) return c.json({ active: false })
  const row = await c.env.DB
    .prepare('SELECT id FROM push_subscriptions WHERE endpoint = ? AND user_id = ?')
    .bind(endpoint, c.get('user')!.id)
    .first()
  return c.json({ active: !!row })
})

// POST /subscribe — registra (o aggiorna) l'abbonamento del dispositivo.
// L'endpoint è unico: se sullo stesso telefono entra un'altra persona, passa a lei.
pushRoutes.post('/subscribe', async (c) => {
  const body = (await c.req.json().catch(() => null)) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown }; ua?: unknown } | null
  const endpoint = String(body?.endpoint ?? '')
  const p256dh = String(body?.keys?.p256dh ?? '')
  const auth = String(body?.keys?.auth ?? '')
  if (!/^https:\/\//.test(endpoint) || !p256dh || !auth || endpoint.length > 2048 || p256dh.length > 512 || auth.length > 512) {
    return c.json({ error: 'Abbonamento push non valido' }, 400)
  }
  if (!pushConfigured(c.env)) return c.json({ error: 'Le notifiche sul telefono non sono ancora configurate' }, 400)

  const userId = c.get('user')!.id
  const ua = String(body?.ua ?? c.req.header('user-agent') ?? '').slice(0, 200)
  await c.env.DB.batch([
    c.env.DB
      .prepare(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, ua) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh,
           auth = excluded.auth, ua = excluded.ua, failures = 0`
      )
      .bind(userId, endpoint, p256dh, auth, ua),
    // Al massimo MAX_DEVICES_PER_USER dispositivi a testa: restano i più recenti
    c.env.DB
      .prepare(
        `DELETE FROM push_subscriptions WHERE user_id = ? AND id NOT IN
           (SELECT id FROM push_subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT ${MAX_DEVICES_PER_USER})`
      )
      .bind(userId, userId),
  ])
  return c.json({ ok: true })
})

// DELETE /subscribe?endpoint=… — spegne le notifiche su questo dispositivo
pushRoutes.delete('/subscribe', async (c) => {
  await c.env.DB
    .prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?')
    .bind(c.req.query('endpoint') ?? '', c.get('user')!.id)
    .run()
  return c.json({ ok: true })
})

// POST /test — una notifica vera sui dispositivi di chi la chiede
pushRoutes.post('/test', async (c) => {
  const user = c.get('user')!
  const firstName = user.name.split(' ')[0] || user.name
  const r = await notifyUser(c.env, user.id, {
    title: 'COINCIDENZE',
    body: `Le notifiche funzionano, ${firstName}.`,
    url: '/admin/account',
    tag: 'test',
  })
  return c.json(r)
})
