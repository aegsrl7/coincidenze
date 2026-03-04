import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Event } from '@/types'

interface EventsState {
  events: Event[]
  loading: boolean
  error: string | null
  fetchEvents: () => Promise<void>
  createEvent: (data: Partial<Event>) => Promise<Event>
  updateEvent: (id: string, data: Partial<Event>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  loading: false,
  error: null,

  fetchEvents: async () => {
    set({ loading: true, error: null })
    try {
      const events = await api.getEvents()
      set({ events, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  createEvent: async (data) => {
    const event = await api.createEvent(data)
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
