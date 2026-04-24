import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, Calendar, MapPin, Clock, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PublicFooter } from '@/components/PublicFooter'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

interface Ticket {
  id: string
  ticket_code: string
  name: string
  surname: string
  email: string
  checked_in_at: string | null
  created_at: string
}

export function BigliettoPage() {
  const { code } = useParams<{ code: string }>()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const checkAuth = useAuthStore((s) => s.checkAuth)

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkInFlash, setCheckInFlash] = useState<'none' | 'now' | 'already'>('none')

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!code) return
    const API_BASE = import.meta.env.DEV ? '/api' : 'https://api.coincidenze.org/api'
    fetch(`${API_BASE}/accrediti/by-code/${encodeURIComponent(code)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Biglietto non trovato' : 'Errore nel caricamento')
        return res.json()
      })
      .then(setTicket)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [code])

  const handleCheckIn = async () => {
    if (!code) return
    setCheckingIn(true)
    try {
      const res = await api.checkInAccreditation(code)
      setCheckInFlash(res.already_checked_in ? 'already' : 'now')
      if (res.accreditation) setTicket(res.accreditation)
    } finally {
      setCheckingIn(false)
    }
  }

  const handleUncheckIn = async () => {
    if (!code) return
    setCheckingIn(true)
    try {
      const res = await api.uncheckInAccreditation(code)
      setCheckInFlash('none')
      if (res.accreditation) setTicket(res.accreditation)
    } finally {
      setCheckingIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy/50" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center p-4">
        <div className="max-w-sm text-center">
          <AlertCircle className="h-10 w-10 text-bordeaux/70 mx-auto mb-3" />
          <p className="text-navy font-medium">{error || 'Biglietto non trovato'}</p>
          <p className="text-sm text-ink-muted mt-2">
            Controlla il link o contatta l'organizzazione.
          </p>
          <Link
            to="/edizione-1"
            className="inline-flex items-center gap-1.5 text-sm text-viola hover:underline mt-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna all'evento
          </Link>
        </div>
      </div>
    )
  }

  const ticketUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/biglietto/${ticket.ticket_code}`
    : `/biglietto/${ticket.ticket_code}`

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=10&data=${encodeURIComponent(ticketUrl)}`
  const isCheckedIn = ticket.checked_in_at !== null

  return (
    <div className="min-h-screen bg-beige">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to="/edizione-1"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-navy transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Pagina evento
        </Link>

        <div className="bg-white rounded-3xl border border-navy/10 shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-navy text-white px-6 py-5 text-center">
            <p className="font-display text-2xl font-semibold">COINCIDENZE</p>
            <p className="text-xs opacity-80 tracking-wider uppercase mt-0.5">
              Edizione 1 · Biglietto di accredito
            </p>
          </div>

          {/* Status */}
          {isCheckedIn ? (
            <div className="bg-green-500/10 border-b border-green-500/20 px-6 py-3 flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Check-in effettuato</span>
            </div>
          ) : (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center gap-2 text-amber-900">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">In attesa di check-in</span>
            </div>
          )}

          {/* Nome */}
          <div className="px-6 pt-6 pb-2 text-center">
            <p className="text-xs text-ink-muted uppercase tracking-wider">Partecipante</p>
            <p className="font-display text-2xl font-semibold text-navy mt-1">
              {ticket.name} {ticket.surname}
            </p>
          </div>

          {/* QR */}
          <div className="px-6 py-4 flex justify-center">
            <div className="bg-beige rounded-xl p-4">
              <img
                src={qrSrc}
                alt="QR del biglietto"
                className="w-56 h-56 sm:w-64 sm:h-64"
                width={256}
                height={256}
              />
            </div>
          </div>

          <p className="text-center text-xs text-ink-muted px-6 mb-2">
            All'arrivo, conferma il check-in qui sotto.
          </p>

          {/* Self check-in pubblico */}
          <div className="px-6 pb-6">
            {!isCheckedIn ? (
              <Button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full bg-viola hover:bg-viola/90 text-white text-base py-6"
              >
                {checkingIn ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                Sono arrivato
              </Button>
            ) : (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-center">
                <CheckCircle2 className="h-5 w-5 text-green-700 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-800">
                  Check-in confermato{checkInFlash === 'now' && ' — benvenutə!'}
                </p>
              </div>
            )}
          </div>

          {/* Info evento */}
          <div className="border-t border-navy/10 px-6 py-5 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-ink-light">
              <Calendar className="h-4 w-4 text-navy/60 shrink-0" />
              <span>Sabato 25 aprile 2026</span>
            </div>
            <div className="flex items-center gap-2 text-ink-light">
              <MapPin className="h-4 w-4 text-navy/60 shrink-0" />
              <span>Marsam Locanda, Bene Vagienna</span>
            </div>
          </div>

          {/* Codice */}
          <div className="bg-beige/60 border-t border-navy/10 px-6 py-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">
              Codice biglietto
            </p>
            <p className="font-mono text-[11px] text-ink break-all mt-1">
              {ticket.ticket_code}
            </p>
          </div>

          {/* Azioni admin (solo per staff loggato): annulla check-in */}
          {isAuthenticated && isCheckedIn && (
            <div className="border-t border-navy/10 px-6 py-4 space-y-2 bg-navy/3">
              <p className="text-[10px] uppercase tracking-wider text-ink-muted text-center">
                Gestione staff
              </p>
              <Button
                onClick={handleUncheckIn}
                disabled={checkingIn}
                variant="outline"
                size="sm"
                className="w-full text-ink-muted hover:text-bordeaux"
              >
                {checkingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Annulla check-in
              </Button>
            </div>
          )}
        </div>

        <p className="text-xs text-ink-muted text-center mt-6 leading-relaxed">
          Salva questa pagina nei preferiti o tienila aperta sull'email.
          All'arrivo a Marsam, riaprila e tappa <strong>Sono arrivato</strong>.
        </p>
      </div>
      <PublicFooter />
    </div>
  )
}
