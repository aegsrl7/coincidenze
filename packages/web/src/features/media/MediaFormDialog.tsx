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
import { useMediaStore } from '@/stores/mediaStore'
import { useArtistsStore } from '@/stores/artistsStore'
import { CATEGORY_LABELS, type EventCategory } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

export function MediaFormDialog({ open, onClose }: Props) {
  const { createMedia } = useMediaStore()
  const { artists } = useArtistsStore()
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

  const handleSave = async () => {
    if (!form.title || !form.url) return
    setSaving(true)
    try {
      await createMedia({
        ...form,
        category: (form.category || undefined) as EventCategory | undefined,
        artistId: form.artistId || undefined,
      } as any)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi Media</DialogTitle>
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
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-muted">URL *</label>
            <Input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://youtube.com/... o URL file"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-muted">URL Thumbnail</label>
            <Input
              value={form.thumbnailUrl}
              onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
              placeholder="URL immagine anteprima"
            />
          </div>

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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button onClick={handleSave} disabled={saving || !form.title || !form.url}>
            {saving ? 'Salvataggio...' : 'Aggiungi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
