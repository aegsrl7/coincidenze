import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Artist } from '@/types'

interface ArtistsState {
  artists: Artist[]
  loading: boolean
  error: string | null
  fetchArtists: () => Promise<void>
  createArtist: (data: Partial<Artist>) => Promise<Artist>
  updateArtist: (id: string, data: Partial<Artist>) => Promise<void>
  deleteArtist: (id: string) => Promise<void>
}

export const useArtistsStore = create<ArtistsState>((set, get) => ({
  artists: [],
  loading: false,
  error: null,

  fetchArtists: async () => {
    set({ loading: true, error: null })
    try {
      const artists = await api.getArtists()
      set({ artists, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  createArtist: async (data) => {
    const artist = await api.createArtist(data)
    set({ artists: [...get().artists, artist] })
    return artist
  },

  updateArtist: async (id, data) => {
    await api.updateArtist(id, data)
    set({ artists: get().artists.map((a) => (a.id === id ? { ...a, ...data } : a)) })
  },

  deleteArtist: async (id) => {
    await api.deleteArtist(id)
    set({ artists: get().artists.filter((a) => a.id !== id) })
  },
}))
