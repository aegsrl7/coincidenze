import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTasksStore } from '@/stores/tasksStore'
import { useTeamStore } from '@/stores/teamStore'
import { CATEGORY_LABELS, type EventCategory, type Task } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  task?: Task
}

export function TaskFormDialog({ open, onClose, task }: Props) {
  const { createTask, updateTask } = useTasksStore()
  const { members } = useTeamStore()
  const isEditing = !!task
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo' as Task['status'],
    priority: task?.priority || 'medium' as Task['priority'],
    assigneeId: task?.assignee_id || '',
    category: (task?.category || '') as EventCategory | '',
    dueDate: task?.due_date || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.title) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        category: (form.category || undefined) as EventCategory | undefined,
        assigneeId: form.assigneeId || undefined,
        dueDate: form.dueDate || undefined,
      } as any
      if (isEditing) {
        await updateTask(task.id, payload)
      } else {
        await createTask(payload)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifica Task' : 'Nuovo Task'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-muted">Titolo *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Cosa deve essere fatto?"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-muted">Descrizione</label>
            <textarea
              className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm min-h-[60px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-ink-muted">Priorità</label>
              <select
                className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
              >
                <option value="low">Bassa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Scadenza</label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          {isEditing && (
            <div>
              <label className="text-xs font-medium text-ink-muted">Stato</label>
              <select
                className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              >
                <option value="todo">Da Fare</option>
                <option value="in_progress">In Corso</option>
                <option value="done">Completato</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-ink-muted">Assegnatario</label>
            <select
              className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm"
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
            >
              <option value="">-- Nessuno --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-muted">Categoria</label>
            <select
              className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}
            >
              <option value="">-- Nessuna --</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button onClick={handleSave} disabled={saving || !form.title}>
            {saving ? 'Salvataggio...' : isEditing ? 'Salva' : 'Crea Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
