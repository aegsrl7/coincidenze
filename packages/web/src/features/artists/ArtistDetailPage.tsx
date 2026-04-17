import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, ExternalLink, Loader2, AlertCircle, Music } from 'lucide-react'
import { api } from '@/lib/api'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type Artist,
  type Event,
  type MediaItem,
  type EventCategory,
} from '@/types'

export function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [artist, setArtist] = useState<Artist | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([api.getArtist(id), api.getEvents(), api.getMedia()])
      .then(([a, evs, mds]) => {
        setArtist(a as Artist)
        setEvents((evs as Event[]).filter((e) => Array.isArray(e.artist_ids) && e.artist_ids.includes(id)))
        setMedia((mds as MediaItem[]).filter((m) => m.artist_id === id))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Errore'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy/50" />
      </div>
    )
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center p-4">
        <div className="max-w-sm text-center">
          <AlertCircle className="h-10 w-10 text-bordeaux/70 mx-auto mb-3" />
          <p className="text-navy font-medium">{error || 'Artista non trovato'}</p>
          <Link to="/edizione-1" className="inline-flex items-center gap-1.5 text-sm text-viola hover:underline mt-6">
            <ArrowLeft className="h-4 w-4" />
            Torna all'evento
          </Link>
        </div>
      </div>
    )
  }

  const accent = CATEGORY_COLORS[artist.category as EventCategory] || '#2C3E6B'

  return (
    <div className="min-h-screen bg-beige">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-16">
        <Link
          to="/edizione-1"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-navy transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tutti gli artisti
        </Link>

        {/* Hero artist */}
        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start mb-6">
          {artist.image_url ? (
            <img
              src={artist.image_url}
              alt={artist.name}
              className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl object-cover shadow-md shrink-0"
            />
          ) : (
            <div
              className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl flex items-center justify-center text-white text-5xl font-display font-bold shrink-0"
              style={{ backgroundColor: accent }}
            >
              {artist.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <div
              className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium text-white mb-2"
              style={{ backgroundColor: accent }}
            >
              {CATEGORY_LABELS[artist.category as EventCategory] || artist.category}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy">{artist.name}</h1>
            {artist.website && (
              <a
                href={artist.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-viola hover:underline mt-2"
              >
                Sito web
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Bio */}
        {artist.bio && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-navy uppercase tracking-wider mb-2">Bio</h2>
            <p className="text-sm text-ink-light leading-relaxed whitespace-pre-line">{artist.bio}</p>
          </section>
        )}

        {/* Eventi */}
        {events.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-navy uppercase tracking-wider mb-2">
              Eventi in programma
            </h2>
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="bg-white/60 rounded-lg border border-navy/8 p-3 flex gap-3 items-start">
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy">
                      <Clock className="h-3 w-3 text-ink-muted" />
                      {event.start_time || '—'}
                    </span>
                  </div>
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[event.category as EventCategory] || '#2C3E6B' }}
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
            </div>
          </section>
        )}

        {/* Media */}
        {media.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-navy uppercase tracking-wider mb-2">Media</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {media.map((m) => (
                <MediaCard key={m.id} item={m} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function MediaCard({ item }: { item: MediaItem }) {
  if (item.type === 'image') {
    return (
      <img
        src={item.url}
        alt={item.title}
        className="w-full aspect-video object-cover rounded-lg bg-navy/5"
        loading="lazy"
      />
    )
  }
  if (item.type === 'video') {
    return (
      <div className="rounded-lg overflow-hidden bg-navy/5">
        <video src={item.url} controls playsInline className="w-full aspect-video" preload="metadata" />
        {item.title && <p className="text-xs text-ink-muted px-3 py-2">{item.title}</p>}
      </div>
    )
  }
  // audio
  return (
    <div className="bg-white/60 rounded-lg border border-navy/8 p-3 flex items-center gap-3">
      <Music className="h-5 w-5 text-navy/60 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-navy truncate">{item.title}</p>
        <audio src={item.url} controls className="w-full mt-1.5" preload="metadata" />
      </div>
    </div>
  )
}
