import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Env } from '../index'
import { verifyToken } from './auth'

export const uploadRoutes = new Hono<Env>()

// POST /api/upload — upload file to R2 (auth required)
uploadRoutes.post('/upload', async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Non autenticato' }, 401)
  const valid = await verifyToken(token, c.env.AUTH_SECRET)
  if (!valid) return c.json({ error: 'Sessione scaduta' }, 401)

  const formData = await c.req.formData()
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return c.json({ error: 'Nessun file fornito' }, 400)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const key = `${crypto.randomUUID()}.${ext}`

  await c.env.MEDIA_BUCKET.put(key, file, {
    httpMetadata: { contentType: file.type },
  })

  // Costruisci URL completo basato sull'origin della richiesta
  const reqUrl = new URL(c.req.url)
  const url = `${reqUrl.origin}/api/media-file/${key}`
  return c.json({ url, key }, 201)
})

// GET /api/media-file/:key — serve file from R2 (public)
uploadRoutes.get('/media-file/:key', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.MEDIA_BUCKET.get(key)

  if (!object) {
    return c.json({ error: 'File non trovato' }, 404)
  }

  const headers = new Headers()
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')

  return new Response(object.body, { headers })
})
