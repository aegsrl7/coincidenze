import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEditorialStore } from '@/stores/editorialStore'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FASE_LABELS, STATO_LABELS, type EditorialPost } from '@/types'

interface PostFormDialogProps {
  open: boolean
  onClose: () => void
  editPost?: EditorialPost | null
  defaultDate?: string | null
}

export function PostFormDialog({ open, onClose, editPost, defaultDate }: PostFormDialogProps) {
  const { createPost, updatePost, deletePost } = useEditorialStore()
  const isEditing = !!editPost
  const [saving, setSaving] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    titolo: '',
    data: '',
    fase: 1,
    tag: '',
    emoji: '',
    descrizione: '',
    caption_suggerita: '',
    formato: '',
    stato: 'da_fare' as 'da_fare' | 'in_progress' | 'pubblicato',
    artisti_coinvolti: '',
    note: '',
  })

  useEffect(() => {
    setForm({
      titolo: editPost?.titolo || '',
      data: editPost?.data || defaultDate || '',
      fase: editPost?.fase || 1,
      tag: editPost?.tag || '',
      emoji: editPost?.emoji || '',
      descrizione: editPost?.descrizione || '',
      caption_suggerita: editPost?.caption_suggerita || '',
      formato: editPost?.formato || '',
      stato: editPost?.stato || 'da_fare',
      artisti_coinvolti: editPost?.artisti_coinvolti?.join(', ') || '',
      note: editPost?.note || '',
    })
  }, [editPost, defaultDate])

  const handleDelete = async () => {
    if (!editPost) return
    setDeleting(true)
    try {
      await deletePost(editPost.id)
      setShowConfirmDelete(false)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async () => {
    if (!form.titolo || !form.data) return
    setSaving(true)
    try {
      const artisti = form.artisti_coinvolti
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const payload = {
        titolo: form.titolo,
        data: form.data,
        fase: form.fase,
        tag: form.tag,
        emoji: form.emoji,
        descrizione: form.descrizione,
        caption_suggerita: form.caption_suggerita,
        formato: form.formato,
        stato: form.stato,
        artisti_coinvolti: artisti,
        note: form.note,
      }

      if (isEditing) {
        await updatePost(editPost.id, payload)
      } else {
        await createPost(payload)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Modifica Post' : 'Nuovo Post'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Titolo + Data */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-muted">Titolo *</label>
                <Input
                  value={form.titolo}
                  onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                  placeholder="Titolo del post"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Data *</label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
            </div>

            {/* Fase + Tag + Emoji */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-muted">Fase</label>
                <select
                  className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm"
                  value={form.fase}
                  onChange={(e) => setForm({ ...form, fase: Number(e.target.value) })}
                >
                  {Object.entries(FASE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Tag</label>
                <Input
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  placeholder="es. teaser, artista"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Emoji</label>
                <Input
                  className="w-[4ch]"
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                />
              </div>
            </div>

            {/* Stato + Formato */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-muted">Stato</label>
                <select
                  className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm"
                  value={form.stato}
                  onChange={(e) => setForm({ ...form, stato: e.target.value as typeof form.stato })}
                >
                  {Object.entries(STATO_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Formato</label>
                <Input
                  value={form.formato}
                  onChange={(e) => setForm({ ...form, formato: e.target.value })}
                  placeholder="es. Post Instagram quadrato"
                />
              </div>
            </div>

            {/* Descrizione */}
            <div>
              <label className="text-xs font-medium text-ink-muted">Descrizione</label>
              <textarea
                className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm min-h-[60px]"
                value={form.descrizione}
                onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
                placeholder="Descrizione del post"
              />
            </div>

            {/* Caption suggerita */}
            <div>
              <label className="text-xs font-medium text-ink-muted">Caption suggerita</label>
              <textarea
                className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm min-h-[120px]"
                value={form.caption_suggerita}
                onChange={(e) => setForm({ ...form, caption_suggerita: e.target.value })}
                placeholder="Testo della caption per il post"
              />
            </div>

            {/* Artisti coinvolti */}
            <div>
              <label className="text-xs font-medium text-ink-muted">Artisti coinvolti</label>
              <Input
                value={form.artisti_coinvolti}
                onChange={(e) => setForm({ ...form, artisti_coinvolti: e.target.value })}
                placeholder="Nomi separati da virgola"
              />
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-medium text-ink-muted">Note</label>
              <textarea
                className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm min-h-[60px]"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Note interne"
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
              <Button onClick={handleSave} disabled={saving || !form.titolo || !form.data}>
                {saving ? 'Salvataggio...' : isEditing ? 'Salva' : 'Crea Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirmDelete}
        title="Elimina Post"
        message={`Eliminare "${editPost?.titolo}"? L'azione non può essere annullata.`}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
        loading={deleting}
      />
    </>
  )
}
