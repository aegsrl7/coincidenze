import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Loader2, FileText, MessagesSquare, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMeetingsStore } from '@/stores/meetingsStore'
import { useCan } from '@/stores/authStore'
import { MeetingFormDialog } from './MeetingFormDialog'

export function fmtMeetingDate(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// L'anteprima arriva in markdown: via i segni, resta il testo
const plain = (md: string) => md.replace(/^#+\s+/gm, '').replace(/^\s*(?:[-*]|\d+[.)])\s+/gm, '').replace(/\*\*?/g, '').replace(/\s+/g, ' ').trim()

export function RiunioniPage() {
  const { meetings, loading, error, fetchMeetings } = useMeetingsStore()
  const canEdit = useCan('riunioni.edit')
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <p className="text-sm text-ink-muted">Le riunioni organizzative: punti chiave, materiale portato al tavolo e trascrizione.</p>
        {canEdit && (
          <Button className="ml-auto" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Nuova riunione
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-bordeaux mb-4">{error}</p>}

      {loading && meetings.length === 0 ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-navy/40" /></div>
      ) : meetings.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-muted">Nessuna riunione per ora.</p>
      ) : (
        <ul className="space-y-3">
          {meetings.map((m) => (
            <li key={m.id}>
              <Link
                to={`/admin/riunioni/${m.id}`}
                className="group flex gap-3 rounded-xl border border-navy/10 bg-white/60 p-4 hover:border-navy/25 hover:bg-white transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-muted first-letter:uppercase">{fmtMeetingDate(m.meeting_date)}</p>
                  <p className="font-display text-lg font-semibold text-navy leading-snug">{m.title}</p>
                  {m.participants && <p className="text-xs text-ink-light mt-0.5">{m.participants}</p>}
                  {m.summary_preview && <p className="text-sm text-ink-light mt-2 line-clamp-2">{plain(m.summary_preview)}</p>}
                  {(m.has_transcript || m.has_prep_notes) && (
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-ink-muted">
                      {m.has_transcript && <span className="inline-flex items-center gap-1"><MessagesSquare className="h-3 w-3" />Trascrizione</span>}
                      {m.has_prep_notes && <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />Materiale preparatorio</span>}
                    </div>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 self-center shrink-0 text-ink-muted group-hover:text-navy" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <MeetingFormDialog
          onClose={() => setCreating(false)}
          onSaved={(m) => { setCreating(false); navigate(`/admin/riunioni/${m.id}`) }}
        />
      )}
    </div>
  )
}
