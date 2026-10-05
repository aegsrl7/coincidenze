import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { AuthCard, Field, PASSWORD_MIN } from './AuthCard'

type Mode = 'checking' | 'login' | 'forgot' | 'setup'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, checkAuth, isAuthenticated, loading } = useAuthStore()
  const [mode, setMode] = useState<Mode>('checking')

  // Solo percorsi interni all'area riservata: niente redirect verso siti esterni
  const requested = new URLSearchParams(location.search).get('from') || ''
  const from = /^\/admin(\/|$)/.test(requested) ? requested : '/admin'

  // Senza nessun amministratore attivo si apre il primo accesso
  useEffect(() => {
    api.setupStatus()
      .then((s) => setMode(s.needsSetup ? 'setup' : 'login'))
      .catch(() => setMode('login'))
  }, [])

  if (!loading && isAuthenticated) return <Navigate to={from} replace />

  if (mode === 'checking') {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy/50" />
      </div>
    )
  }

  if (mode === 'setup') {
    return <SetupForm onDone={async () => { await checkAuth(); navigate('/admin', { replace: true }) }} />
  }

  if (mode === 'forgot') return <ForgotForm onBack={() => setMode('login')} />

  return (
    <LoginForm
      onSubmit={async (email, password) => {
        const result = await login(email, password)
        if (result.ok) navigate(from, { replace: true })
        return result.ok ? '' : result.error
      }}
      onForgot={() => setMode('forgot')}
    />
  )
}

function LoginForm({ onSubmit, onForgot }: { onSubmit: (email: string, password: string) => Promise<string>; onForgot: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    setError(await onSubmit(email, password))
    setSubmitting(false)
  }

  return (
    <AuthCard title="Area riservata" subtitle="COINCIDENZE">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
        </Field>
        <Field label="Password">
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <p className="text-sm text-bordeaux">{error}</p>}
        <Button type="submit" disabled={submitting || !email || !password} className="w-full">
          {submitting ? 'Accesso...' : 'Accedi'}
        </Button>
        <button type="button" onClick={onForgot} className="block mx-auto text-sm text-viola hover:underline">
          Password dimenticata?
        </button>
      </form>
    </AuthCard>
  )
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Richiesta non riuscita')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Password dimenticata" subtitle="Ti mandiamo un link per sceglierne una nuova">
      {sent ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-ink-light">
            Se <strong>{email}</strong> è registrata, riceverai un'email con il link. Il link vale 1 ora.
          </p>
          <Button variant="outline" onClick={onBack} className="w-full">Torna al login</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email">
            <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
          </Field>
          {error && <p className="text-sm text-bordeaux">{error}</p>}
          <Button type="submit" disabled={submitting || !email} className="w-full">
            {submitting ? 'Invio...' : 'Manda il link'}
          </Button>
          <button type="button" onClick={onBack} className="block mx-auto text-sm text-ink-muted hover:text-navy">
            Torna al login
          </button>
        </form>
      )}
    </AuthCard>
  )
}

function SetupForm({ onDone }: { onDone: () => Promise<void> }) {
  const [form, setForm] = useState({ secret: '', name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Le due password non coincidono')
    setSubmitting(true)
    try {
      await api.setup({ secret: form.secret, name: form.name, email: form.email, password: form.password })
      await onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operazione non riuscita')
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Primo accesso"
      subtitle="Crea il tuo account da amministratore. Per confermare serve la password admin usata finora."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Password admin usata finora">
          <Input type="password" autoComplete="off" value={form.secret} onChange={set('secret')} autoFocus required />
        </Field>
        <Field label="Il tuo nome">
          <Input autoComplete="name" value={form.name} onChange={set('name')} required />
        </Field>
        <Field label="La tua email">
          <Input type="email" autoComplete="username" value={form.email} onChange={set('email')} required />
        </Field>
        <Field label="Nuova password personale" hint={`Almeno ${PASSWORD_MIN} caratteri`}>
          <Input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} minLength={PASSWORD_MIN} required />
        </Field>
        <Field label="Ripeti la password">
          <Input type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} required />
        </Field>
        {error && <p className="text-sm text-bordeaux">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Creazione...' : 'Crea account ed entra'}
        </Button>
      </form>
    </AuthCard>
  )
}
