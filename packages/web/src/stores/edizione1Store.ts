import { create } from 'zustand'
import { api } from '@/lib/api'
import type { GalleryImage, ContentSection } from '@/types'

interface Edizione1Store {
  gallery: GalleryImage[]
  content: Record<string, string>
  fetchGallery: () => Promise<void>
  fetchContent: () => Promise<void>
  addImage: (imageUrl: string, caption?: string) => Promise<void>
  deleteImage: (id: string) => Promise<void>
  reorderGallery: (order: string[]) => Promise<void>
  setGalleryLocal: (gallery: GalleryImage[]) => void
  updateContent: (section: string, text: string) => Promise<void>
}

export const useEdizione1Store = create<Edizione1Store>((set, get) => ({
  gallery: [],
  content: {},
  fetchGallery: async () => {
    const gallery = await api.getEdizione1Gallery()
    set({ gallery })
  },
  fetchContent: async () => {
    const sections = await api.getEdizione1Content()
    const content: Record<string, string> = {}
    for (const s of sections) {
      content[s.section] = s.content
    }
    set({ content })
  },
  addImage: async (imageUrl, caption) => {
    await api.addEdizione1Image({ image_url: imageUrl, caption: caption || '' })
    await get().fetchGallery()
  },
  deleteImage: async (id) => {
    await api.deleteEdizione1Image(id)
    await get().fetchGallery()
  },
  reorderGallery: async (order) => {
    await api.reorderEdizione1Gallery(order)
  },
  setGalleryLocal: (gallery) => {
    set({ gallery })
  },
  updateContent: async (section, text) => {
    await api.updateEdizione1Content(section, text)
    const content = { ...get().content, [section]: text }
    set({ content })
  },
}))
