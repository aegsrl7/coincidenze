import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTasksStore } from '@/stores/tasksStore'
import { useTeamStore } from '@/stores/teamStore'
import { useEditionsStore } from '@/stores/editionsStore'
import type { Task } from '@/types'
import { memberFor, type TodoDraft } from './todo'

const fieldCls = 'flex h-9 w-full rounded-md border border-navy/20 bg-crema px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30'
const textareaCls = 'w-full rounded-md border border-navy/20 bg-white p-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-viola/40 resize-y'

/** Una voce dei "Da fare" diventa un task del kanban, nella colonna Da fare. Campi già compilati, modificabili. */
export function AddTaskDialog({ draft, onClose, onAdded }: {
  draft: TodoDraft
  onClose: () => void
  onAdded: (task: Task, editionSlug: string) => void
}) {
  const createTask = useTasksStore((s) => s.createTask)
  const { members, fetchMembers } = useTeamStore()
  const { editions, fetch: fetchEditions } = useEditionsStore()

  useEffect(() => { fetchMembers() }, [fetchMembers])
  useEffect(() => { fetchEditions() }, [fetchEditions])

  // Le riunioni preparano l'edizione che viene: di default la più recente
  const sortedEditions = useMemo(() => [...editions].sort((a, b) => b.year - a.year), [editions])
  const [form, setForm] = useState({
    title: draft.title,
    description: draft.description,
    assigneeId: '',
    editionSlug: '',
    dueDate: '',
    priority: 'medium' as Task['priority'],
  })
  // Persona ed edizione si propongono quando arrivano team ed edizioni, senza sovrascrivere una scelta già fatta
  useEffect(() => {
    setForm((f) => (f.assigneeId ? f : { ...f, assigneeId: memberFor(draft.owner, members) }))
  }, [members, draft.owner])
  useEffect(() => {
    setForm((f) => (f.editionSlug || !sortedEditions[0] ? f : { ...f, editionSlug: sortedEditions[0].slug }))
  }, [sortedEditions])

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const task = await createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        status: 'todo',
        priority: form.priority,
        assigneeId: form.assigneeId || undefined,
        dueDate: form.dueDate || undefined,
      } as Partial<Task>, form.editionSlug)
      onAdded(task, form.editionSlug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task non creato')
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>Aggiungi al kanban</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-muted">Task</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={300} />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted">Note</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={textareaCls} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-ink-muted">Assegnato a</label>
              <select className={fieldCls} value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                <option value="">Nessuno</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {draft.owner && !form.assigneeId && (
                <p className="text-[11px] text-ink-muted mt-1">Nella riunione: {draft.owner}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Edizione</label>
              <select className={fieldCls} value={form.editionSlug} onChange={(e) => setForm({ ...form, editionSlug: e.target.value })} required>
                {sortedEditions.map((ed) => <option key={ed.slug} value={ed.slug}>{ed.name} ({ed.year})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Scadenza</label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Priorità</label>
              <select className={fieldCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Bassa</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-ink-muted">Il task finisce nella colonna "Da fare" con il rimando a questa riunione.</p>
          {error && <p className="text-sm text-bordeaux">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Annulla</Button>
            <Button type="submit" disabled={saving || !form.editionSlug}>{saving ? 'Aggiungo...' : 'Aggiungi'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
