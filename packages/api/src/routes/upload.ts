import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Env } from '../index'
import { verifyToken } from './auth'

export const uploadRoutes = new Hono<Env>()

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

// Allowlist mime → estensioni accettabili. Tutto il resto è bloccato:
// niente SVG (può contenere <script>), niente HTML, niente PDF, ecc.
const ALLOWED: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
  'video/mp4': ['mp4'],
  'video/quicktime': ['mov'],
  'video/webm': ['webm'],
}

// Magic bytes — confermano il vero tipo del file, senza fidarsi del client.
function sniffMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null
  const b = bytes
  // JPEG FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  // PNG 89 50 4E 47
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  // GIF "GIF87a" / "GIF89a"
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif'
  // WEBP: "RIFF" .... "WEBP"
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
      && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp'
  // MP4/MOV/3GP: ftyp box at offset 4
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    // brand at bytes 8-11
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11])
    if (brand === 'qt  ') return 'video/quicktime'
    return 'video/mp4'
  }
  // WebM/Matroska EBML: 1A 45 DF A3
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'video/webm'
  return null
}

// POST /api/upload — upload file to R2 (auth required)
uploadRoutes.post('/upload', async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Non autenticato' }, 401)
  const valid = await verifyToken(token, c.env.AUTH_SECRET)
  if (!valid) return c.json({ error: 'Sessione scaduta' }, 401)

  const formData = await c.req.formData()
  const entry = formData.get('file')
  // formData.get può restituire File | string | null. Vogliamo solo File con
  // arrayBuffer funzionante (workers File API).
  if (!entry || typeof entry === 'string' || typeof (entry as unknown as File).arrayBuffer !== 'function') {
    return c.json({ error: 'Nessun file fornito' }, 400)
  }
  const f = entry as unknown as File

  if (f.size === 0) return c.json({ error: 'File vuoto' }, 400)
  if (f.size > MAX_BYTES) {
    return c.json({ error: `File troppo grande (max ${Math.floor(MAX_BYTES / 1024 / 1024)} MB)` }, 413)
  }

  const buffer = await f.arrayBuffer()
  const head = new Uint8Array(buffer.slice(0, 16))
  const sniffed = sniffMime(head)
  if (!sniffed || !ALLOWED[sniffed]) {
    return c.json({ error: 'Tipo file non consentito. Accettati: JPG, PNG, WEBP, GIF, MP4, MOV, WEBM.' }, 415)
  }

  const ext = ALLOWED[sniffed][0]
  const key = `${crypto.randomUUID()}.${ext}`

  await c.env.MEDIA_BUCKET.put(key, buffer, {
    httpMetadata: { contentType: sniffed },
  })

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
  // Difesa in profondità: anche se l'allowlist sopra fallisse, nosniff impedisce
  // al browser di "promuovere" un file generico a HTML/script.
  headers.set('X-Content-Type-Options', 'nosniff')

  return new Response(object.body, { headers })
})
