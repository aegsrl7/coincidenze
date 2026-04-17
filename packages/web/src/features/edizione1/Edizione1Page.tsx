import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigationType, useSearchParams } from 'react-router-dom'
import {
  Plus, Trash2, Pencil, X, Check, Image as ImageIcon, Loader2, GripVertical,
  Clock, MapPin, Ticket, Calendar, Utensils, Info, ChevronRight, Users,
} from 'lucide-react'
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
  type MenuItem,
} from '@/types'

type TabId = 'programma' | 'artisti' | 'menu' | 'info'

const TABS: { id: TabId; label: string; icon: typeof Calendar }[] = [
  { id: 'programma', label: 'Programma', icon: Calendar },
  { id: 'artisti', label: 'Artisti', icon: Users },
  { id: 'menu', label: 'Menù', icon: Utensils },
  { id: 'info', label: 'Info', icon: Info },
]

const INFO_SECTIONS = [
  { key: 'info_address', label: 'Dove siamo' },
  { key: 'info_how_to_get_there', label: 'Come arrivare' },
  { key: 'info_schedule', label: 'Orari evento' },
  { key: 'info_contacts', label: 'Contatti' },
] as const

function isAllDay(event: Event): boolean {
  if (!event.start_time || !event.end_time) return false
  const start = parseInt(event.start_time.split(':')[0], 10)
  const end = parseInt(event.end_time.split(':')[0], 10)
  return end - start >= 8
}

function categoryColor(cat: EventCategory): string {
  return CATEGORY_COLORS[cat] || '#2C3E6B'
}

function categoryLabel(cat: EventCategory): string {
  return CATEGORY_LABELS[cat] || cat
}

