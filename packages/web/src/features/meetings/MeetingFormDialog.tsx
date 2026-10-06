import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useMeetingsStore } from '@/stores/meetingsStore'
import type { Meeting, MeetingInput } from '@/types'

const textareaCls =
  'w-full rounded-md border border-navy/20 bg-white p-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-viola/40 resize-y'

const today = () => new Date().toLocaleDateString('sv-SE') // AAAA-MM-GG nel fuso del browser

/** Crea o modifica una riunione. I testi lunghi sono markdown (titoli, elenchi, grassetto). */
export function MeetingFormDialog({ meeting, onClose, onSaved }: {
  meeting?: Meeting
  onClose: () => void
  onSaved: (m: Meeting) => void
}) {
  const { createMeeting, updateMeeting } = useMeetingsStore()
  const [form, setForm] = useState<MeetingInput>({
    title: meeting?.title ?? '',
    meeting_date: meeting?.meeting_date ?? today(),
    participants: meeting?.participants ?? '',
    summary: meeting?.summary ?? '',
    prep_notes: meeting?.prep_notes ?? '',
    transcript: meeting?.transcript ?? '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k: keyof MeetingInput) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      onSaved(meeting ? await updateMeeting(meeting.id, form) : await createMeeting(form))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvataggio non riuscito')
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>{meeting ? 'Modifica riunione' : 'Nuova riunione'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="text-xs font-medium text-ink-muted">Titolo</label>
              <Input value={form.title} onChange={set('title')} autoFocus={!meeting} required maxLength={200} />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Data</label>
              <Input type="date" value={form.meeting_date} onChange={set('meeting_date')} required />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted">Partecipanti</label>
            <Input value={form.participants} onChange={set('participants')} placeholder="Matteo, Marco, Alice" maxLength={300} />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted">Punti chiave</label>
            <textarea value={form.summary} onChange={set('summary')} rows={10} className={textareaCls}
              placeholder={'## Decisioni\n- ...\n\n## Da fare\n- **Marco**: ...'} />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted">Materiale preparatorio</label>
            <textarea value={form.prep_notes} onChange={set('prep_notes')} rows={4} className={textareaCls}
              placeholder="Appunti o report portati alla riunione" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted">Trascrizione</label>
            <textarea value={form.transcript} onChange={set('transcript')} rows={4} className={`${textareaCls} font-mono text-xs`}
              placeholder="**Nome** [00:01:02] testo dell'intervento" />
          </div>
          <p className="text-xs text-ink-muted">
            I testi accettano markdown: ## per i titoli, - per gli elenchi, **grassetto**.
          </p>
          {error && <p className="text-sm text-bordeaux">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Annulla</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
