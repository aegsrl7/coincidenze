import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, AlertCircle, Clock, Camera, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

const QR_LIB_URL = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js'

type ScanStatus = 'success' | 'already' | 'error'
interface ScanEntry {
  id: string
  code: string
  name: string
  detail: string
  status: ScanStatus
  at: number
}

function extractTicketCode(text: string): string | null {
  const trimmed = text.trim()
  // URL form: ".../biglietto/<uuid>"
  try {
    const url = new URL(trimmed)
    const m = url.pathname.match(/\/biglietto\/([0-9a-fA-F-]{8,})/)
    if (m) return m[1]
  } catch {
    // not a URL
  }
  // Plain UUID
  if (/^[0-9a-fA-F-]{8,}$/.test(trimmed)) return trimmed
  return null
}

function formatTime(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function CheckInPage() {
  const [scans, setScans] = useState<ScanEntry[]>([])
  const [bootError, setBootError] = useState('')
  const [scannerReady, setScannerReady] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [submittingManual, setSubmittingManual] = useState(false)
  const lastScanRef = useRef<{ code: string; at: number } | null>(null)
  const scannerRef = useRef<any>(null)

  const handleScan = async (rawText: string) => {
    const code = extractTicketCode(rawText)
    if (!code) return
    const now = Date.now()
    // Debounce: ignore stesso codice entro 3s
    if (lastScanRef.current && lastScanRef.current.code === code && now - lastScanRef.current.at < 3000) {
      return
    }
    lastScanRef.current = { code, at: now }

    try {
      const res = (await api.checkInAccreditation(code)) as {
        accreditation?: { name: string; surname: string; email: string }
        already_checked_in: boolean
      }
      const acc = res.accreditation
      const name = acc ? `${acc.name} ${acc.surname}`.trim() : code.slice(0, 8)
      const detail = res.already_checked_in
        ? 'Già fatto check-in in precedenza'
        : 'Check-in registrato ora'
      const entry: ScanEntry = {
        id: `${code}-${now}`,
        code,
        name,
        detail,
        status: res.already_checked_in ? 'already' : 'success',
        at: now,
      }
      setScans((prev) => [entry, ...prev].slice(0, 30))
      // Beep
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = res.already_checked_in ? 440 : 880
        gain.gain.value = 0.05
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.12)
      } catch {
        // ignore
      }
    } catch {
      const entry: ScanEntry = {
        id: `${code}-${now}`,
        code,
        name: 'Biglietto non trovato',
        detail: code,
        status: 'error',
        at: now,
      }
      setScans((prev) => [entry, ...prev].slice(0, 30))
    }
  }

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim() || submittingManual) return
    setSubmittingManual(true)
    try {
      await handleScan(manualCode)
      setManualCode('')
    } finally {
      setSubmittingManual(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadLib = (): Promise<void> => {
      const w = window as any
      if (w.Html5Qrcode) return Promise.resolve()
      const existing = document.querySelector(`script[src="${QR_LIB_URL}"]`) as HTMLScriptElement | null
      if (existing) {
        return new Promise<void>((resolve, reject) => {
          existing.addEventListener('load', () => resolve())
          existing.addEventListener('error', () => reject(new Error('Caricamento libreria fallito')))
        })
      }
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = QR_LIB_URL
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Caricamento libreria fallito'))
        document.body.appendChild(script)
      })
    }

    const start = async () => {
      try {
        await loadLib()
        if (cancelled) return
        const Html5Qrcode = (window as any).Html5Qrcode
        if (!Html5Qrcode) throw new Error('Libreria non disponibile')
        const scanner = new Html5Qrcode('qr-reader-area')
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 260, height: 260 } },
          (decodedText: string) => handleScan(decodedText),
          () => {}
        )
        if (cancelled) {
          scanner.stop().catch(() => {})
          return
        }
        setScannerReady(true)
      } catch (e: any) {
        if (!cancelled) setBootError(e?.message || 'Impossibile avviare la fotocamera')
      }
    }

    start()

    return () => {
      cancelled = true
      const s = scannerRef.current
      if (s) {
        try {
          s.stop().then(() => s.clear()).catch(() => {})
        } catch {
          // ignore
        }
        scannerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalDone = scans.filter((s) => s.status !== 'error').length
  const totalNow = scans.filter((s) => s.status === 'success').length

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h1 className="font-display text-2xl font-semibold text-navy">Check-in</h1>
        <div className="text-xs text-ink-muted">
          <span className="font-medium text-navy">{totalNow}</span> appena entrati
          <span className="mx-1.5 text-navy/30">·</span>
          <span className="font-medium">{totalDone}</span> totali in questa sessione
        </div>
      </div>

      <div className="bg-black rounded-xl overflow-hidden aspect-square max-w-md mx-auto relative">
        <div id="qr-reader-area" className="w-full h-full" />
        {!scannerReady && !bootError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-xs">Avvio fotocamera…</p>
          </div>
        )}
        {bootError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90 gap-3 px-6 text-center">
            <AlertCircle className="h-8 w-8 text-bordeaux/80" />
            <p className="text-sm">{bootError}</p>
            <p className="text-xs text-white/60">
              Concedi i permessi della fotocamera o usa l'inserimento manuale qui sotto.
            </p>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <RefreshCw className="h-3.5 w-3.5" />
              Riprova
            </Button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-ink-muted italic mt-3 flex items-center justify-center gap-1.5">
        <Camera className="h-3.5 w-3.5" />
        Inquadra il QR del biglietto. Il check-in parte da solo.
      </p>

      <form onSubmit={handleManualSubmit} className="mt-6 flex gap-2">
        <Input
          placeholder="Codice biglietto (per inserimento manuale)"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
        />
        <Button type="submit" variant="outline" disabled={!manualCode.trim() || submittingManual}>
          {submittingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invia'}
        </Button>
      </form>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-navy mb-2">Scansioni recenti</h2>
        {scans.length === 0 ? (
          <p className="text-sm text-ink-muted italic">In attesa della prima scansione…</p>
        ) : (
          <div className="space-y-1.5">
            {scans.map((s) => (
              <ScanRow key={s.id} entry={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ScanRow({ entry }: { entry: ScanEntry }) {
  const styles = {
    success: 'border-green-300 bg-green-50 text-green-900',
    already: 'border-amber-300 bg-amber-50 text-amber-900',
    error: 'border-bordeaux/30 bg-bordeaux/5 text-bordeaux',
  }[entry.status]
  const Icon =
    entry.status === 'success' ? CheckCircle2 : entry.status === 'already' ? Clock : AlertCircle
  return (
    <div className={`rounded-lg border px-3 py-2 flex items-center gap-3 ${styles}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.name}</p>
        <p className="text-xs opacity-80 truncate">{entry.detail}</p>
      </div>
      <p className="text-xs font-mono opacity-70 shrink-0">{formatTime(entry.at)}</p>
    </div>
  )
}
