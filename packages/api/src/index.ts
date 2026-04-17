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

export default app
