import { useState, useEffect, useMemo, useRef } from 'react'
import { Bold, Italic, Link2, List } from 'lucide-react'
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
import { useCategoryMaps } from '@/stores/categoriesStore'
import { type EventCategory, type Artist } from '@/types'

function prettifyCategory(slug: string): string {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface BioEditorProps {
  value: string
  onChange: (v: string) => void
}

function BioEditor({ value, onChange }: BioEditorProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  const wrap = (before: string, after: string = before, placeholder = '') => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end) || placeholder
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + before.length + selected.length
      el.setSelectionRange(cursor, cursor)
    })
  }

  const insertLink = () => {
    const el = ref.current
    if (!el) return
    const url = window.prompt('URL del link:')
    if (!url) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end) || 'testo'
    const md = `[${selected}](${url})`
    const next = value.slice(0, start) + md + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => el.focus())
  }

  const insertList = () => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    // trova inizio riga corrente
    const before = value.slice(0, start)
    const lineStart = before.lastIndexOf('\n') + 1
    const next = value.slice(0, lineStart) + '- ' + value.slice(lineStart)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + 2
      el.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <div className="border border-navy/15 rounded-md overflow-hidden bg-white">
      <div className="flex items-center gap-0.5 border-b border-navy/10 bg-beige/40 px-1.5 py-1">
        <ToolbarBtn onClick={() => wrap('**', '**', 'grassetto')} title="Grassetto (Cmd+B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => wrap('*', '*', 'corsivo')} title="Corsivo (Cmd+I)">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={insertLink} title="Inserisci link">
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={insertList} title="Lista puntata">
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <span className="ml-auto text-[10px] text-ink-muted pr-2">
          Markdown: **grassetto** *corsivo* [link](url)
        </span>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault()
            wrap('**', '**', 'grassetto')
          } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
            e.preventDefault()
            wrap('*', '*', 'corsivo')
          }
        }}
        rows={8}
        placeholder="Bio dell'artista. Una o più righe, formattazione minima opzionale."
        className="w-full px-3 py-2 text-sm text-ink resize-y focus:outline-none min-h-[180px] leading-relaxed"
      />
    </div>
  )
}

function ToolbarBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center justify-center h-7 w-7 rounded text-ink-muted hover:bg-navy/5 hover:text-navy"
    >
      {children}
    </button>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  editItem?: Artist | null
}

export function ArtistFormDialog({ open, onClose, editItem }: Props) {
  const { artists, createArtist, updateArtist, deleteArtist } = useArtistsStore()
  const { list: dbCategories } = useCategoryMaps('artist')

  // Unione tra categorie DB (gestite da admin) e quelle già usate da artisti.
  const categorySuggestions = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of dbCategories) {
      map.set(c.slug, c.label)
    }
    for (const a of artists) {
      if (a.category && !map.has(a.category)) {
        map.set(a.category, prettifyCategory(a.category))
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [artists, dbCategories])
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
              <BioEditor
                value={form.bio}
                onChange={(v) => setForm({ ...form, bio: v })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted">Categoria</label>
              <Input
                list="artist-category-suggestions"
                className="mt-1"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}
                placeholder="Scegli o scrivi una categoria (es. fotografia, scultura, nuova...)"
              />
              <datalist id="artist-category-suggestions">
                {categorySuggestions.map(([slug, label]) => (
                  <option key={slug} value={slug}>{label}</option>
                ))}
              </datalist>
              <p className="text-[11px] text-ink-muted mt-1">
                Puoi usare una delle suggerite o digitarne una nuova.
              </p>
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
