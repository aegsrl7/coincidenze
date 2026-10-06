import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Meeting, MeetingInput, MeetingListItem } from '@/types'

interface MeetingsState {
  meetings: MeetingListItem[]
  loading: boolean
  error: string | null
  fetchMeetings: () => Promise<void>
  fetchMeeting: (id: string) => Promise<Meeting>
  createMeeting: (data: MeetingInput) => Promise<Meeting>
  updateMeeting: (id: string, data: MeetingInput) => Promise<Meeting>
  deleteMeeting: (id: string) => Promise<void>
}

export const useMeetingsStore = create<MeetingsState>((set, get) => ({
  meetings: [],
  loading: false,
  error: null,

  fetchMeetings: async () => {
    set({ loading: true, error: null })
    try {
      set({ meetings: await api.getMeetings(), loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Errore', loading: false })
    }
  },

  fetchMeeting: (id) => api.getMeeting(id),

  // Dopo una modifica l'elenco si ricarica: anteprima e ordine per data li calcola l'API
  createMeeting: async (data) => {
    const created = await api.createMeeting(data)
    get().fetchMeetings()
    return created
  },

  updateMeeting: async (id, data) => {
    const updated = await api.updateMeeting(id, data)
    get().fetchMeetings()
    return updated
  },

  deleteMeeting: async (id) => {
    await api.deleteMeeting(id)
    set({ meetings: get().meetings.filter((m) => m.id !== id) })
  },
}))
