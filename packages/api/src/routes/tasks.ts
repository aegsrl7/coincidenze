import { Hono } from 'hono'
import type { Env } from '../index'

export const tasksRoutes = new Hono<Env>()

tasksRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM tasks ORDER BY priority DESC, created_at').all()
  return c.json(results)
})

tasksRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    'INSERT INTO tasks (id, title, description, status, priority, assignee_id, due_date, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, body.title, body.description || '', body.status || 'todo', body.priority || 'medium', body.assigneeId || null, body.dueDate || null, body.category || null).run()
  return c.json({ id, ...body }, 201)
})

tasksRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ?, due_date = ?, category = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(body.title, body.description || '', body.status, body.priority, body.assigneeId || null, body.dueDate || null, body.category || null, id).run()
  return c.json({ id, ...body })
})

tasksRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ ok: true })
})
