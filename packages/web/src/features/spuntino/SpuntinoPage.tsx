import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, CheckCircle2, Clock, MapPin, Wine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PublicFooter } from '@/components/PublicFooter'
import { api } from '@/lib/api'

const DISHES = [
  'Gambero e lardo',
  'Cozza gratinata',
  'Parmigiana in carrozza affumicata',
  'Mezzo rigatone all’amatriciana',
  'Plin d’ombrina ripassati alla brace, limone salato e capperi',
  'Arrosticini e maionese piccante al prezzemolo',
]

const PRICE_PER_SEAT = 25

export function SpuntinoPage() {
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [seats, setSeats] = useState(1)
  const [notes, setNotes] = useState('')
  const [consentPrivacy, setConsentPrivacy] = useState(false)
  const [company, setCompany] = useState('') // honeypot

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ seats: number; emailSent: boolean } | null>(null)
  const [open, setOpen] = useState<boolean | null>(null)

  useEffect(() => {
    api.getSpuntinoStatus().then((s) => setOpen(s.open)).catch(() => setOpen(true))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!consentPrivacy) {
      setError("Devi accettare l'informativa sulla privacy per procedere.")
      return
    }
    setSubmitting(true)
    try {
      const res = await api.createSpuntinoBooking({
        name, surname, email, phone, seats, notes,
        consent_privacy: consentPrivacy,
        company,
      })
      setSuccess({ seats: res.seats, emailSent: res.email_sent })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const totalDue = seats * PRICE_PER_SEAT
  const maxSelectable = 20

  if (success) {
    return (
      <div className="min-h-screen bg-beige">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white/80 rounded-2xl border border-navy/10 p-8 text-center shadow-sm">
            <CheckCircle2 className="h-10 w-10 text-green-700 mx-auto mb-3" />
            <h1 className="font-display text-2xl font-semibold text-navy">Prenotazione confermata</h1>
            <p className="text-sm text-ink-light mt-2">
              Hai prenotato <strong className="text-navy">{success.seats}</strong>{' '}
              {success.seats === 1 ? 'posto' : 'posti'} per Lo spuntino delle 18.
            </p>
            <p className="text-sm text-ink-muted mt-1">Pagamento in loco: {success.seats * PRICE_PER_SEAT}€.</p>
            {success.emailSent ? (
              <p className="text-xs text-ink-muted mt-4">Ti abbiamo inviato un'email con il riepilogo.</p>
            ) : (
              <p className="text-xs text-amber-700 mt-4">L'invio email è fallito, ma la prenotazione è registrata.</p>
            )}
            <Link
              to="/edizione-1"
              className="inline-flex items-center gap-1.5 text-sm text-viola hover:underline mt-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna all'evento
            </Link>
          </div>
        </div>
        <PublicFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-beige">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to="/edizione-1"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-navy transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla pagina dell'evento
        </Link>

        <header className="text-center mb-8">
          <p className="text-[11px] tracking-[0.3em] uppercase text-viola mb-2">COINCIDENZE · Edizione 1</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-navy leading-tight">Lo spuntino delle 18</h1>
          <p className="text-sm text-ink-light italic mt-2">
            Sei piatti in sequenza, dove il calore diventa linguaggio e ogni boccone si prende il suo tempo.
          </p>
        </header>

        <div className="bg-white/70 rounded-2xl border border-navy/10 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-5">
            <Info icon={Clock} label="Sabato 25 aprile" value="ore 18:00" />
            <Info icon={MapPin} label="Marsam Locanda" value="sotto il portico" />
            <Info icon={Wine} label="Posti limitati" value={`${PRICE_PER_SEAT}€ a persona`} />
          </div>

          <p className="text-[11px] uppercase tracking-wider text-viola mb-2">Il menù</p>
          <ul className="space-y-1 text-sm text-ink">
            {DISHES.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="text-viola">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        {open === false ? (
          <div className="bg-bordeaux/5 border border-bordeaux/20 rounded-xl p-6 text-center">
            <p className="text-sm text-bordeaux">
              Le prenotazioni sono chiuse. Scrivici a{' '}
              <a href="mailto:coincidenze.arte@gmail.com" className="underline">coincidenze.arte@gmail.com</a>{' '}
              se vuoi essere avvisato per la prossima volta.
            </p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="bg-white/70 rounded-2xl border border-navy/10 p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label="Cognome" required>
                <Input value={surname} onChange={(e) => setSurname(e.target.value)} required />
              </Field>
              <Field label="Email" required>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Telefono" required>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </Field>
            </div>

            <Field label="Numero di posti">
              <select
                value={seats}
                onChange={(e) => setSeats(parseInt(e.target.value, 10))}
                className="w-full h-9 px-3 rounded-md border border-navy/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-viola/30"
              >
                {Array.from({ length: maxSelectable }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? 'posto' : 'posti'} — {n * PRICE_PER_SEAT}€</option>
                ))}
              </select>
              <p className="text-xs text-ink-muted mt-1">Pagamento in loco. Totale: <strong className="text-navy">{totalDue}€</strong></p>
            </Field>

            <Field label="Allergie o note (opzionale)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-navy/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-viola/30 resize-none"
                placeholder="Es. allergia ai crostacei, vegetariano…"
              />
            </Field>

            <label className="flex items-start gap-2 text-sm text-ink-light cursor-pointer">
              <input
                type="checkbox"
                checked={consentPrivacy}
                onChange={(e) => setConsentPrivacy(e.target.checked)}
                className="mt-0.5 accent-viola"
              />
              <span>
                Ho letto e accetto la{' '}
                <Link to="/privacy" target="_blank" className="text-viola underline">privacy policy</Link>.
              </span>
            </label>

            {/* honeypot */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
              aria-hidden="true"
            />

            {error && <p className="text-sm text-bordeaux">{error}</p>}

            <Button type="submit" disabled={submitting || !name || !surname || !email || !phone} className="w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Prenota'}
            </Button>
          </form>
        )}
      </div>
      <PublicFooter />
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-light mb-1 inline-block">
        {label}{required && <span className="text-bordeaux ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}

function Info({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-viola/70 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-ink-muted uppercase tracking-wider">{label}</p>
        <p className="text-sm text-navy font-medium leading-tight">{value}</p>
      </div>
    </div>
  )
}
