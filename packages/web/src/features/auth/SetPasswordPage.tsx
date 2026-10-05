import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { AuthCard, Field, PASSWORD_MIN } from './AuthCard'

/** Pagina del link di invito o di reset: si sceglie la password e si entra. */
export function SetPasswordPage() {
  const { token = '' } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const checkAuth = useAuthStore((s) => s.checkAuth)

  const [info, setInfo] = useState<{ purpose: 'invite' | 'reset'; email: string; name: string } | null>(null)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.getAccessToken(token).then(setInfo).catch(() => setInvalid(true))
  }, [token])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Le due password non coincidono')
    setSubmitting(true)
    try {
      await api.setPassword(token, password)
      await checkAuth()
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operazione non riuscita')
      setSubmitting(false)
    }
  }

  if (invalid) {
    return (
      <AuthCard title="Link non valido" subtitle="Il link è scaduto o è già stato usato.">
        <div className="space-y-3 text-center">
          <p className="text-sm text-ink-light">
            Chiedi un nuovo link dalla pagina di login con “Password dimenticata?”, oppure a un amministratore.
          </p>
          <Link to="/login" className="inline-block text-sm text-viola hover:underline">Vai al login</Link>
        </div>
      </AuthCard>
    )
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy/50" />
      </div>
    )
  }

  return (
    <AuthCard
      title={info.purpose === 'invite' ? `Ciao ${info.name}` : 'Nuova password'}
      subtitle={info.purpose === 'invite'
        ? 'Scegli la password per entrare nell’area riservata di COINCIDENZE.'
        : 'Scegli la nuova password per il tuo accesso.'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <Input type="email" autoComplete="username" value={info.email} readOnly className="bg-beige/60" />
        </Field>
        <Field label="Password" hint={`Almeno ${PASSWORD_MIN} caratteri`}>
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={PASSWORD_MIN} autoFocus required />
        </Field>
        <Field label="Ripeti la password">
          <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
        {error && <p className="text-sm text-bordeaux">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Salvataggio...' : 'Salva ed entra'}
        </Button>
      </form>
    </AuthCard>
  )
}
