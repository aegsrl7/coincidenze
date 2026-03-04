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
import { useEventsStore } from '@/stores/eventsStore'
import { useArtistsStore } from '@/stores/artistsStore'
import { CATEGORY_LABELS, type EventCategory } from '@/types'
import { EVENT_DATE } from '@/lib/constants'

interface Props {
  open: boolean
  onClose: () => void
}

export function EventFormDialog({ open, onClose }: Props) {
  const { createEvent } = useEventsStore()
  const { artists } = useArtistsStore()
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: EVENT_DATE,
    startTime: '',
    endTime: '',
    location: '',
    category: '' as EventCategory | '',
    artistId: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.title || !form.category || !form.startTime) return
    setSaving(true)
    try {
      await createEvent({
        ...form,
        category: form.category as EventCategory,
        artistId: form.artistId || undefined,
      } as any)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuovo Evento</DialogTitle>
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
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button onClick={handleSave} disabled={saving || !form.title || !form.category || !form.startTime}>
            {saving ? 'Salvataggio...' : 'Crea Evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
