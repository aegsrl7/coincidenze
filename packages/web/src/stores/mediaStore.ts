import { create } from 'zustand'
import { api } from '@/lib/api'
import type { MediaItem } from '@/types'

interface MediaState {
  items: MediaItem[]
  loading: boolean
  error: string | null
  editionSlug: string | null
  fetchMedia: (editionSlug?: string | null) => Promise<void>
  createMedia: (data: Partial<MediaItem>) => Promise<MediaItem>
  updateMedia: (id: string, data: Partial<MediaItem>) => Promise<void>
  deleteMedia: (id: string) => Promise<void>
}

export const useMediaStore = create<MediaState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  editionSlug: null,

  fetchMedia: async (editionSlug) => {
    set({ loading: true, error: null, editionSlug: editionSlug ?? get().editionSlug })
    try {
      const items = await api.getMedia(editionSlug ?? get().editionSlug ?? undefined)
      set({ items, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  createMedia: async (data) => {
    const item = await api.createMedia(data, get().editionSlug)
    set({ items: [...get().items, item] })
    return item
  },

  updateMedia: async (id, data) => {
    await api.updateMedia(id, data)
    set({ items: get().items.map((i) => (i.id === id ? { ...i, ...data } : i)) })
  },

  deleteMedia: async (id) => {
    await api.deleteMedia(id)
    set({ items: get().items.filter((i) => i.id !== id) })
  },
}))
