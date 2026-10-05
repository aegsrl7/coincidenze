import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { Field, PASSWORD_MIN } from './AuthCard'
import { AppCard } from './AppCard'

/** Il mio account: dati dell'utente e cambio password. */
export function AccountPage() {
  const user = useAuthStore((s) => s.user)
  const [form, setForm] = useState({ current: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setDone(false)
    if (form.password !== form.confirm) return setError('Le due password non coincidono')
    setSaving(true)
    try {
      await api.changePassword(form.current, form.password)
      setForm({ current: '', password: '', confirm: '' })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operazione non riuscita')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="p-4 sm:p-6 max-w-xl space-y-6">
      <section className="bg-white/60 rounded-xl border border-navy/10 p-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-ink-muted">Nome</dt>
          <dd className="text-navy font-medium">{user.name}</dd>
          <dt className="text-ink-muted">Email</dt>
          <dd className="text-navy">{user.email}</dd>
          <dt className="text-ink-muted">Ruolo</dt>
          <dd className="text-navy">{user.role.name}</dd>
        </dl>
        <p className="text-xs text-ink-muted mt-3">Nome, email e ruolo li cambia un amministratore dalla pagina Utenti.</p>
      </section>

      <AppCard />

      <section className="bg-white/60 rounded-xl border border-navy/10 p-5">
        <h2 className="font-display text-lg font-semibold text-navy mb-3">Cambia password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Password attuale">
            <Input type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} required />
          </Field>
          <Field label="Nuova password" hint={`Almeno ${PASSWORD_MIN} caratteri`}>
            <Input type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={PASSWORD_MIN} required />
          </Field>
          <Field label="Ripeti la nuova password">
            <Input type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
          </Field>
          {error && <p className="text-sm text-bordeaux">{error}</p>}
          {done && <p className="text-sm text-green-700">Password aggiornata. Le sessioni aperte su altri dispositivi sono state chiuse.</p>}
          <Button type="submit" disabled={saving}>{saving ? 'Salvataggio...' : 'Aggiorna password'}</Button>
        </form>
      </section>
    </div>
  )
}
