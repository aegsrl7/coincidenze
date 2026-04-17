import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

export function AccreditiFormPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cap, setCap] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [consentPrivacy, setConsentPrivacy] = useState(false)
  const [consentNewsletter, setConsentNewsletter] = useState(false)
  const [consentPhoto, setConsentPhoto] = useState(false)
  const [company, setCompany] = useState('') // honeypot

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!consentPrivacy) {
      setError("Devi accettare l'informativa sulla privacy per procedere.")
      return
    }

    setSubmitting(true)
    try {
      const res = await api.createAccreditation({
        name,
        surname,
        email,
        phone,
        cap,
        birth_date: birthDate,
        consent_privacy: consentPrivacy,
        consent_newsletter: consentNewsletter,
        consent_photo: consentPhoto,
        company,
      })
      navigate(`/biglietto/${res.ticket_code}`, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(msg)
      setSubmitting(false)
    }
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
          <img
            src="/logo-coincidenze.png"
            alt="COINCIDENZE — raffinate casualità, occhi attenti"
            className="w-full max-w-[280px] mx-auto mb-4"
          />
          <p className="text-viola italic">Edizione 1 &middot; Accrediti</p>
          <p className="text-sm text-ink-muted mt-2">
            25 aprile 2026 &middot; Marsam Locanda, Bene Vagienna
          </p>
          <p className="text-sm text-ink-light mt-4 leading-relaxed">
            L'ingresso è gratuito. Registrati per ricevere il biglietto con QR
            da presentare all'entrata.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur rounded-2xl border border-navy/10 shadow-sm p-6 sm:p-8 space-y-5">
          {/* Honeypot — non visibile, deve restare vuoto */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="absolute -left-[9999px] w-px h-px opacity-0"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldLabel label="Nome *">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="given-name"
              />
            </FieldLabel>
            <FieldLabel label="Cognome *">
              <Input
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
                autoComplete="family-name"
              />
            </FieldLabel>
          </div>

          <FieldLabel label="Email *">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              inputMode="email"
            />
          </FieldLabel>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldLabel label="Telefono">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
              />
            </FieldLabel>
            <FieldLabel label="CAP">
              <Input
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                autoComplete="postal-code"
                inputMode="numeric"
              />
            </FieldLabel>
          </div>

          <FieldLabel label="Data di nascita">
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              autoComplete="bday"
            />
          </FieldLabel>

          <div className="space-y-3 pt-2">
            <ConsentCheckbox
              checked={consentPrivacy}
              onChange={setConsentPrivacy}
              label={
                <>
                  Ho letto e accetto l'<a href="/privacy" className="text-viola underline">informativa privacy</a>. *
                </>
              }
            />
            <ConsentCheckbox
              checked={consentNewsletter}
              onChange={setConsentNewsletter}
              label="Accetto di ricevere aggiornamenti sulle prossime edizioni via email."
            />
            <ConsentCheckbox
              checked={consentPhoto}
              onChange={setConsentPhoto}
              label="Autorizzo l'uso di riprese foto/video effettuate durante l'evento per comunicazioni istituzionali."
            />
          </div>

          {error && (
            <div className="rounded-md bg-bordeaux/10 border border-bordeaux/30 px-3 py-2 text-sm text-bordeaux">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Invio...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Conferma accredito
              </>
            )}
          </Button>

          <p className="text-xs text-ink-muted text-center">
            * campi obbligatori. I dati sono trattati esclusivamente per la
            gestione degli accrediti all'evento.
          </p>
        </form>
      </div>
    </div>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink-light mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function ConsentCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-navy/30 text-navy focus:ring-viola/40"
      />
      <span className="text-sm text-ink-light leading-relaxed">{label}</span>
    </label>
  )
}
