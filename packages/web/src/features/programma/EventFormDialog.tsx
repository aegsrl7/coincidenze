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
import { useEventsStore } from '@/stores/eventsStore'
import { useArtistsStore } from '@/stores/artistsStore'
import { useCategoryMaps } from '@/stores/categoriesStore'
import { type EventCategory, type Event } from '@/types'
import { EVENT_DATE } from '@/lib/constants'

interface Props {
  open: boolean
  onClose: () => void
  event?: Event
}

export function EventFormDialog({ open, onClose, event }: Props) {
  const { createEvent, updateEvent, deleteEvent } = useEventsStore()
  const { artists } = useArtistsStore()
  const { list: artistCats } = useCategoryMaps('artist')
  const isEditing = !!event
  const [saving, setSaving] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: EVENT_DATE,
    startTime: '',
    endTime: '',
    location: '',
    category: '' as EventCategory | '',
    artistIds: [] as string[],
    notes: '',
  })

  useEffect(() => {
    setForm({
      title: event?.title || '',
      description: event?.description || '',
      date: event?.date || EVENT_DATE,
      startTime: event?.start_time || '',
      endTime: event?.end_time || '',
      location: event?.location || '',
      category: (event?.category || '') as EventCategory | '',
      artistIds: event?.artist_ids || [],
      notes: event?.notes || '',
    })
  }, [event])

  const handleDelete = async () => {
    if (!event) return
    setDeleting(true)
    try {
      await deleteEvent(event.id)
      setShowConfirmDelete(false)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  const toggleArtist = (id: string) => {
    setForm((prev) => ({
      ...prev,
      artistIds: prev.artistIds.includes(id)
        ? prev.artistIds.filter((a) => a !== id)
        : [...prev.artistIds, id],
    }))
  }

  const handleSave = async () => {
    if (!form.title || !form.category || !form.startTime) return
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        date: form.date,
        start_time: form.startTime,
        end_time: form.endTime,
        location: form.location,
        category: form.category as EventCategory,
        artist_ids: form.artistIds,
        notes: form.notes,
      }
      if (isEditing) {
        await updateEvent(event.id, payload)
      } else {
        await createEvent(payload)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Modifica Evento' : 'Nuovo Evento'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-muted">Titolo *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Nome dell'evento"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted">Categoria *</label>
              <select
                className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}
              >
                <option value="">-- Seleziona --</option>
                {artistCats.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-muted">Ora Inizio *</label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Ora Fine</label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted">Luogo</label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="es. Sala Principale"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted">
                Artisti {form.artistIds.length > 0 && `(${form.artistIds.length})`}
              </label>
              <div className="mt-1 max-h-36 overflow-y-auto rounded-md border border-navy/20 bg-crema">
                {artists.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-ink-muted">Nessun artista disponibile</p>
                ) : (
                  artists.map((a) => (
                    <label
                      key={a.id}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-navy/5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.artistIds.includes(a.id)}
                        onChange={() => toggleArtist(a.id)}
                        className="rounded border-navy/30 text-violet focus:ring-violet"
                      />
                      <span className="text-sm">{a.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted">Descrizione</label>
              <textarea
                className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm min-h-[60px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrizione opzionale"
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
              <Button onClick={handleSave} disabled={saving || !form.title || !form.category || !form.startTime}>
                {saving ? 'Salvataggio...' : isEditing ? 'Salva' : 'Crea Evento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirmDelete}
        title="Elimina Evento"
        message={`Eliminare "${event?.title}"? L'azione non può essere annullata.`}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
        loading={deleting}
      />
    </>
  )
}
