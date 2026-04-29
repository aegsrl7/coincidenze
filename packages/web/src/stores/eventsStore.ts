import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Event } from '@/types'

interface EventsState {
  events: Event[]
  loading: boolean
  error: string | null
  /** slug attivo dell'edizione (per refetch quando cambia) */
  editionSlug: string | null
  fetchEvents: (editionSlug?: string | null) => Promise<void>
  createEvent: (data: Partial<Event>) => Promise<Event>
  updateEvent: (id: string, data: Partial<Event>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  loading: false,
  error: null,
  editionSlug: null,

  fetchEvents: async (editionSlug) => {
    set({ loading: true, error: null, editionSlug: editionSlug ?? get().editionSlug })
    try {
      const events = await api.getEvents(editionSlug ?? get().editionSlug ?? undefined)
      set({ events, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  createEvent: async (data) => {
    const editionSlug = get().editionSlug
    const event = await api.createEvent(data, editionSlug)
    set({ events: [...get().events, event] })
    return event
  },

  updateEvent: async (id, data) => {
    await api.updateEvent(id, data)
    set({ events: get().events.map((e) => (e.id === id ? { ...e, ...data } : e)) })
  },

  deleteEvent: async (id) => {
    await api.deleteEvent(id)
    set({ events: get().events.filter((e) => e.id !== id) })
  },
}))
