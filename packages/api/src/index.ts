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
import { requireAuth } from './middleware/auth'

export type Env = {
  Bindings: {
    DB: D1Database
    AUTH_SECRET: string
  }
}

const app = new Hono<Env>()

// CORS
app.use('/api/*', cors({
  origin: (origin) => {
    if (!origin) return 'https://coincidenze.pages.dev'
    if (
      origin === 'https://coincidenze.pages.dev' ||
      origin.endsWith('.coincidenze.pages.dev') ||
      origin.startsWith('http://localhost')
    ) return origin
    return 'https://coincidenze.pages.dev'
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}))

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', service: 'coincidenze-api' }))

// Auth (no middleware)
app.route('/api/auth', authRoutes)

// Protected routes (requireAuth only blocks POST/PUT/DELETE)
app.use('/api/events/*', requireAuth)
app.use('/api/artists/*', requireAuth)
app.use('/api/exhibitors/*', requireAuth)
app.use('/api/tasks/*', requireAuth)
app.use('/api/team/*', requireAuth)
app.use('/api/media/*', requireAuth)
app.use('/api/canvas/*', requireAuth)

// Routes
app.route('/api/events', eventsRoutes)
app.route('/api/artists', artistsRoutes)
app.route('/api/exhibitors', exhibitorsRoutes)
app.route('/api/tasks', tasksRoutes)
app.route('/api/team', teamRoutes)
app.route('/api/media', mediaRoutes)
app.route('/api/canvas', canvasRoutes)

export default app
