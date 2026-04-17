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

  // Ordinamento topologico: genitori prima dei figli (per rispettare FK)
  const sorted: typeof nodes = []
  const remaining = [...nodes]
  const inserted = new Set<string>()
  while (remaining.length > 0) {
    const before = remaining.length
    for (let i = remaining.length - 1; i >= 0; i--) {
      const n = remaining[i]
      if (!n.parentId || inserted.has(n.parentId)) {
        sorted.push(n)
        inserted.add(n.id)
        remaining.splice(i, 1)
      }
    }
    if (remaining.length === before) {
      // Ciclo o parent mancante — inserisci il resto senza parentId
      for (const n of remaining) {
        sorted.push({ ...n, parentId: null })
      }
      break
    }
  }
  for (const node of sorted) {
    batch.push(
      db.prepare(
        'INSERT INTO canvas_nodes (id, type, entity_id, label, position_x, position_y, width, height, parent_id, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(node.id, node.type, node.entityId || null, node.label || '', node.positionX || 0, node.positionY || 0, node.width || null, node.height || null, node.parentId || null, JSON.stringify(node.data || {}))
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
