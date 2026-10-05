import { Hono } from 'hono'
import type { Env } from '../index'
import {
  PERMISSION_AREAS, ACTION_LABELS, PERMISSION_HINTS, normalizePermissions, rolePermissions,
} from '../lib/permissions'
import { countManagers, LAST_MANAGER } from '../lib/accounts'

// Tutte le rotte richiedono utenti.manage (middleware in index.ts)
export const rolesRoutes = new Hono<Env>()

interface RoleRow {
  id: string
  name: string
  description: string
  permissions: string
  is_system: number
  sort_order: number
  users: number
}

function present(r: RoleRow) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    permissions: rolePermissions(r),
    is_system: r.is_system === 1,
    users: r.users,
  }
}

const SELECT_ROLES = `
  SELECT r.*, (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) AS users
  FROM roles r`

// GET /catalog — aree e azioni per la matrice dei permessi
rolesRoutes.get('/catalog', (c) =>
  c.json({ areas: PERMISSION_AREAS, actions: ACTION_LABELS, hints: PERMISSION_HINTS })
)

// GET / — ruoli con permessi e numero di utenti
rolesRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`${SELECT_ROLES} ORDER BY r.sort_order, r.name COLLATE NOCASE`).all<RoleRow>()
  return c.json(results.map(present))
})

function readFields(body: Record<string, unknown>) {
  return {
    name: typeof body.name === 'string' ? body.name.trim().slice(0, 60) : '',
    description: typeof body.description === 'string' ? body.description.trim().slice(0, 300) : '',
    permissions: normalizePermissions(body.permissions),
  }
}

async function nameTaken(db: D1Database, name: string, exceptId = ''): Promise<boolean> {
  const row = await db.prepare('SELECT id FROM roles WHERE name = ? COLLATE NOCASE AND id != ?').bind(name, exceptId).first()
  return !!row
}

// POST / — nuovo ruolo
rolesRoutes.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const { name, description, permissions } = readFields(body)
  if (!name) return c.json({ error: 'Nome obbligatorio' }, 400)
  if (await nameTaken(c.env.DB, name)) return c.json({ error: 'Esiste già un ruolo con questo nome' }, 409)

  const id = `role-${crypto.randomUUID()}`
  const sort = await c.env.DB.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM roles').first<{ n: number }>()
  await c.env.DB
    .prepare('INSERT INTO roles (id, name, description, permissions, sort_order) VALUES (?, ?, ?, ?, ?)')
    .bind(id, name, description, JSON.stringify(permissions), sort?.n ?? 0)
    .run()
  const row = await c.env.DB.prepare(`${SELECT_ROLES} WHERE r.id = ?`).bind(id).first<RoleRow>()
  return c.json(row && present(row), 201)
})

// PUT /:id — modifica nome, descrizione, permessi (non il ruolo di sistema)
rolesRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare(`${SELECT_ROLES} WHERE r.id = ?`).bind(id).first<RoleRow>()
  if (!existing) return c.json({ error: 'Ruolo non trovato' }, 404)
  if (existing.is_system === 1) return c.json({ error: 'Il ruolo Amministratore non si modifica' }, 400)

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const { name, description, permissions } = readFields(body)
  if (!name) return c.json({ error: 'Nome obbligatorio' }, 400)
  if (await nameTaken(c.env.DB, name, id)) return c.json({ error: 'Esiste già un ruolo con questo nome' }, 409)
  if ((await countManagers(c.env.DB, { role: { id, permissions } })) === 0) {
    return c.json({ error: LAST_MANAGER }, 409)
  }

  await c.env.DB
    .prepare("UPDATE roles SET name = ?, description = ?, permissions = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(name, description, JSON.stringify(permissions), id)
    .run()
  const row = await c.env.DB.prepare(`${SELECT_ROLES} WHERE r.id = ?`).bind(id).first<RoleRow>()
  return c.json(row && present(row))
})

// DELETE /:id — solo ruoli non di sistema e senza utenti
rolesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare(`${SELECT_ROLES} WHERE r.id = ?`).bind(id).first<RoleRow>()
  if (!existing) return c.json({ error: 'Ruolo non trovato' }, 404)
  if (existing.is_system === 1) return c.json({ error: 'Il ruolo Amministratore non si elimina' }, 400)
  if (existing.users > 0) {
    return c.json({ error: `Il ruolo è assegnato a ${existing.users} ${existing.users === 1 ? 'utente' : 'utenti'}: cambia prima il loro ruolo` }, 409)
  }
  await c.env.DB.prepare('DELETE FROM roles WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})
