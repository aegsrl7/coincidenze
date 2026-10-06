import { useEffect, useState } from 'react'
import { Download, Share2, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { isAndroid, isIOS } from '@/lib/pwa'
import type { Meeting } from '@/types'
import type { PdfSection } from './meetingPdf'

const SECTIONS: { key: PdfSection; label: string; hint: string }[] = [
  { key: 'summary', label: 'Punti chiave', hint: 'Decisioni, cose da fare, temi aperti' },
  { key: 'prep_notes', label: 'Materiale preparatorio', hint: 'Su una pagina nuova' },
  { key: 'transcript', label: 'Trascrizione', hint: 'Su una pagina nuova, la parte più lunga' },
]

/**
 * Il PDF si crea in due tempi: prima si genera, poi si scarica o si condivide. La condivisione
 * del telefono va chiamata subito dopo un tocco, e la generazione può durare qualche secondo.
 */
export function PdfExportDialog({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const available = (k: PdfSection) => meeting[k].trim().length > 0
  const [chosen, setChosen] = useState<Set<PdfSection>>(
    () => new Set(available('summary') ? ['summary'] : SECTIONS.map((s) => s.key).filter(available).slice(0, 1))
  )
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  const toggle = (k: PdfSection) => {
    const next = new Set(chosen)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    setChosen(next)
    setFile(null)
    setUrl(null)
  }

  const build = async () => {
    setBuilding(true)
    setError('')
    try {
      const { buildMeetingPdf, pdfFileName } = await import('./meetingPdf')
      const order = SECTIONS.map((s) => s.key).filter((k) => chosen.has(k))
      const blob = await buildMeetingPdf(meeting, order)
      const f = new File([blob], pdfFileName(meeting), { type: 'application/pdf' })
      setFile(f)
      setUrl(URL.createObjectURL(f))
    } catch (e) {
      console.error('pdf', e)
      setError('Il PDF non si è creato. Riprova; se succede ancora, ricarica la pagina.')
    } finally {
      setBuilding(false)
    }
  }

  const canShare = file != null && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
  const mobile = isIOS() || isAndroid()

  const share = async () => {
    if (!file) return
    try {
      await navigator.share({ files: [file], title: meeting.title })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError('Condivisione non riuscita: usa Scarica.')
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>PDF da condividere</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {SECTIONS.map((s) => (
            <label key={s.key} className={`flex items-start gap-2.5 text-sm ${available(s.key) ? '' : 'opacity-50'}`}>
              <input
                type="checkbox"
                className="mt-0.5"
                checked={chosen.has(s.key)}
                disabled={!available(s.key) || building}
                onChange={() => toggle(s.key)}
              />
              <span>
                {s.label}
                <span className="block text-xs text-ink-muted">{available(s.key) ? s.hint : 'Vuoto in questa riunione'}</span>
              </span>
            </label>
          ))}
        </div>

        {file && url ? (
          <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2.5 text-sm text-green-900 flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="min-w-0 break-words">
              {file.name}
              <span className="block text-xs text-green-800/80">{Math.max(1, Math.round(file.size / 1024))} KB</span>
            </span>
          </div>
        ) : (
          <p className="text-xs text-ink-muted">Il PDF ha il logo e i font di Coincidenze, data e partecipanti in apertura e i numeri di pagina in fondo.</p>
        )}
        {error && <p className="text-sm text-bordeaux">{error}</p>}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Chiudi</Button>
          {!file || !url ? (
            <Button type="button" onClick={build} disabled={building || chosen.size === 0}>
              {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {building ? 'Creo il PDF...' : 'Crea PDF'}
            </Button>
          ) : (
            <>
              {canShare && (
                <Button type="button" variant={mobile ? 'default' : 'outline'} onClick={share}>
                  <Share2 className="h-4 w-4" />
                  Condividi
                </Button>
              )}
              <Button type="button" variant={mobile && canShare ? 'outline' : 'default'} asChild>
                <a href={url} download={file.name}>
                  <Download className="h-4 w-4" />
                  Scarica
                </a>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
