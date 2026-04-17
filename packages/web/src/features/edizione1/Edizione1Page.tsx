import { useEffect, useRef, useState, useCallback } from 'react'
import { Plus, Trash2, Pencil, X, Check, Image, Loader2, GripVertical, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEdizione1Store } from '@/stores/edizione1Store'
import { useAuthStore } from '@/stores/authStore'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { api } from '@/lib/api'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type Event,
  type Artist,
  type EventCategory,
} from '@/types'

function isAllDay(event: Event): boolean {
  if (!event.start_time || !event.end_time) return false
  const start = parseInt(event.start_time.split(':')[0], 10)
  const end = parseInt(event.end_time.split(':')[0], 10)
  return (end - start) >= 8
}

function categoryColor(cat: EventCategory): string {
  return CATEGORY_COLORS[cat] || '#2C3E6B'
}

function categoryLabel(cat: EventCategory): string {
  return CATEGORY_LABELS[cat] || cat
}

export function Edizione1Page() {
  const { gallery, content, fetchGallery, fetchContent, addImage, deleteImage, reorderGallery, setGalleryLocal, updateContent } = useEdizione1Store()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const checkAuth = useAuthStore((s) => s.checkAuth)

  const [events, setEvents] = useState<Event[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [editingIntro, setEditingIntro] = useState(false)
  const [introDraft, setIntroDraft] = useState('')
  const [savingIntro, setSavingIntro] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ url: string; isVideo: boolean } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkAuth()
    fetchGallery()
    fetchContent()
    api.getEvents().then(setEvents)
    api.getArtists().then(setArtists)
  }, [checkAuth, fetchGallery, fetchContent])

  // Split events into scheduled and all-day
  const scheduledEvents = events
    .filter((e) => !isAllDay(e))
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const allDayEvents = events.filter((e) => isAllDay(e))

  // Unique categories from artists
  const uniqueCategories = new Set(artists.map((a) => a.category))

  // -- Intro editing --
  const handleEditIntro = () => {
    setIntroDraft(content['intro'] || '')
    setEditingIntro(true)
  }

  const handleSaveIntro = async () => {
    setSavingIntro(true)
    try {
      await updateContent('intro', introDraft)
      setEditingIntro(false)
    } finally {
      setSavingIntro(false)
    }
  }

  // -- Upload --
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await api.uploadFile(file)
      await addImage(url)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // -- Delete image --
  const handleDeleteImage = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteImage(deleteTarget)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleDragStart = useCallback((id: string) => {
    setDragId(id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) return
    const fromIndex = gallery.findIndex((g) => g.id === dragId)
    const toIndex = gallery.findIndex((g) => g.id === targetId)
    if (fromIndex === -1 || toIndex === -1) return
    const reordered = [...gallery]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    setGalleryLocal(reordered)
  }, [dragId, gallery, setGalleryLocal])

  const handleDragEnd = useCallback(async () => {
    if (!dragId) return
    setDragId(null)
    const order = gallery.map((g) => g.id)
    await reorderGallery(order)
  }, [dragId, gallery, reorderGallery])

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 pb-16">
      {/* 1. Hero */}
      <div className="text-center py-12 sm:py-16">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
          COINCIDENZE
        </h1>
        <p className="text-lg text-viola italic mt-2">Edizione 1</p>
        <p className="text-sm text-ink-muted mt-3">
          25 aprile 2026 &middot; Marsam Locanda, Bene Vagienna
        </p>
        <p className="text-xs text-ink-muted mt-1 italic">
          raffinate casualit&agrave;, occhi attenti
        </p>
      </div>

      {/* 2. Intro */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-display text-2xl font-semibold text-navy">
            Una corte delle meraviglie
          </h2>
          {isAuthenticated && !editingIntro && (
            <button
              onClick={handleEditIntro}
              className="text-ink-muted hover:text-navy transition-colors p-1 rounded"
              title="Modifica"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>

        {editingIntro ? (
          <div className="space-y-3">
            <textarea
              value={introDraft}
              onChange={(e) => setIntroDraft(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-navy/20 bg-crema p-3 text-sm text-ink leading-relaxed focus:outline-none focus:ring-2 focus:ring-viola/40 resize-y"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveIntro} disabled={savingIntro}>
                {savingIntro ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Salva
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingIntro(false)} disabled={savingIntro}>
                <X className="h-3.5 w-3.5" />
                Annulla
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-ink-light leading-relaxed whitespace-pre-line">
            {content['intro'] || (
              <span className="italic text-ink-muted">
                Il testo introduttivo sar&agrave; disponibile a breve.
              </span>
            )}
          </div>
        )}
      </section>

      {/* 3. Stats bar */}
      {artists.length > 0 && (
        <section className="mb-12">
          <div className="bg-navy/5 rounded-xl px-6 py-5">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-navy font-medium">
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold">{artists.length}</span>
                Protagonisti
              </span>
              <span className="hidden sm:inline text-navy/30">|</span>
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold">{uniqueCategories.size}</span>
                Categorie
              </span>
              <span className="hidden sm:inline text-navy/30">|</span>
              <span className="text-center text-xs text-ink-muted leading-snug">
                {Array.from(uniqueCategories).map((c) => categoryLabel(c)).join(', ')}
              </span>
              <span className="hidden sm:inline text-navy/30">|</span>
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold">1</span>
                Giornata
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 4. Programma */}
      {events.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-2xl font-semibold text-navy mb-6">
            Programma
          </h2>
          <div className="space-y-2">
            {scheduledEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white/60 rounded-lg border border-navy/8 p-4 flex gap-4 items-start transition-shadow hover:shadow-md"
              >
                <div className="shrink-0 w-20 text-right">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-navy">
                    <Clock className="h-3.5 w-3.5 text-ink-muted" />
                    {event.start_time}
                  </span>
                </div>
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: categoryColor(event.category) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy">{event.title}</p>
                  {event.location && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-ink-muted shrink-0" />
                      <p className="text-xs text-ink-muted">{event.location}</p>
                    </div>
                  )}
                  {event.description && (
                    <p className="text-xs text-ink-light mt-1">{event.description}</p>
                  )}
                </div>
              </div>
            ))}

            {allDayEvents.length > 0 && (
              <>
                {allDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white/60 rounded-lg border border-navy/8 p-4 flex gap-4 items-start transition-shadow hover:shadow-md"
                  >
                    <div className="shrink-0 w-20 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted">
                        <Clock className="h-3.5 w-3.5" />
                        Tutto il giorno
                      </span>
                    </div>
                    <div
                      className="w-1 self-stretch rounded-full shrink-0"
                      style={{ backgroundColor: categoryColor(event.category) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy">{event.title}</p>
                      {event.location && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-ink-muted shrink-0" />
                          <p className="text-xs text-ink-muted">{event.location}</p>
                        </div>
                      )}
                      {event.description && (
                        <p className="text-xs text-ink-light mt-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>
      )}

      {/* 5. Artisti partecipanti */}
      {artists.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-2xl font-semibold text-navy mb-6">
            I protagonisti dell'Edizione 1
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="bg-white/60 rounded-lg border border-navy/8 p-3 transition-shadow hover:shadow-md"
              >
                <div
                  className="w-8 h-1 rounded-full mb-2"
                  style={{ backgroundColor: categoryColor(artist.category) }}
                />
                <p className="text-sm font-medium text-navy leading-tight">
                  {artist.name}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {categoryLabel(artist.category)}
                </p>
                {artist.bio && artist.bio.length <= 80 && (
                  <p className="text-[11px] text-ink-light mt-0.5 italic">
                    {artist.bio}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Galleria */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-navy">
            Galleria
          </h2>
          {isAuthenticated && (
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Aggiungi foto/video
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {gallery.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-navy/15 bg-white/30">
            <Image className="mx-auto h-10 w-10 text-navy/15 mb-3" />
            <p className="text-sm text-ink-muted italic">
              Foto e video dell'evento saranno caricati dopo il 25 aprile
            </p>
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
                      alt="Edizione 1"
                      className="w-full aspect-[3/4] object-cover rounded-lg shadow-sm transition-shadow duration-200 group-hover:shadow-lg cursor-pointer"
                      loading="lazy"
                      onClick={() => setLightbox({ url: img.image_url, isVideo: false })}
                    />
                  )}
                  {img.caption && (
                    <p className="mt-1.5 text-xs text-ink-muted px-0.5">
                      {img.caption}
                    </p>
                  )}
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
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="h-8 w-8" />
          </button>
          {lightbox.isVideo ? (
            <video
              src={lightbox.url}
              controls
              autoPlay
              playsInline
              className="max-h-[90vh] max-w-[90vw] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightbox.url}
              alt="Edizione 1"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* Confirm delete */}
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
