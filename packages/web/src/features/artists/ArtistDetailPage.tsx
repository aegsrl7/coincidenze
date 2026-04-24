import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, ExternalLink, Loader2, AlertCircle, Music, Instagram, Facebook } from 'lucide-react'
import ReactPlayer from 'react-player'
import { PublicFooter } from '@/components/PublicFooter'
import { useCategoryMaps } from '@/stores/categoriesStore'
import { api } from '@/lib/api'
import {
  type Artist,
  type Event,
  type MediaItem,
} from '@/types'

function detectSocial(url: string): { label: string; Icon: typeof Instagram } | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (host.includes('instagram.com')) return { label: 'Instagram', Icon: Instagram }
    if (host.includes('facebook.com') || host.includes('fb.com')) return { label: 'Facebook', Icon: Facebook }
    return null
  } catch {
    return null
  }
}

export function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { labels, colors } = useCategoryMaps('artist')

  const goBack = () => {
    // Se la history contiene la pagina di arrivo, usa il back vero (trigger scroll restore)
    // altrimenti fallback su link diretto alla tab artisti
    const ref = document.referrer
    const sameOrigin = ref && ref.startsWith(window.location.origin)
    if (sameOrigin && window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/edizione-1?tab=artisti', { replace: true })
    }
  }

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
          <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-viola hover:underline mt-6">
            <ArrowLeft className="h-4 w-4" />
            Torna all'evento
          </button>
        </div>
      </div>
    )
  }

  const accent = colors[artist.category]

  return (
    <div className="min-h-screen bg-beige">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-16">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-navy transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tutti gli artisti
        </button>

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
              {labels[artist.category]}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy">{artist.name}</h1>
            {artist.website && (() => {
              const social = detectSocial(artist.website)
              const label = social?.label || 'Sito web'
              const Icon = social?.Icon || ExternalLink
              return (
                <a
                  href={artist.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-viola hover:underline mt-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              )
            })()}
          </div>
        </div>

        {/* Bio */}
        {artist.bio && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-navy uppercase tracking-wider mb-2">Bio</h2>
            <div
              className="text-sm text-ink-light leading-relaxed [&_p+p]:mt-3 [&_p+ul]:mt-3 [&_ul+p]:mt-3 [&_a]:text-viola [&_a]:underline [&_strong]:text-navy [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: renderBioMarkdown(artist.bio) }}
            />
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
                    style={{ backgroundColor: colors[event.category] }}
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
      <PublicFooter />
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
      <div className="rounded-lg overflow-hidden bg-black">
        <div className="relative w-full aspect-video">
          <ReactPlayer
            url={item.url}
            controls
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
            config={{ youtube: { playerVars: { modestbranding: 1, rel: 0 } } }}
          />
        </div>
        {item.title && <p className="text-xs text-ink-muted px-3 py-2 bg-white/60">{item.title}</p>}
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

// Mini markdown → HTML per la bio.
// Supporta: **grassetto**, *corsivo*, [link](url), liste con "- ", paragrafi.
// Bold/italic possono attraversare a capo singoli all'interno di un blocco.
function renderBioMarkdown(src: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const safeUrl = (url: string) =>
    /^(https?:|mailto:|tel:|\/)/i.test(url) ? escape(url) : '#'

  // 1) escape su tutto
  // 2) inline patterns sull'intera stringa (bold/italic possono spanare \n singoli)
  // 3) split in blocchi su \n vuote → <p> o <ul>
  const escaped = escape(src.replace(/\r\n/g, '\n'))
  const inlined = escaped
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) =>
      `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`
    )
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g, '$1<em>$2</em>')

  const blocks = inlined.split(/\n{2,}/)
  return blocks.map((block) => {
    const lines = block.split('\n')
    if (lines.length > 0 && lines.every((l) => /^\s*-\s+/.test(l))) {
      const items = lines.map((l) => `<li>${l.replace(/^\s*-\s+/, '')}</li>`).join('')
      return `<ul>${items}</ul>`
    }
    return `<p>${lines.join('<br>')}</p>`
  }).join('')
}
