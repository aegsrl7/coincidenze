import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useTasksStore } from '@/stores/tasksStore'
import { useTeamStore } from '@/stores/teamStore'
import { CATEGORY_LABELS, type EventCategory, type Task } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  task?: Task
}

export function TaskFormDialog({ open, onClose, task }: Props) {
  const { createTask, updateTask, deleteTask } = useTasksStore()
  const { members } = useTeamStore()
  const isEditing = !!task
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    assigneeId: '',
    category: '' as EventCategory | '',
    dueDate: '',
  })
  const [saving, setSaving] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setForm({
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'todo',
      priority: task?.priority || 'medium',
      assigneeId: task?.assignee_id || '',
      category: (task?.category || '') as EventCategory | '',
      dueDate: task?.due_date || '',
    })
  }, [task])

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

  const handleDelete = async () => {
    if (!task) return
    setDeleting(true)
    try {
      await deleteTask(task.id)
      setShowConfirmDelete(false)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
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
                <label className="text-xs font-medium text-ink-muted">Priorita</label>
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

          <div className="flex items-center justify-between pt-4">
            {isEditing ? (
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setShowConfirmDelete(true)}
              >
                Elimina
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Annulla</Button>
              <Button onClick={handleSave} disabled={saving || !form.title}>
                {saving ? 'Salvataggio...' : isEditing ? 'Salva' : 'Crea Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirmDelete}
        title="Elimina Task"
        message={`Eliminare "${task?.title}"? L'azione non può essere annullata.`}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
        loading={deleting}
      />
    </>
  )
}
