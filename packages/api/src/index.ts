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
import { editionsRoutes } from './routes/editions'
import { accreditationsRoutes } from './routes/accreditations'
import { spuntinoRoutes } from './routes/spuntino'
import { menuRoutes } from './routes/menu'
import { categoriesRoutes } from './routes/categories'
import { usersRoutes } from './routes/users'
import { rolesRoutes } from './routes/roles'
import { requirePermission } from './middleware/auth'
import { loadSessionUser, type SessionUser } from './lib/session'
import { sendEmail, buildReminderEmail } from './lib/email'

const REMINDER_TO = 'coincidenze.arte@gmail.com'

export type Env = {
  Bindings: {
    DB: D1Database
    /** Password condivisa: serve solo a creare il primo amministratore (o a ripristinarlo se non ne resta nessuno) */
    AUTH_SECRET: string
    /** Chiave casuale che firma le sessioni. Non è una password: non la conosce nessuno. */
    SESSION_SECRET?: string
    MEDIA_BUCKET: R2Bucket
    RESEND_API_KEY?: string
    RESEND_FROM?: string
    PUBLIC_BASE_URL?: string
  }
  Variables: {
    /** Utente della sessione con i suoi permessi, null se la richiesta è anonima */
    user: SessionUser | null
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
  // PATCH serve a /api/editions/:id (modifica edizione, apri/chiudi accrediti e spuntino)
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Utente della sessione per tutte le rotte /api/* (null = anonimo)
app.use('/api/*', async (c, next) => {
  c.set('user', await loadSessionUser(c))
  await next()
})

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', service: 'coincidenze-api' }))

// Auth (no middleware)
app.route('/api/auth', authRoutes)

// Editions (auth gestito per-route: GET pubblico, mutazioni con edizioni.edit)
app.route('/api/editions', editionsRoutes)

// Pagina dati statica (no auth, no CORS — serve HTML)
app.route('/dati', datiRoutes)

// Upload (POST per chi modifica media, artisti, programma o edizioni; GET pubblico)
app.route('/api', uploadRoutes)

// Accrediti (auth per-route: POST, by-code e self check-in pubblici, resto con i permessi accrediti.*)
app.route('/api/accrediti', accreditationsRoutes)

// Spuntino delle 18 (auth per-route: POST e GET /status pubblici, resto con i permessi spuntino.*)
app.route('/api/spuntino', spuntinoRoutes)

// Permessi per gruppo (catalogo in lib/permissions.ts). Lettura 'public' solo per
// quello che serve alle pagine pubbliche.
app.use('/api/events/*', requirePermission({ read: 'public', write: 'programma.edit', remove: 'programma.delete' }))
app.use('/api/artists/*', requirePermission({ read: 'public', write: 'artisti.edit', remove: 'artisti.delete' }))
app.use('/api/media/*', requirePermission({ read: 'public', write: 'media.edit', remove: 'media.delete' }))
app.use('/api/editorial/*', requirePermission({ read: 'editoriale.view', write: 'editoriale.edit', remove: 'editoriale.delete' }))
app.use('/api/menu/*', requirePermission({ read: 'public', write: 'menu.edit' }))
app.use('/api/categories/*', requirePermission({ read: 'public', write: 'categorie.edit' }))
app.use('/api/exhibitors/*', requirePermission({ read: 'programma.view', write: 'programma.edit' }))
app.use('/api/tasks/*', requirePermission({ read: 'team.view', write: 'team.edit' }))
app.use('/api/team/*', requirePermission({ read: 'team.view', write: 'team.edit' }))
app.use('/api/canvas/*', requirePermission({ read: 'programma.view', write: 'programma.edit' }))
app.use('/api/users/*', requirePermission({ read: 'utenti.manage', write: 'utenti.manage' }))
app.use('/api/roles/*', requirePermission({ read: 'utenti.manage', write: 'utenti.manage' }))

// Routes
app.route('/api/events', eventsRoutes)
app.route('/api/artists', artistsRoutes)
app.route('/api/exhibitors', exhibitorsRoutes)
app.route('/api/tasks', tasksRoutes)
app.route('/api/team', teamRoutes)
app.route('/api/media', mediaRoutes)
app.route('/api/canvas', canvasRoutes)
app.route('/api/editorial', editorialRoutes)
app.route('/api/menu', menuRoutes)
app.route('/api/categories', categoriesRoutes)
app.route('/api/users', usersRoutes)
app.route('/api/roles', rolesRoutes)

// Reminder giornaliero piano editoriale: cron fires alle 16 e 17 UTC,
// qui filtriamo per ora locale Europe/Rome così copriamo CEST e CET.
async function scheduled(_event: ScheduledController, env: Env['Bindings']): Promise<void> {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  if (parseInt(get('hour'), 10) !== 18) return

  const today = `${get('year')}-${get('month')}-${get('day')}`

  const { results } = await env.DB
    .prepare("SELECT data, titolo, emoji, tag, formato FROM editorial_posts WHERE data = ? AND stato = 'da_fare' ORDER BY tag, titolo")
    .bind(today)
    .all<{ data: string; titolo: string; emoji: string; tag: string; formato: string }>()

  if (!results || results.length === 0) return

  const dateLabel = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date())

  const { subject, html, text } = buildReminderEmail({ dateLabel, posts: results })
  await sendEmail(env, { to: REMINDER_TO, subject, html, text })
}

export default {
  fetch: app.fetch,
  scheduled,
}
