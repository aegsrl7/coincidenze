import { useEffect, useRef, useState, useCallback } from 'react'
import { Plus, Trash2, Pencil, X, Check, Image, Loader2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEdizione0Store } from '@/stores/edizione0Store'
import { useAuthStore } from '@/stores/authStore'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { api } from '@/lib/api'
import { useCategoryMaps } from '@/stores/categoriesStore'
import {
  type EventCategory,
} from '@/types'

// Artisti dell'Edizione 0
const ED0_ARTISTS: { name: string; category: string; categoryKey: EventCategory }[] = [
  { name: 'Michele Marziani', category: 'Scrittura', categoryKey: 'scrittura' },
  { name: 'Mauro Curti', category: 'Fotografia', categoryKey: 'fotografia' },
  { name: 'Luca Fumero', category: 'Fotografia', categoryKey: 'fotografia' },
  { name: 'Guido Harari', category: 'Fotografia', categoryKey: 'fotografia' },
  { name: 'Franco Fontana', category: 'Fotografia', categoryKey: 'fotografia' },
  { name: 'Crux', category: 'Scultura', categoryKey: 'scultura' },
  { name: 'Cristina Saimandi', category: 'Scultura', categoryKey: 'scultura' },
  { name: 'Marco Fiaschi', category: 'Scultura/Pittura', categoryKey: 'scultura' },
  { name: 'Gianni Del Bue', category: 'Pittura', categoryKey: 'pittura' },
  { name: 'Francesco Tabusso', category: 'Pittura', categoryKey: 'pittura' },
  { name: 'Marco Marsam', category: 'Cucina', categoryKey: 'cucina' },
  { name: 'Auto d\'Epoca', category: 'Veicoli', categoryKey: 'auto-epoca' },
]

export function Edizione0Page() {
  const { gallery, content, fetchGallery, fetchContent, addImage, deleteImage, reorderGallery, setGalleryLocal, updateContent } = useEdizione0Store()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { colors } = useCategoryMaps('artist')

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
    fetchGallery()
    fetchContent()
  }, [fetchGallery, fetchContent])

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
    } catch (err) {
      console.error('Failed to save intro:', err)
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
    } catch (err) {
      console.error('Upload failed:', err)
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
    } catch (err) {
      console.error('Delete failed:', err)
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
      {/* ── 1. Hero ── */}
      <div className="text-center py-12 sm:py-16">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
          COINCIDENZE
        </h1>
        <p className="text-lg text-viola italic mt-2">Edizione 0</p>
        <p className="text-sm text-ink-muted mt-3">
          25 aprile 2025 &middot; Marsam Locanda, Bene Vagienna
        </p>
      </div>

      {/* ── 2. Intro ── */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-display text-2xl font-semibold text-navy">
            L'edizione che ha dato inizio a tutto
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
              <Button
                size="sm"
                onClick={handleSaveIntro}
                disabled={savingIntro}
              >
                {savingIntro ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Salva
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingIntro(false)}
                disabled={savingIntro}
              >
                <X className="h-3.5 w-3.5" />
                Annulla
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-ink-light leading-relaxed whitespace-pre-line">
            {content['intro'] || (
              <span className="italic text-ink-muted">
                Il testo introduttivo sarà disponibile a breve.
              </span>
            )}
          </div>
        )}
      </section>

      {/* ── 3. Stats bar ── */}
      <section className="mb-12">
        <div className="bg-navy/5 rounded-xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-navy font-medium">
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold">8</span>
              Artisti
            </span>
            <span className="hidden sm:inline text-navy/30">|</span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold">6</span>
              Categorie
            </span>
            <span className="hidden sm:inline text-navy/30">|</span>
            <span className="text-center text-xs text-ink-muted leading-snug">
              Scrittura &middot; Fotografia &middot; Pittura &middot; Scultura &middot; Cucina &middot; Veicoli d'Epoca
            </span>
            <span className="hidden sm:inline text-navy/30">|</span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold">1</span>
              Giornata
            </span>
          </div>
        </div>
      </section>

      {/* ── 4. Artisti partecipanti ── */}
      <section className="mb-12">
        <h2 className="font-display text-2xl font-semibold text-navy mb-6">
          Gli artisti dell'Edizione 0
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {ED0_ARTISTS.map((artist) => {
            const color = colors[artist.categoryKey] || '#2C3E6B'
            return (
              <div
                key={artist.name}
                className="bg-white/60 rounded-lg border border-navy/8 p-3 transition-shadow hover:shadow-md"
              >
                <div
                  className="w-8 h-1 rounded-full mb-2"
                  style={{ backgroundColor: color }}
                />
                <p className="text-sm font-medium text-navy leading-tight">
                  {artist.name}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {artist.category}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 5. Galleria fotografica ── */}
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

        {/* Hidden file input */}
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
              Foto e video dell'evento saranno caricati presto
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
                      alt={img.caption || 'Edizione 0'}
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

      {/* ── Lightbox ── */}
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
              alt="Edizione 0"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* ── Confirm delete dialog ── */}
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
