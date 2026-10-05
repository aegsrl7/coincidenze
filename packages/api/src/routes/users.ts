import { Hono } from 'hono'
import type { Env } from '../index'
import { normalizeEmail, isValidEmail, countManagers, LAST_MANAGER, sendAccessLink } from '../lib/accounts'

// Tutte le rotte richiedono utenti.manage (middleware in index.ts)
export const usersRoutes = new Hono<Env>()

interface UserRow {
  id: string
  email: string
  name: string
  role_id: string
  role_name: string
  active: number
  has_password: number
  last_login_at: string | null
  created_at: string
}

const SELECT_USERS = `
  SELECT u.id, u.email, u.name, u.role_id, r.name AS role_name, u.active,
         (u.password_hash IS NOT NULL) AS has_password, u.last_login_at, u.created_at
  FROM users u JOIN roles r ON r.id = u.role_id`

function present(u: UserRow) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: { id: u.role_id, name: u.role_name },
    active: u.active === 1,
    // invitato = non ha ancora scelto la password
    status: u.active !== 1 ? 'disattivato' : u.has_password ? 'attivo' : 'invitato',
    last_login_at: u.last_login_at,
    created_at: u.created_at,
  }
}

async function getUser(db: D1Database, id: string): Promise<UserRow | null> {
  return (await db.prepare(`${SELECT_USERS} WHERE u.id = ?`).bind(id).first<UserRow>()) || null
}

async function roleExists(db: D1Database, id: string): Promise<{ name: string } | null> {
  return (await db.prepare('SELECT name FROM roles WHERE id = ?').bind(id).first<{ name: string }>()) || null
}

// GET / — elenco
usersRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`${SELECT_USERS} ORDER BY u.active DESC, u.name COLLATE NOCASE`).all<UserRow>()
  return c.json(results.map(present))
})

// POST / — invita: crea l'utente senza password e manda il link per sceglierla
usersRoutes.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : ''
  const email = normalizeEmail(body.email)
  const roleId = typeof body.role_id === 'string' ? body.role_id : ''

  if (!name) return c.json({ error: 'Nome obbligatorio' }, 400)
  if (!isValidEmail(email)) return c.json({ error: 'Email non valida' }, 400)
  const role = await roleExists(c.env.DB, roleId)
  if (!role) return c.json({ error: 'Ruolo non valido' }, 400)

  const dup = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (dup) return c.json({ error: 'Esiste già un utente con questa email' }, 409)

  const id = crypto.randomUUID()
  await c.env.DB
    .prepare('INSERT INTO users (id, email, name, role_id) VALUES (?, ?, ?, ?)')
    .bind(id, email, name, roleId)
    .run()

  const sent = await sendAccessLink(c.env, { id, email, name, hasPassword: false, roleName: role.name })
  const user = await getUser(c.env.DB, id)
  return c.json({ user: user && present(user), email_sent: sent.emailSent, link: sent.link }, 201)
})

// PUT /:id — nome, ruolo, attivo
usersRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const me = c.get('user')!
  const existing = await getUser(c.env.DB, id)
  if (!existing) return c.json({ error: 'Utente non trovato' }, 404)
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>

  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 100) : existing.name
  const roleId = typeof body.role_id === 'string' ? body.role_id : existing.role_id
  const active = typeof body.active === 'boolean' ? body.active : existing.active === 1

  if (roleId !== existing.role_id && !(await roleExists(c.env.DB, roleId))) {
    return c.json({ error: 'Ruolo non valido' }, 400)
  }
  if (id === me.id && !active) return c.json({ error: 'Non puoi disattivare il tuo account' }, 400)

  const accessChanged = roleId !== existing.role_id || active !== (existing.active === 1)
  if (accessChanged && (await countManagers(c.env.DB, { user: { id, roleId, active } })) === 0) {
    return c.json({ error: LAST_MANAGER }, 409)
  }

  await c.env.DB
    .prepare(
      `UPDATE users SET name = ?, role_id = ?, active = ?,
         session_version = session_version + ?, updated_at = datetime('now') WHERE id = ?`
    )
    // Disattivare chiude subito le sessioni aperte
    .bind(name, roleId, active ? 1 : 0, active ? 0 : 1, id)
    .run()

  const user = await getUser(c.env.DB, id)
  return c.json(user && present(user))
})

// POST /:id/link — rimanda l'invito, o un link per una nuova password (valido 24 ore)
usersRoutes.post('/:id/link', async (c) => {
  const existing = await getUser(c.env.DB, c.req.param('id'))
  if (!existing) return c.json({ error: 'Utente non trovato' }, 404)
  if (existing.active !== 1) return c.json({ error: 'Riattiva l\'utente prima di mandargli un link' }, 400)

  const sent = await sendAccessLink(
    c.env,
    { id: existing.id, email: existing.email, name: existing.name, hasPassword: existing.has_password === 1, roleName: existing.role_name },
    24
  )
  return c.json({ email_sent: sent.emailSent, link: sent.link })
})

// DELETE /:id
usersRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  if (id === c.get('user')!.id) return c.json({ error: 'Non puoi eliminare il tuo account' }, 400)
  const existing = await getUser(c.env.DB, id)
  if (!existing) return c.json({ error: 'Utente non trovato' }, 404)
  if ((await countManagers(c.env.DB, { removeUserId: id })) === 0) return c.json({ error: LAST_MANAGER }, 409)

  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM user_tokens WHERE user_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id),
  ])
  return c.json({ ok: true })
})
