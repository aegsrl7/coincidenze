import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, loading } = useAuthStore()

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Solo percorsi interni all'area riservata: niente redirect verso siti esterni
  const requested = new URLSearchParams(location.search).get('from') || ''
  const from = /^\/admin(\/|$)/.test(requested) ? requested : '/admin/programma'

  if (!loading && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await login(password)
    setSubmitting(false)
    if (result.ok) {
      navigate(from, { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-beige flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-navy transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna al sito
        </button>

        <div className="bg-white/70 backdrop-blur rounded-2xl border border-navy/10 shadow-sm p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-12 w-12 rounded-full bg-navy/8 flex items-center justify-center mb-3">
              <Lock className="h-5 w-5 text-navy" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-navy">Area riservata</h1>
            <p className="text-sm text-ink-muted mt-1">COINCIDENZE</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-bordeaux">{error}</p>}
            <Button type="submit" disabled={submitting || !password} className="w-full">
              {submitting ? 'Accesso...' : 'Accedi'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
