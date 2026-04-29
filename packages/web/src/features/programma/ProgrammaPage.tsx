import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Clock, MapPin, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEventsStore } from '@/stores/eventsStore'
import { useArtistsStore } from '@/stores/artistsStore'
import { useAuthStore } from '@/stores/authStore'
import { useCategoryMaps } from '@/stores/categoriesStore'
import { useEditionsStore, useAdminEditionSlug } from '@/stores/editionsStore'
import { type Event } from '@/types'
import { EventFormDialog } from './EventFormDialog'

export function ProgrammaPage() {
  const { events, fetchEvents } = useEventsStore()
  const { artists, fetchArtists } = useArtistsStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { labels, colors, list: artistCats } = useCategoryMaps('artist')
  const adminSlug = useAdminEditionSlug()
  const editions = useEditionsStore((s) => s.editions)
  const fetchEditions = useEditionsStore((s) => s.fetch)
  const activeEdition = editions.find((e) => e.slug === adminSlug)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined)

  useEffect(() => {
    fetchEditions()
    fetchArtists()
  }, [fetchEditions, fetchArtists])

  useEffect(() => {
    fetchEvents(adminSlug)
  }, [fetchEvents, adminSlug])

  const filteredEvents = activeFilter
    ? events.filter((e) => e.category === activeFilter)
    : events

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (a.start_time < b.start_time) return -1
    if (a.start_time > b.start_time) return 1
    return 0
  })

  const getArtistNames = (artistIds: string[] | undefined) => {
    if (!artistIds || artistIds.length === 0) return null
    const names = artistIds
      .map((id) => artists.find((a) => a.id === id)?.name)
      .filter(Boolean)
    return names.length > 0 ? names.join(', ') : null
  }

  const categories = artistCats.map((c) => c.slug)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          {activeEdition && (
            <p className="text-xs uppercase tracking-wider text-viola">{activeEdition.name}</p>
          )}
          {activeEdition?.event_date && (
            <p className="text-sm text-ink-muted">
              {format(new Date(activeEdition.event_date), "EEEE d MMMM yyyy", { locale: it })}
            </p>
          )}
        </div>
        {isAuthenticated && (
          <Button onClick={() => { setEditingEvent(undefined); setShowForm(true) }}>+ Nuovo Evento</Button>
        )}
      </div>

      {/* Filtri categoria */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={activeFilter === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter(null)}
        >
          <Filter className="h-3 w-3" />
          Tutti
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeFilter === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
            style={activeFilter === cat ? { backgroundColor: colors[cat] } : {}}
          >
            {labels[cat]}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {sortedEvents.length === 0 ? (
          <div className="py-16 text-center text-ink-muted">
            <p>Nessun evento{activeFilter ? ` per "${labels[activeFilter]}"` : ''}</p>
          </div>
        ) : (
          sortedEvents.map((event) => {
            const color = colors[event.category] || '#2C3E6B'
            const artistName = getArtistNames(event.artist_ids)
            return (
              <Card
                key={event.id}
                className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
                onClick={() => {
                  if (isAuthenticated) {
                    setEditingEvent(event)
                    setShowForm(true)
                  }
                }}
              >
                <div className="flex">
                  <div className="w-1.5 shrink-0" style={{ backgroundColor: color }} />
                  <CardContent className="flex-1 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display text-base font-semibold text-navy">
                            {event.title}
                          </h3>
                          <Badge
                            className="text-[10px]"
                            style={{ backgroundColor: color }}
                          >
                            {labels[event.category]}
                          </Badge>
                        </div>
                        {artistName && (
                          <p className="mt-1 text-sm text-ink-light">{artistName}</p>
                        )}
                        {event.description && (
                          <p className="mt-1 text-xs text-ink-muted">{event.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-ink-muted shrink-0">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {event.start_time}
                          {event.end_time ? ` - ${event.end_time}` : ''}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {isAuthenticated && showForm && (
        <EventFormDialog open={showForm} onClose={() => { setShowForm(false); setEditingEvent(undefined) }} event={editingEvent} />
      )}
    </div>
  )
}
