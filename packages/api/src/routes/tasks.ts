import { Hono } from 'hono'
import type { Env } from '../index'
import { resolveEdition } from '../lib/edition'

export const tasksRoutes = new Hono<Env>()

// GET / — task dell'edizione (?edition=slug, default corrente)
tasksRoutes.get('/', async (c) => {
  const edition = await resolveEdition(c)
  const { results } = edition
    ? await c.env.DB
        .prepare('SELECT * FROM tasks WHERE edition_id = ? ORDER BY priority DESC, created_at')
        .bind(edition.id)
        .all()
    : await c.env.DB.prepare('SELECT * FROM tasks ORDER BY priority DESC, created_at').all()
  return c.json(results)
})

tasksRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  const edition = await resolveEdition(c)
  const editionId = body.edition_id || edition?.id || null
  await c.env.DB.prepare(
    'INSERT INTO tasks (id, edition_id, title, description, status, priority, assignee_id, due_date, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, editionId, body.title, body.description || '', body.status || 'todo', body.priority || 'medium', body.assigneeId || null, body.dueDate || null, body.category || null).run()
  return c.json({ id, edition_id: editionId, ...body }, 201)
})

tasksRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  // edition_id è cambiabile via PUT solo esplicitamente
  if (body.edition_id !== undefined) {
    await c.env.DB
      .prepare("UPDATE tasks SET edition_id = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(body.edition_id || null, id)
      .run()
  }
  await c.env.DB.prepare(
    'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ?, due_date = ?, category = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(body.title, body.description || '', body.status, body.priority, body.assigneeId || null, body.dueDate || null, body.category || null, id).run()
  return c.json({ id, ...body })
})

tasksRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})
