import { Hono } from 'hono'
import type { Env } from '../index'

export const canvasRoutes = new Hono<Env>()

canvasRoutes.get('/nodes', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM canvas_nodes').all()
  return c.json(results)
})

canvasRoutes.get('/edges', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM canvas_edges').all()
  return c.json(results)
})

canvasRoutes.put('/', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const { nodes, edges } = body

  // Replace all canvas state in a batch
  const batch: D1PreparedStatement[] = [
    db.prepare('DELETE FROM canvas_edges'),
    db.prepare('DELETE FROM canvas_nodes'),
  ]

  for (const node of nodes) {
    batch.push(
      db.prepare(
        'INSERT INTO canvas_nodes (id, type, entity_id, label, position_x, position_y, width, height, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(node.id, node.type, node.entityId || null, node.label || '', node.positionX || 0, node.positionY || 0, node.width || null, node.height || null, JSON.stringify(node.data || {}))
    )
  }

  for (const edge of edges) {
    batch.push(
      db.prepare(
        'INSERT INTO canvas_edges (id, source, target, label) VALUES (?, ?, ?, ?)'
      ).bind(edge.id, edge.source, edge.target, edge.label || '')
    )
  }

  await db.batch(batch)
  return c.json({ ok: true })
})
