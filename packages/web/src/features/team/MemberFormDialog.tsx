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
import { useTeamStore } from '@/stores/teamStore'
import type { TeamMember } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  member: TeamMember | null
}

export function MemberFormDialog({ open, onClose, member }: Props) {
  const { updateMember, deleteMember } = useTeamStore()
  const [form, setForm] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (member) {
      setForm({
        name: member.name || '',
        role: member.role || '',
        email: member.email || '',
        phone: member.phone || '',
        notes: member.notes || '',
      })
    }
  }, [member])

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await updateMember(member!.id, form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!member) return
    setDeleting(true)
    try {
      await deleteMember(member.id)
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
            <DialogTitle>Modifica Membro</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-muted">Nome *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Ruolo</label>
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="es. Fotografo, Organizzatore"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-muted">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@esempio.it"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Telefono</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+39 ..."
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Note</label>
              <textarea
                className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm min-h-[60px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Note opzionali"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowConfirmDelete(true)}
            >
              Elimina
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Annulla</Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Salvataggio...' : 'Salva'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirmDelete}
        title="Elimina Membro"
        message={`Eliminare "${member?.name}" dal team? L'azione non può essere annullata.`}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
        loading={deleting}
      />
    </>
  )
}
