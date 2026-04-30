import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock, MapPin, Pencil, X, Check, Loader2, ChevronRight,
  Image as ImageIcon, Plus, Trash2, GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useEditionDataStore } from '@/stores/editionStore'
import { useCategoryMaps } from '@/stores/categoriesStore'
import { api } from '@/lib/api'
import type { Event, Artist, Edition, GalleryImage } from '@/types'

// Refs stabili per evitare loop di re-render quando il selettore zustand
// restituisce un nuovo `[]`/`{}` ad ogni render (Object.is fallisce).
export const EMPTY_GALLERY: GalleryImage[] = []
export const EMPTY_CONTENT: Record<string, string> = {}

export type TabId = 'programma' | 'artisti' | 'galleria'

export function isAllDay(event: Event): boolean {
  if (!event.start_time || !event.end_time) return false
  const start = parseInt(event.start_time.split(':')[0], 10)
  const end = parseInt(event.end_time.split(':')[0], 10)
  return end - start >= 8
}

export function isPast(eventDate: string): boolean {
  if (!eventDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ev = new Date(eventDate + 'T00:00:00')
  return ev < today
}

export function formatItalianDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 py-4" aria-hidden="true">
      <span className="inline-block h-px w-16 bg-navy/20" />
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-viola/50" />
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-navy/40" />
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-bordeaux/50" />
      <span className="inline-block h-px w-16 bg-navy/20" />
    </div>
  )
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center mb-8">
      <h2 className="font-display text-3xl sm:text-4xl font-semibold text-navy">{title}</h2>
      <p className="text-sm sm:text-base text-ink-muted italic mt-2">{subtitle}</p>
    </div>
  )
}

