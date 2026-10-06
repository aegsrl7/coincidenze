import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Loader2, Pencil, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useMeetingsStore } from '@/stores/meetingsStore'
import { useCan } from '@/stores/authStore'
import { renderMarkdown, MARKDOWN_CLASS } from '@/lib/markdown'
import type { Meeting } from '@/types'
import { MeetingFormDialog } from './MeetingFormDialog'
import { fmtMeetingDate } from './RiunioniPage'

interface TranscriptBlock {
  speaker: string
  time: string
  text: string
}

// Un blocco per paragrafo: "**Nome** [hh:mm:ss] testo", anche senza nome o senza orario
function parseTranscript(src: string): TranscriptBlock[] {
  return src
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = /^(?:\*\*(.+?)\*\*\s*)?(?:\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*)?([\s\S]*)$/.exec(p)!
      return { speaker: m[1] ?? '', time: m[2] ?? '', text: m[3] }
    })
}

const SPEAKER_COLORS = ['text-navy', 'text-viola', 'text-bordeaux', 'text-ink-light']

export function RiunioneDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { fetchMeeting, deleteMeeting } = useMeetingsStore()
  const canEdit = useCan('riunioni.edit')

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let alive = true
    setMeeting(null)
    setError('')
    fetchMeeting(id)
      .then((m) => alive && setMeeting(m))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Riunione non trovata'))
    return () => { alive = false }
  }, [id, fetchMeeting])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteMeeting(id)
      navigate('/admin/riunioni', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eliminazione non riuscita')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <Link to="/admin/riunioni" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-navy mb-4">
        <ArrowLeft className="h-4 w-4" />
        Tutte le riunioni
      </Link>

      {error && <p className="text-sm text-bordeaux mb-4">{error}</p>}

      {!meeting ? (
        !error && <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-navy/40" /></div>
      ) : (
        <>
          <div className="flex flex-wrap items-start gap-3 mb-6">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink-muted first-letter:uppercase">{fmtMeetingDate(meeting.meeting_date)}</p>
              <h1 className="font-display text-2xl font-semibold text-navy leading-tight">{meeting.title}</h1>
              {meeting.participants && <p className="text-sm text-ink-light mt-1">{meeting.participants}</p>}
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Modifica
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} className="hover:text-bordeaux hover:border-bordeaux/40">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Elimina</span>
                </Button>
              </div>
            )}
          </div>

          <section className="rounded-xl border border-navy/10 bg-white/60 p-4 sm:p-5 mb-4">
            <h2 className="text-xs font-semibold text-navy uppercase tracking-wider mb-3">Punti chiave</h2>
            {meeting.summary ? (
              <div className={MARKDOWN_CLASS} dangerouslySetInnerHTML={{ __html: renderMarkdown(meeting.summary) }} />
            ) : (
              <p className="text-sm text-ink-muted">Ancora da scrivere.</p>
            )}
          </section>

          {meeting.prep_notes && (
            <Collapsible title="Materiale preparatorio">
              <div className={MARKDOWN_CLASS} dangerouslySetInnerHTML={{ __html: renderMarkdown(meeting.prep_notes) }} />
            </Collapsible>
          )}

          {meeting.transcript && (
            <Collapsible title="Trascrizione">
              <Transcript src={meeting.transcript} />
            </Collapsible>
          )}

          {editing && (
            <MeetingFormDialog
              meeting={meeting}
              onClose={() => setEditing(false)}
              onSaved={(m) => { setMeeting(m); setEditing(false) }}
            />
          )}
          <ConfirmDialog
            open={confirmDelete}
            title="Elimina riunione"
            message={`Eliminare "${meeting.title}" con punti chiave e trascrizione? Non si può annullare.`}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
            loading={deleting}
          />
        </>
      )}
    </div>
  )
}

/** Sezione chiusa all'inizio: la trascrizione può essere lunga e si apre solo se serve */
function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="rounded-xl border border-navy/10 bg-white/60 mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 sm:px-5 py-3 text-left"
      >
        <h2 className="flex-1 text-xs font-semibold text-navy uppercase tracking-wider">{title}</h2>
        <ChevronDown className={`h-4 w-4 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 sm:px-5 pb-5">{children}</div>}
    </section>
  )
}

function Transcript({ src }: { src: string }) {
  const blocks = useMemo(() => parseTranscript(src), [src])
  const [query, setQuery] = useState('')

  // Colore fisso per parlante, nell'ordine in cui compaiono
  const colorOf = useMemo(() => {
    const speakers = [...new Set(blocks.map((b) => b.speaker).filter(Boolean))]
    return (s: string) => SPEAKER_COLORS[speakers.indexOf(s) % SPEAKER_COLORS.length] ?? 'text-ink-muted'
  }, [blocks])

  const q = query.trim().toLowerCase()
  const shown = q ? blocks.filter((b) => b.text.toLowerCase().includes(q) || b.speaker.toLowerCase().includes(q)) : blocks
  const isTurn = (b: TranscriptBlock) => Boolean(b.speaker || b.time)

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca nella trascrizione" className="pl-8" />
      </div>
      {q && <p className="text-xs text-ink-muted mb-3">{shown.filter(isTurn).length} interventi su {blocks.filter(isTurn).length}</p>}
      <div className="space-y-3">
        {shown.map((b, i) => !b.speaker && !b.time ? (
          // Nota senza parlante né orario (es. un taglio): in corsivo, a tutta riga
          <p key={i} className="text-xs italic text-ink-muted">{b.text}</p>
        ) : (
          <div key={i} className="grid grid-cols-[auto_1fr] gap-x-3 text-sm">
            <span className="text-[11px] tabular-nums text-ink-muted pt-0.5 w-14">{b.time}</span>
            <p className="text-ink-light leading-relaxed min-w-0 break-words">
              {b.speaker && <span className={`font-semibold mr-1.5 ${colorOf(b.speaker)}`}>{b.speaker}</span>}
              {b.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
