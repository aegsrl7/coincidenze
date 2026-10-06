import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, FileDown, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useMeetingsStore } from '@/stores/meetingsStore'
import { useCan } from '@/stores/authStore'
import { useTasksStore } from '@/stores/tasksStore'
import { useEditionsStore } from '@/stores/editionsStore'
import { MARKDOWN_CLASS } from '@/lib/markdown'
import type { Meeting, Task } from '@/types'
import { MeetingFormDialog } from './MeetingFormDialog'
import { fmtMeetingDate } from './RiunioniPage'
import { parseTranscript, isTurn, speakersOf } from './transcript'
import { PdfExportDialog } from './PdfExportDialog'
import { MarkdownView } from './MarkdownView'
import { AddTaskDialog } from './AddTaskDialog'
import { isTodoSection, taskMatches, todoDraft, type TodoDraft } from './todo'

const SPEAKER_COLORS = ['text-navy', 'text-viola', 'text-bordeaux', 'text-ink-light']
const CHIP = 'ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium align-[1px] whitespace-nowrap'

export function RiunioneDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { fetchMeeting, deleteMeeting } = useMeetingsStore()
  const canEdit = useCan('riunioni.edit')

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // "Da fare" → kanban: serve poter leggere e creare i task
  const canView = useCan('team.view')
  const canCreate = useCan('team.edit')
  const canAddTasks = canView && canCreate
  const { editions, fetch: fetchEditions, setAdminSlug } = useEditionsStore()
  const findTasks = useTasksStore((s) => s.findTasks)
  const [linked, setLinked] = useState<{ task: Task; editionSlug: string }[]>([])
  const [adding, setAdding] = useState<TodoDraft | null>(null)

  useEffect(() => {
    let alive = true
    setMeeting(null)
    setError('')
    fetchMeeting(id)
      .then((m) => alive && setMeeting(m))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Riunione non trovata'))
    return () => { alive = false }
  }, [id, fetchMeeting])

  useEffect(() => { if (canAddTasks) fetchEditions() }, [canAddTasks, fetchEditions])

  // Task già creati da questa riunione, in qualsiasi edizione: la voce mostra "Nel kanban"
  const meetingId = meeting?.id
  useEffect(() => {
    if (!meetingId || !canAddTasks || !editions.length) return
    let alive = true
    findTasks(editions.map((e) => e.slug), (t) => (t.description ?? '').includes(`/admin/riunioni/${meetingId}`))
      .then((found) => alive && setLinked(found))
      .catch(() => {})
    return () => { alive = false }
  }, [meetingId, canAddTasks, editions, findTasks])

  const openKanban = useCallback((slug: string) => {
    setAdminSlug(slug)
    navigate('/admin/team')
  }, [setAdminSlug, navigate])

  const todoAction = (item: string, heading: string | null) => {
    if (!meeting || !canAddTasks || !isTodoSection(heading)) return null
    const draft = todoDraft(item, meeting)
    const hit = linked.find((l) => taskMatches(l.task, draft, meeting))
    return hit ? (
      <button type="button" onClick={() => openKanban(hit.editionSlug)} title="Apri il kanban"
        className={`${CHIP} border-green-300 bg-green-50 text-green-800 hover:bg-green-100`}>
        <Check className="h-3 w-3" />Nel kanban
      </button>
    ) : (
      <button type="button" onClick={() => setAdding(draft)} title="Crea un task nel kanban"
        className={`${CHIP} border-viola/30 text-viola hover:bg-viola/5`}>
        <Plus className="h-3 w-3" />Kanban
      </button>
    )
  }

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
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-6">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink-muted first-letter:uppercase">{fmtMeetingDate(meeting.meeting_date)}</p>
              <h1 className="font-display text-2xl font-semibold text-navy leading-tight">{meeting.title}</h1>
              {meeting.participants && <p className="text-sm text-ink-light mt-1">{meeting.participants}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setExporting(true)}>
                <FileDown className="h-3.5 w-3.5" />
                PDF
              </Button>
              {canEdit && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Modifica
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} className="hover:text-bordeaux hover:border-bordeaux/40">
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only">Elimina</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          <section className="rounded-xl border border-navy/10 bg-white/60 p-4 sm:p-5 mb-4">
            <h2 className="text-xs font-semibold text-navy uppercase tracking-wider mb-3">Punti chiave</h2>
            {meeting.summary ? (
              <MarkdownView src={meeting.summary} className={MARKDOWN_CLASS} itemAction={todoAction} />
            ) : (
              <p className="text-sm text-ink-muted">Ancora da scrivere.</p>
            )}
          </section>

          {meeting.prep_notes && (
            <Collapsible title="Materiale preparatorio">
              <MarkdownView src={meeting.prep_notes} className={MARKDOWN_CLASS} />
            </Collapsible>
          )}

          {meeting.transcript && (
            <Collapsible title="Trascrizione">
              <Transcript src={meeting.transcript} />
            </Collapsible>
          )}

          {exporting && <PdfExportDialog meeting={meeting} onClose={() => setExporting(false)} />}
          {adding && (
            <AddTaskDialog
              draft={adding}
              onClose={() => setAdding(null)}
              onAdded={(task, editionSlug) => { setLinked((l) => [...l, { task, editionSlug }]); setAdding(null) }}
            />
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
    const speakers = speakersOf(blocks)
    return (s: string) => SPEAKER_COLORS[speakers.indexOf(s) % SPEAKER_COLORS.length] ?? 'text-ink-muted'
  }, [blocks])

  const q = query.trim().toLowerCase()
  const shown = q ? blocks.filter((b) => b.text.toLowerCase().includes(q) || b.speaker.toLowerCase().includes(q)) : blocks

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
