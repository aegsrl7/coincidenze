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
import { useMediaStore } from '@/stores/mediaStore'
import { useArtistsStore } from '@/stores/artistsStore'
import { useCategoryMaps } from '@/stores/categoriesStore'
import { type EventCategory, type MediaItem } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  editItem?: MediaItem | null
}

export function MediaFormDialog({ open, onClose, editItem }: Props) {
  const { createMedia, updateMedia, deleteMedia } = useMediaStore()
  const { artists } = useArtistsStore()
  const { list: artistCats } = useCategoryMaps('artist')
  const [form, setForm] = useState({
    title: '',
    type: 'video' as 'audio' | 'video' | 'image',
    url: '',
    thumbnailUrl: '',
    artistId: '',
    category: '' as EventCategory | '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isEditing = !!editItem

  useEffect(() => {
    if (editItem) {
      setForm({
        title: editItem.title || '',
        type: editItem.type || 'video',
        url: editItem.url || '',
        thumbnailUrl: editItem.thumbnail_url || '',
        artistId: editItem.artist_id || '',
        category: (editItem.category || '') as EventCategory | '',
        notes: editItem.notes || '',
      })
    } else {
      setForm({ title: '', type: 'video', url: '', thumbnailUrl: '', artistId: '', category: '', notes: '' })
    }
  }, [editItem])

  const handleSave = async () => {
    if (!form.title || !form.url) return
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        type: form.type,
        url: form.url,
        thumbnailUrl: form.type === 'image' ? form.url : form.thumbnailUrl,
        category: (form.category || undefined) as EventCategory | undefined,
        artistId: form.artistId || undefined,
        notes: form.notes,
      }
      if (isEditing) {
        await updateMedia(editItem!.id, payload)
      } else {
        await createMedia(payload)
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
      await deleteMedia(editItem.id)
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
            <DialogTitle>{isEditing ? 'Modifica Media' : 'Aggiungi Media'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-muted">Titolo *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Nome del media"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-muted">Tipo *</label>
                <select
                  className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                >
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="image">Immagine</option>
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
                  {artistCats.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <ImageUpload
              label={form.type === 'image' ? 'Immagine *' : 'URL *'}
              value={form.url}
              onChange={(url) => setForm({ ...form, url })}
              placeholder={form.type === 'image' ? 'Carica immagine o inserisci URL' : 'https://youtube.com/... o URL file'}
            />

            {form.type !== 'image' && (
              <ImageUpload
                label="Thumbnail"
                value={form.thumbnailUrl}
                onChange={(url) => setForm({ ...form, thumbnailUrl: url })}
                placeholder="Carica o inserisci URL anteprima"
              />
            )}

            <div>
              <label className="text-xs font-medium text-ink-muted">Artista</label>
              <select
                className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm"
                value={form.artistId}
                onChange={(e) => setForm({ ...form, artistId: e.target.value })}
              >
                <option value="">-- Nessuno --</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
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
              <Button onClick={handleSave} disabled={saving || !form.title || !form.url}>
                {saving ? 'Salvataggio...' : isEditing ? 'Salva' : 'Aggiungi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirmDelete}
        title="Elimina Media"
        message={`Eliminare "${editItem?.title}"? L'azione non può essere annullata.`}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
        loading={deleting}
      />
    </>
  )
}