export function Edizione1Page() {
  const {
    gallery, content,
    fetchGallery, fetchContent,
    addImage, deleteImage, reorderGallery, setGalleryLocal, updateContent,
  } = useEdizione1Store()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const checkAuth = useAuthStore((s) => s.checkAuth)

  const [searchParams, setSearchParams] = useSearchParams()
  const navType = useNavigationType()

  const tabFromUrl = searchParams.get('tab')
  const activeTab: TabId = (TABS.find((t) => t.id === tabFromUrl)?.id as TabId) || 'programma'
  const setActiveTab = useCallback(
    (t: TabId) => {
      setSearchParams({ tab: t }, { replace: true })
    },
    [setSearchParams]
  )

  const [events, setEvents] = useState<Event[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [menu, setMenu] = useState<MenuItem[]>([])

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
    api.getMenu().then((m) => setMenu(m as MenuItem[]))
  }, [checkAuth, fetchGallery, fetchContent])

  // Restore scroll on back-nav, reset on tab click / fresh navigation
  useEffect(() => {
    const key = `edizione1:scroll:${activeTab}`
    if (navType === 'POP') {
      const saved = Number(sessionStorage.getItem(key) || 0)
      if (saved > 0) {
        // Retry while content loads (events/artists fetch async)
        const attempts = [60, 180, 360, 600, 1000]
        attempts.forEach((ms) =>
          window.setTimeout(() => {
            if (Math.abs(window.scrollY - saved) > 4) window.scrollTo(0, saved)
          }, ms)
        )
      }
    } else {
      window.scrollTo(0, 0)
    }
  }, [activeTab, navType])

  useEffect(() => {
    const key = `edizione1:scroll:${activeTab}`
    let t: number | undefined
    const save = () => {
      if (t) window.clearTimeout(t)
      t = window.setTimeout(() => {
        sessionStorage.setItem(key, String(window.scrollY))
      }, 80)
    }
    window.addEventListener('scroll', save, { passive: true })
    return () => {
      window.removeEventListener('scroll', save)
      sessionStorage.setItem(key, String(window.scrollY))
    }
  }, [activeTab])

  const scheduledEvents = events.filter((e) => !isAllDay(e)).sort((a, b) => a.start_time.localeCompare(b.start_time))
  const allDayEvents = events.filter(isAllDay)
  const uniqueCategories = new Set(artists.map((a) => a.category))

  const handleSaveIntro = async () => {
    setSavingIntro(true)
    try {
      await updateContent('intro', introDraft)
      setEditingIntro(false)
    } finally {
      setSavingIntro(false)
    }
  }

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

  const handleDragStart = useCallback((id: string) => setDragId(id), [])
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
    await reorderGallery(gallery.map((g) => g.id))
  }, [dragId, gallery, reorderGallery])

  return (
    <div className="max-w-[900px] mx-auto pb-16">
      {/* Hero */}
      <div className="text-center py-12 sm:py-16 px-4">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">COINCIDENZE</h1>
        <p className="text-lg text-viola italic mt-2">Edizione 1</p>
        <p className="text-sm text-ink-muted mt-3">25 aprile 2026 &middot; Marsam Locanda, Bene Vagienna</p>
        <p className="text-xs text-ink-muted mt-1 italic">raffinate casualit&agrave;, occhi attenti</p>

        <Link
          to="/accrediti"
          className="inline-flex items-center gap-2 mt-6 bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors shadow-sm"
        >
          <Ticket className="h-4 w-4" />
          Accreditati gratuitamente
        </Link>
        <p className="text-xs text-ink-muted mt-2">Ingresso gratuito con accredito online</p>
      </div>

      {/* Intro */}
      <section className="mb-8 px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-display text-xl font-semibold text-navy">Una corte delle meraviglie</h2>
          {isAuthenticated && !editingIntro && (
            <button
              onClick={() => { setIntroDraft(content['intro'] || ''); setEditingIntro(true) }}
              className="text-ink-muted hover:text-navy p-1"
              title="Modifica"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {editingIntro ? (
          <div className="space-y-2">
            <textarea
              value={introDraft}
              onChange={(e) => setIntroDraft(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-navy/20 bg-crema p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-viola/40 resize-y"
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
              <span className="italic text-ink-muted">Il testo introduttivo sarà disponibile a breve.</span>
            )}
          </div>
        )}
      </section>

      {/* Stats bar */}
      {artists.length > 0 && (
        <section className="mb-6 px-4 sm:px-6">
          <div className="bg-navy/5 rounded-xl px-5 py-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-navy font-medium">
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-bold">{artists.length}</span>
              Protagonisti
            </span>
            <span className="text-navy/30 hidden sm:inline">|</span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-bold">{events.length}</span>
              Eventi
            </span>
            <span className="text-navy/30 hidden sm:inline">|</span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-bold">1</span>
              Giornata
            </span>
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-beige/95 backdrop-blur-sm border-b border-navy/10 mb-5">
        <div className="max-w-[900px] mx-auto px-2 sm:px-4 flex overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active ? 'border-navy text-navy' : 'border-transparent text-ink-muted hover:text-navy'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 sm:px-6">
        {activeTab === 'programma' && (
          <ProgrammaTab
            scheduledEvents={scheduledEvents}
            allDayEvents={allDayEvents}
          />
        )}
        {activeTab === 'artisti' && <ArtistiTab artists={artists} />}
        {activeTab === 'menu' && <MenuTab items={menu} isAdmin={isAuthenticated} />}
        {activeTab === 'info' && <InfoTab content={content} isAdmin={isAuthenticated} onSave={updateContent} />}
      </div>

      {/* Galleria */}
      <section className="mt-12 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-navy">Galleria</h2>
          {isAuthenticated && (
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Aggiungi
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
          <div className="py-12 text-center rounded-xl border border-dashed border-navy/15 bg-white/30">
            <ImageIcon className="mx-auto h-10 w-10 text-navy/15 mb-3" />
            <p className="text-sm text-ink-muted italic">Foto e video dell'evento saranno caricati dopo il 25 aprile</p>
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
                      className="w-full aspect-[3/4] object-cover rounded-lg shadow-sm cursor-pointer"
                      onClick={(e) => { e.preventDefault(); setLightbox({ url: img.image_url, isVideo: true }) }}
                    />
                  ) : (
                    <img
                      src={img.image_url}
                      alt="Edizione 1"
                      className="w-full aspect-[3/4] object-cover rounded-lg shadow-sm cursor-pointer"
                      loading="lazy"
                      onClick={() => setLightbox({ url: img.image_url, isVideo: false })}
                    />
                  )}
                  {isAuthenticated && (
                    <>
                      <div className="absolute top-2 left-2 bg-white/90 text-ink-muted rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-3.5 w-3.5" />
                      </div>
                      <button
                        onClick={() => setDeleteTarget(img.id)}
                        className="absolute top-2 right-2 bg-white/90 text-ink-muted hover:text-bordeaux rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightbox(null)}>
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

// ---- Tabs ----

function ProgrammaTab({
  scheduledEvents,
  allDayEvents,
}: {
  scheduledEvents: Event[]
  allDayEvents: Event[]
}) {
  if (scheduledEvents.length === 0 && allDayEvents.length === 0) {
    return <EmptyState>Il programma completo sarà presto disponibile.</EmptyState>
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
  return (
    <div className="bg-white/60 rounded-lg border border-navy/8 p-3 flex gap-3 items-start">
      <div className="shrink-0 w-16 text-right">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy">
          <Clock className="h-3 w-3 text-ink-muted" />
          {allDay ? 'Tutto il giorno' : event.start_time}
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
  )
}

function ArtistiTab({ artists }: { artists: Artist[] }) {
  if (artists.length === 0) {
    return <EmptyState>La lista degli artisti sarà presto disponibile.</EmptyState>
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
            <img
              src={artist.image_url}
              alt={artist.name}
              className="h-12 w-12 rounded-full object-cover shrink-0"
              loading="lazy"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-full shrink-0 flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: categoryColor(artist.category) }}
            >
              {artist.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy truncate">{artist.name}</p>
            <p className="text-xs text-ink-muted">{categoryLabel(artist.category)}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-muted shrink-0" />
        </Link>
      ))}
    </div>
  )
}

function MenuTab({ items, isAdmin }: { items: MenuItem[]; isAdmin: boolean }) {
  if (items.length === 0) {
    return (
      <EmptyState>
        Il menu sarà presto disponibile.
        {isAdmin && (
          <>
            <br />
            <Link to="/admin/menu" className="text-viola underline text-xs">Aggiungi voci →</Link>
          </>
        )}
      </EmptyState>
    )
  }

  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.category || 'Altro'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([cat, list]) => (
        <section key={cat}>
          <h3 className="font-display text-lg font-semibold text-navy mb-2">{cat}</h3>
          <div className="space-y-1.5">
            {list.map((item) => (
              <div key={item.id} className="bg-white/60 rounded-lg border border-navy/8 p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-ink-light mt-0.5">{item.description}</p>
                  )}
                </div>
                {item.price && (
                  <p className="text-sm font-medium text-navy shrink-0">{item.price}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
      {isAdmin && (
        <Link to="/admin/menu" className="inline-flex items-center text-xs text-viola underline">
          Gestisci menu →
        </Link>
      )}
    </div>
  )
}

function InfoTab({
  content,
  isAdmin,
  onSave,
}: {
  content: Record<string, string>
  isAdmin: boolean
  onSave: (key: string, value: string) => Promise<void>
}) {
  return (
    <div className="space-y-5">
      {INFO_SECTIONS.map((section) => (
        <EditableSection
          key={section.key}
          label={section.label}
          value={content[section.key] || ''}
          isAdmin={isAdmin}
          onSave={(v) => onSave(section.key, v)}
          placeholder={`Aggiungi ${section.label.toLowerCase()}...`}
        />
      ))}
      <div className="aspect-video rounded-lg overflow-hidden border border-navy/10 bg-navy/5">
        <iframe
          src="https://www.google.com/maps?q=Marsam+Locanda+Bene+Vagienna&output=embed"
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Marsam Locanda, Bene Vagienna"
        />
      </div>
    </div>
  )
}

function EditableSection({
  label,
  value,
  isAdmin,
  onSave,
  placeholder,
}: {
  label: string
  value: string
  isAdmin: boolean
  onSave: (v: string) => Promise<void>
  placeholder: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

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

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-xs font-semibold text-navy uppercase tracking-wider">{label}</h3>
        {isAdmin && !editing && (
          <button onClick={startEdit} className="text-ink-muted hover:text-navy p-0.5" title="Modifica">
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-navy/20 bg-crema p-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-viola/40 resize-y"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Salva
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              Annulla
            </Button>
          </div>
        </div>
      ) : value ? (
        <p className="text-sm text-ink-light leading-relaxed whitespace-pre-line">{value}</p>
      ) : (
        <p className="text-sm text-ink-muted italic">{isAdmin ? placeholder : '—'}</p>
      )}
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-12 text-center rounded-xl border border-dashed border-navy/15 bg-white/30">
      <p className="text-sm text-ink-muted italic">{children}</p>
    </div>
  )
}
