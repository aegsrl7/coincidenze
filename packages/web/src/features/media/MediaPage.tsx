import { useEffect, useState } from 'react'
import { Music, Video, Image, Plus, Play, Search, X } from 'lucide-react'
import ReactPlayer from 'react-player'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMediaStore } from '@/stores/mediaStore'
import { useArtistsStore } from '@/stores/artistsStore'
import { useAuthStore } from '@/stores/authStore'
import { CATEGORY_LABELS, CATEGORY_COLORS, type EventCategory } from '@/types'
import { MediaFormDialog } from './MediaFormDialog'

const typeIcons = { audio: Music, video: Video, image: Image }
const typeLabels = { audio: 'Audio', video: 'Video', image: 'Immagine' }

export function MediaPage() {
  const { items, fetchMedia } = useMediaStore()
  const { artists, fetchArtists } = useArtistsStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'audio' | 'video' | 'image' | null>(null)
  const [playingUrl, setPlayingUrl] = useState<string | null>(null)
  const [playingTitle, setPlayingTitle] = useState('')

  useEffect(() => {
    fetchMedia()
    fetchArtists()
  }, [fetchMedia, fetchArtists])

  const filtered = items.filter((item) => {
    const matchesSearch = !search || item.title?.toLowerCase().includes(search.toLowerCase())
    const matchesType = !typeFilter || item.type === typeFilter
    return matchesSearch && matchesType
  })

  const getArtistName = (artistId: string | null | undefined) => {
    if (!artistId) return null
    return artists.find((a) => a.id === artistId)?.name || null
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl font-bold text-navy">Libreria Media</h2>
        {isAuthenticated && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Aggiungi Media
          </Button>
        )}
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Cerca media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          {(['audio', 'video', 'image'] as const).map((type) => {
            const Icon = typeIcons[type]
            return (
              <Button
                key={type}
                variant={typeFilter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              >
                <Icon className="h-3 w-3" />
                {typeLabels[type]}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Griglia media */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-ink-muted">
          <Music className="mx-auto h-12 w-12 text-navy/20" />
          <p className="mt-4">Nessun media trovato</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => {
            const Icon = typeIcons[item.type as keyof typeof typeIcons] || Music
            const artistName = getArtistName(item.artist_id)
            const color = item.category ? CATEGORY_COLORS[item.category as EventCategory] : '#2C3E6B'

            return (
              <Card
                key={item.id}
                className="overflow-hidden transition-shadow hover:shadow-md group"
              >
                {/* Thumbnail / placeholder */}
                <div className="relative h-36 bg-beige-dark flex items-center justify-center">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-10 w-10 text-navy/20" />
                  )}
                  {(item.type === 'audio' || item.type === 'video') && item.url && (
                    <button
                      onClick={() => {
                        setPlayingUrl(item.url)
                        setPlayingTitle(item.title)
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-ink/0 group-hover:bg-ink/20 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-5 w-5 ml-0.5" />
                      </div>
                    </button>
                  )}
                </div>

                <CardContent className="p-3">
                  <h3 className="text-sm font-medium text-navy truncate">{item.title}</h3>
                  {artistName && (
                    <p className="text-xs text-ink-muted mt-0.5">{artistName}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {typeLabels[item.type as keyof typeof typeLabels]}
                    </Badge>
                    {item.category && (
                      <Badge className="text-[10px]" style={{ backgroundColor: color }}>
                        {CATEGORY_LABELS[item.category as EventCategory]}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Player modale */}
      {playingUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60">
          <div className="relative w-full max-w-2xl mx-4 rounded-lg bg-crema p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-semibold text-navy">{playingTitle}</h3>
              <Button variant="ghost" size="icon" onClick={() => setPlayingUrl(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="aspect-video rounded-md overflow-hidden bg-ink">
              <ReactPlayer
                url={playingUrl}
                width="100%"
                height="100%"
                controls
                playing
              />
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && showForm && <MediaFormDialog open={showForm} onClose={() => setShowForm(false)} />}
    </div>
  )
}
