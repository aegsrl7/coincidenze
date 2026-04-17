import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus, Calendar, User, Store, Music } from 'lucide-react'
import { CATEGORY_LABELS, CATEGORY_COLORS, type EventCategory } from '@/types'
import type { Event, Artist, Exhibitor, MediaItem } from '@/types'

export type PickerEntityType = 'event' | 'artist' | 'exhibitor' | 'media'

export interface EntityPickerResult {
  entityId: string
  label: string
  data: Record<string, unknown>
}

interface EntityPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: PickerEntityType
  events: Event[]
  artists: Artist[]
  exhibitors: Exhibitor[]
  mediaItems: MediaItem[]
  onSelect: (result: EntityPickerResult) => void
  onCreateEmpty: () => void
}

const TYPE_CONFIG: Record<PickerEntityType, { title: string; icon: typeof Calendar; emptyLabel: string }> = {
  event: { title: 'Scegli Evento', icon: Calendar, emptyLabel: 'Nuovo Evento' },
  artist: { title: 'Scegli Artista', icon: User, emptyLabel: 'Nuovo Artista' },
  exhibitor: { title: 'Scegli Espositore', icon: Store, emptyLabel: 'Nuovo Espositore' },
  media: { title: 'Scegli Media', icon: Music, emptyLabel: 'Nuovo Media' },
}

function mapEventToNodeData(event: Event): EntityPickerResult {
  return {
    entityId: event.id,
    label: event.title,
    data: {
      category: event.category,
      startTime: event.start_time,
      endTime: event.end_time,
      location: event.location,
    },
  }
}

function mapArtistToNodeData(artist: Artist): EntityPickerResult {
  return {
    entityId: artist.id,
    label: artist.name,
    data: {
      category: artist.category,
      bio: artist.bio,
      imageUrl: artist.image_url,
    },
  }
}

function mapExhibitorToNodeData(exhibitor: Exhibitor): EntityPickerResult {
  return {
    entityId: exhibitor.id,
    label: exhibitor.name,
    data: {
      category: exhibitor.category,
      description: exhibitor.description,
    },
  }
}

function mapMediaToNodeData(item: MediaItem): EntityPickerResult {
  return {
    entityId: item.id,
    label: item.title,
    data: {
      mediaType: item.type,
      url: item.url,
      thumbnailUrl: item.thumbnail_url || (item.type === 'image' ? item.url : ''),
    },
  }
}

function CategoryBadge({ category }: { category?: EventCategory }) {
  if (!category) return null
  const label = CATEGORY_LABELS[category]
  const color = CATEGORY_COLORS[category]
  if (!label) return null
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  )
}

export function EntityPickerDialog({
  open,
  onOpenChange,
  entityType,
  events,
  artists,
  exhibitors,
  mediaItems,
  onSelect,
  onCreateEmpty,
}: EntityPickerDialogProps) {
  const [search, setSearch] = useState('')
  const config = TYPE_CONFIG[entityType]
  const Icon = config.icon

  const items = useMemo(() => {
    const q = search.toLowerCase()

    switch (entityType) {
      case 'event':
        return events
          .filter((e) => e.title.toLowerCase().includes(q))
          .map((e) => ({
            id: e.id,
            name: e.title,
            category: e.category,
            sub: e.location || e.start_time || '',
            result: mapEventToNodeData(e),
          }))
      case 'artist':
        return artists
          .filter((a) => a.name.toLowerCase().includes(q))
          .map((a) => ({
            id: a.id,
            name: a.name,
            category: a.category,
            sub: a.bio ? a.bio.slice(0, 60) : '',
            result: mapArtistToNodeData(a),
          }))
      case 'exhibitor':
        return exhibitors
          .filter((e) => e.name.toLowerCase().includes(q))
          .map((e) => ({
            id: e.id,
            name: e.name,
            category: e.category,
            sub: e.description ? e.description.slice(0, 60) : '',
            result: mapExhibitorToNodeData(e),
          }))
      case 'media':
        return mediaItems
          .filter((m) => m.title.toLowerCase().includes(q))
          .map((m) => ({
            id: m.id,
            name: m.title,
            category: m.category,
            sub: m.type,
            result: mapMediaToNodeData(m),
          }))
    }
  }, [entityType, events, artists, exhibitors, mediaItems, search])

  const handleSelect = (result: EntityPickerResult) => {
    onSelect(result)
    onOpenChange(false)
    setSearch('')
  }

  const handleCreateEmpty = () => {
    onCreateEmpty()
    onOpenChange(false)
    setSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSearch('') }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-navy">
            <Icon className="h-5 w-5" />
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
          <Input
            placeholder="Cerca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-navy/50">Nessun risultato</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.result)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-beige-dark/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy truncate">{item.name}</p>
                  {item.sub && (
                    <p className="text-xs text-navy/50 truncate">{item.sub}</p>
                  )}
                </div>
                <CategoryBadge category={item.category} />
              </button>
            ))
          )}
        </div>

        <Button
          variant="outline"
          onClick={handleCreateEmpty}
          className="w-full mt-1"
        >
          <Plus className="h-4 w-4 mr-1" />
          {config.emptyLabel}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
