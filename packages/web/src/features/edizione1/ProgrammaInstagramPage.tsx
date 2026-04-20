import { useEffect, useState } from 'react'
import { Clock, MapPin } from 'lucide-react'
import { useCategoryMaps } from '@/stores/categoriesStore'
import { api } from '@/lib/api'
import type { Event } from '@/types'

function isAllDay(event: Event): boolean {
  if (!event.start_time || !event.end_time) return false
  const start = parseInt(event.start_time.split(':')[0], 10)
  const end = parseInt(event.end_time.split(':')[0], 10)
  return end - start >= 8
}

export function ProgrammaInstagramPage() {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    api.getEvents().then(setEvents)
  }, [])

  const scheduled = events
    .filter((e) => !isAllDay(e))
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
  const allDay = events.filter(isAllDay)

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-lg mx-auto px-6">
        <header className="text-center mb-8">
          <p className="text-[11px] tracking-[0.3em] uppercase text-ink-muted mb-2">
            Edizione 1 · Programma
          </p>
          <h1 className="font-display text-4xl font-semibold text-navy leading-tight">
            COINCIDENZE
          </h1>
          <p className="text-sm text-ink-light italic mt-1">
            sabato 25 aprile · Marsam Locanda, Bene Vagienna
          </p>
        </header>

        <div className="space-y-2">
          {scheduled.map((e) => (
            <EventBlock key={e.id} event={e} />
          ))}
          {allDay.map((e) => (
            <EventBlock key={e.id} event={e} allDay />
          ))}
        </div>

        <p className="text-center text-[11px] tracking-[0.25em] uppercase text-ink-muted italic mt-8">
          raffinate casualità, occhi attenti
        </p>
      </div>
    </div>
  )
}

function EventBlock({ event, allDay }: { event: Event; allDay?: boolean }) {
  const { colors } = useCategoryMaps('artist')
  return (
    <div className="bg-beige/40 rounded-lg border border-navy/10 p-3 flex gap-3 items-start h-[150px]">
      <div className="shrink-0 w-16 text-right">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy">
          <Clock className="h-3 w-3 text-ink-muted" />
          {allDay ? 'Tutto il giorno' : event.start_time}
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
  )
}
