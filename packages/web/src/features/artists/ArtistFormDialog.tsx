import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ui/image-upload'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useArtistsStore } from '@/stores/artistsStore'
import { CATEGORY_LABELS, type EventCategory, type Artist } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  editItem?: Artist | null
}

export function ArtistFormDialog({ open, onClose, editItem }: Props) {
  const { createArtist, updateArtist, deleteArtist } = useArtistsStore()
  const [form, setForm] = useState({
    name: '',
    bio: '',
    category: '' as EventCategory | '',
    image_url: '',
    website: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isEditing = !!editItem

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '',
        bio: editItem.bio || '',
        category: (editItem.category || '') as EventCategory | '',
        image_url: editItem.image_url || '',
        website: editItem.website || '',
        notes: editItem.notes || '',
      })
    } else {
      setForm({ name: '', bio: '', category: '', image_url: '', website: '', notes: '' })
    }
  }, [editItem])

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        category: (form.category || undefined) as EventCategory | undefined,
        imageUrl: form.image_url,
        website: form.website,
        notes: form.notes,
      }
      if (isEditing) {
        await updateArtist(editItem!.id, payload)
      } else {
        await createArtist(payload)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editItem) return
    setDeleting(true)
    try {
      await deleteArtist(editItem.id)
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
            <DialogTitle>{isEditing ? 'Modifica Artista' : 'Aggiungi Artista'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-muted">Nome *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome artista"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted">Bio</label>
              <Input
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Breve descrizione"
              />
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

            <ImageUpload
              label="Foto"
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              placeholder="Carica foto o inserisci URL"
            />

            <div>
              <label className="text-xs font-medium text-ink-muted">Sito web</label>
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
              />
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
              <Button onClick={handleSave} disabled={saving || !form.name}>
                {saving ? 'Salvataggio...' : isEditing ? 'Salva' : 'Aggiungi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirmDelete}
        title="Elimina Artista"
        message={`Eliminare "${editItem?.name}"? L'azione non può essere annullata.`}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
        loading={deleting}
      />
    </>
  )
}
