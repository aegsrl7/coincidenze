import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { eventsRoutes } from './routes/events'
import { artistsRoutes } from './routes/artists'
import { exhibitorsRoutes } from './routes/exhibitors'
import { tasksRoutes } from './routes/tasks'
import { teamRoutes } from './routes/team'
import { mediaRoutes } from './routes/media'
import { canvasRoutes } from './routes/canvas'
import { authRoutes } from './routes/auth'
import { uploadRoutes } from './routes/upload'
import { datiRoutes } from './routes/dati'
import { editorialRoutes } from './routes/editorial'
import { edizione0Routes } from './routes/edizione0'
import { edizione1Routes } from './routes/edizione1'
import { accreditationsRoutes } from './routes/accreditations'
import { spuntinoRoutes } from './routes/spuntino'
import { menuRoutes } from './routes/menu'
import { categoriesRoutes } from './routes/categories'
import { requireAuth } from './middleware/auth'

export type Env = {
  Bindings: {
    DB: D1Database
    AUTH_SECRET: string
    MEDIA_BUCKET: R2Bucket
    RESEND_API_KEY?: string
    RESEND_FROM?: string
    PUBLIC_BASE_URL?: string
  }
}

const app = new Hono<Env>()

// CORS
app.use('/api/*', cors({
  origin: (origin) => {
    if (!origin) return 'https://coincidenze.org'
    if (
      origin === 'https://coincidenze.org' ||
      origin === 'https://www.coincidenze.org' ||
      origin === 'https://coincidenze.pages.dev' ||
      origin.endsWith('.coincidenze.pages.dev') ||
      origin.startsWith('http://localhost')
    ) return origin
    return 'https://coincidenze.org'
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}))

// Riscrive al volo i vecchi URL workers.dev nelle response JSON (gli image_url
// salvati in DB prima del switch a custom domain puntavano lì e ora sono 404).
// Zero overhead per response binarie/non-JSON.
const LEGACY_HOST = 'https://coincidenze-api.lamaz7.workers.dev/'
const NEW_HOST = 'https://api.coincidenze.org/'
app.use('/api/*', async (c, next) => {
  await next()
  const ct = c.res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) return
  const body = await c.res.clone().text()
  if (!body.includes(LEGACY_HOST)) return
  const fixed = body.split(LEGACY_HOST).join(NEW_HOST)
  c.res = new Response(fixed, {
    status: c.res.status,
    headers: c.res.headers,
  })
})

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', service: 'coincidenze-api' }))

// Auth (no middleware)
app.route('/api/auth', authRoutes)

// Pagina dati statica (no auth, no CORS — serve HTML)
app.route('/dati', datiRoutes)

// Upload (auth handled internally, GET public)
app.route('/api', uploadRoutes)

// Accrediti (auth gestito per-route: POST pubblico, GET by-code pubblico, resto admin)
app.route('/api/accrediti', accreditationsRoutes)

// Spuntino delle 18 (auth per-route: POST e GET /capacity pubblici, resto admin)
app.route('/api/spuntino', spuntinoRoutes)

// Protected routes (requireAuth only blocks POST/PUT/DELETE)
app.use('/api/events/*', requireAuth)
app.use('/api/artists/*', requireAuth)
app.use('/api/exhibitors/*', requireAuth)
app.use('/api/tasks/*', requireAuth)
app.use('/api/team/*', requireAuth)
app.use('/api/media/*', requireAuth)
app.use('/api/canvas/*', requireAuth)
app.use('/api/editorial/*', requireAuth)
app.use('/api/edizione0/*', requireAuth)
app.use('/api/edizione1/*', requireAuth)
app.use('/api/menu/*', requireAuth)
app.use('/api/categories/*', requireAuth)

// Routes
app.route('/api/events', eventsRoutes)
app.route('/api/artists', artistsRoutes)
app.route('/api/exhibitors', exhibitorsRoutes)
app.route('/api/tasks', tasksRoutes)
app.route('/api/team', teamRoutes)
app.route('/api/media', mediaRoutes)
app.route('/api/canvas', canvasRoutes)
app.route('/api/editorial', editorialRoutes)
app.route('/api/edizione0', edizione0Routes)
app.route('/api/edizione1', edizione1Routes)
app.route('/api/menu', menuRoutes)
app.route('/api/categories', categoriesRoutes)

export default app