export function TabNav<T extends string>({
  tabs, active, onChange,
}: { tabs: { id: T; label: string }[]; active: T; onChange: (t: T) => void }) {
  return (
    <nav className="sticky top-0 z-30 bg-beige/90 backdrop-blur-sm border-b border-navy/10">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((t, i) => {
          const isActive = active === t.id
          return (
            <div key={t.id} className="flex items-center">
              {i > 0 && <span className="text-navy/20 mx-1 select-none">·</span>}
              <button
                onClick={() => onChange(t.id)}
                className={`px-3 sm:px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'text-navy' : 'text-ink-muted hover:text-navy'
                }`}
              >
                <span className="relative">
                  {t.label}
                  {isActive && <span className="absolute left-0 right-0 -bottom-1 h-[2px] bg-navy" />}
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </nav>
  )
}

export function ProgrammaTab({ scheduledEvents, allDayEvents }: { scheduledEvents: Event[]; allDayEvents: Event[] }) {
  if (scheduledEvents.length === 0 && allDayEvents.length === 0) {
    return <EmptyState>Il programma di questa edizione non è disponibile.</EmptyState>
  }
  return (
    <div className="space-y-2">
      {scheduledEvents.map((event) => (
        <EventRow key={event.id} event={event} />
      ))}
      {allDayEvents.map((event) => (
        <EventRow key={event.id} event={event} allDay />
      ))}
    </div>
  )
}

function EventRow({ event, allDay }: { event: Event; allDay?: boolean }) {
  const { colors } = useCategoryMaps('artist')
  return (
    <div className="bg-white/60 rounded-lg border border-navy/8 p-3 flex gap-3 items-start">
      <div className="shrink-0 w-16 text-right">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy">
          <Clock className="h-3 w-3 text-ink-muted" />
          {allDay ? 'Tutto il giorno' : event.start_time}
        </span>
      </div>
      <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: colors[event.category] }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-navy">{event.title}</p>
        {event.location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-ink-muted shrink-0" />
            <p className="text-xs text-ink-muted">{event.location}</p>
          </div>
        )}
        {event.description && <p className="text-xs text-ink-light mt-1">{event.description}</p>}
      </div>
    </div>
  )
}

export function ArtistiTab({ artists }: { artists: Artist[] }) {
  const { labels, colors } = useCategoryMaps('artist')
  if (artists.length === 0) {
    return <EmptyState>La lista degli artisti non è disponibile.</EmptyState>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {artists.map((artist) => (
        <Link
          key={artist.id}
          to={`/artisti/${artist.id}`}
          className="bg-white/60 rounded-lg border border-navy/8 p-3 flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          {artist.image_url ? (
            <img src={artist.image_url} alt={artist.name} className="h-12 w-12 rounded-full object-cover shrink-0" loading="lazy" />
          ) : (
            <div
              className="h-12 w-12 rounded-full shrink-0 flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: colors[artist.category] }}
            >
              {artist.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy truncate">{artist.name}</p>
            <p className="text-xs text-ink-muted">{labels[artist.category]}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-muted shrink-0" />
        </Link>
      ))}
    </div>
  )
}

export function GalleriaTab({ edition, isAuthenticated }: { edition: Edition; isAuthenticated: boolean }) {
  const gallery = useEditionDataStore((s) => s.galleries[edition.slug] || EMPTY_GALLERY)
  const setGalleryLocal = useEditionDataStore((s) => s.setGalleryLocal)
  const addImage = useEditionDataStore((s) => s.addImage)
  const deleteImage = useEditionDataStore((s) => s.deleteImage)
  const reorderGallery = useEditionDataStore((s) => s.reorderGallery)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ url: string; isVideo: boolean } | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await api.uploadFile(file)
      await addImage(edition.slug, url)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteImage = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteImage(edition.slug, deleteTarget)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleDragStart = (id: string) => setDragId(id)
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) return
    const fromIndex = gallery.findIndex((g) => g.id === dragId)
    const toIndex = gallery.findIndex((g) => g.id === targetId)
    if (fromIndex === -1 || toIndex === -1) return
    const reordered: GalleryImage[] = [...gallery]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    setGalleryLocal(edition.slug, reordered)
  }
  const handleDragEnd = async () => {
    if (!dragId) return
    setDragId(null)
    await reorderGallery(edition.slug, gallery.map((g) => g.id))
  }

  return (
    <div>
      {isAuthenticated && (
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Aggiungi foto/video
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
        </div>
      )}

      {gallery.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-navy/15 bg-white/30">
          <ImageIcon className="mx-auto h-10 w-10 text-navy/15 mb-3" />
          <p className="text-sm text-ink-muted italic">Nessuna foto in galleria</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {gallery.map((img) => {
            const isVideo = /\.(mp4|mov|webm|avi|mkv)$/i.test(img.image_url)
            return (
              <div
                key={img.id}
                className={`relative group rounded-lg overflow-hidden ${dragId === img.id ? 'opacity-50' : ''}`}
                draggable={isAuthenticated}
                onDragStart={() => handleDragStart(img.id)}
                onDragOver={(e) => handleDragOver(e, img.id)}
                onDragEnd={handleDragEnd}
              >
                {isVideo ? (
                  <video
                    src={img.image_url}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full aspect-[3/4] object-cover rounded-lg shadow-sm transition-shadow duration-200 group-hover:shadow-lg cursor-pointer"
                    onClick={(e) => { e.preventDefault(); setLightbox({ url: img.image_url, isVideo: true }) }}
                  />
                ) : (
                  <img
                    src={img.image_url}
                    alt={img.caption || edition.name}
                    className="w-full aspect-[3/4] object-cover rounded-lg shadow-sm transition-shadow duration-200 group-hover:shadow-lg cursor-pointer"
                    loading="lazy"
                    onClick={() => setLightbox({ url: img.image_url, isVideo: false })}
                  />
                )}
                {img.caption && <p className="mt-1.5 text-xs text-ink-muted px-0.5">{img.caption}</p>}
                {isAuthenticated && (
                  <>
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-ink-muted rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>
                    <button
                      onClick={() => setDeleteTarget(img.id)}
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-ink-muted hover:text-bordeaux rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title="Elimina"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" onClick={() => setLightbox(null)}>
            <X className="h-8 w-8" />
          </button>
          {lightbox.isVideo ? (
            <video src={lightbox.url} controls autoPlay playsInline className="max-h-[90vh] max-w-[90vw] rounded-lg" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={lightbox.url} alt={edition.name} className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Elimina elemento"
        message="Sei sicuro di voler eliminare questo elemento dalla galleria?"
        confirmLabel="Elimina"
        onConfirm={handleDeleteImage}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}

export function EditableIntro({
  slug, value, isAdmin, onSave, align = 'left',
}: { slug: string; value: string; isAdmin: boolean; onSave: (v: string) => Promise<void>; align?: 'left' | 'center' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setDraft(value) }, [slug, value])

  const startEdit = () => {
    setDraft(value)
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      await onSave(draft)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-navy/20 bg-crema p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-viola/40 resize-y"
          autoFocus
        />
        <div className="flex gap-2 justify-center">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Salva
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
            <X className="h-3.5 w-3.5" />
            Annulla
          </Button>
        </div>
      </div>
    )
  }

  const cls = `text-base sm:text-lg text-ink-light leading-relaxed whitespace-pre-line ${align === 'center' ? 'text-center' : ''}`

  return (
    <div className="relative">
      {value ? (
        <p className={cls}>{value}</p>
      ) : (
        <p className="text-ink-muted italic text-center">Il testo introduttivo sarà disponibile a breve.</p>
      )}
      {isAdmin && !editing && (
        <button
          onClick={startEdit}
          className="absolute top-0 right-0 text-ink-muted hover:text-navy p-1"
          title="Modifica intro"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-12 text-center rounded-xl border border-dashed border-navy/15 bg-white/30">
      <p className="text-sm text-ink-muted italic">{children}</p>
    </div>
  )
}
