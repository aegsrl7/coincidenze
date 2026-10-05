import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft } from 'lucide-react'

/** Riquadro comune a login, primo accesso e scelta della password. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-beige flex items-center justify-center px-4 py-10">
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
            <h1 className="font-display text-2xl font-semibold text-navy">{title}</h1>
            {subtitle && <div className="text-sm text-ink-muted mt-1">{subtitle}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="block text-[11px] text-ink-muted mt-1">{hint}</span>}
    </label>
  )
}

export const PASSWORD_MIN = 10
