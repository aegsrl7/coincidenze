import { create } from 'zustand'
import { api } from '@/lib/api'
import type { GalleryImage, ContentSection } from '@/types'

interface EditionDataStore {
  /** slug → mappa contenuti */
  contents: Record<string, Record<string, string>>
  /** slug → galleria */
  galleries: Record<string, GalleryImage[]>
  fetchContent: (slug: string) => Promise<void>
  fetchGallery: (slug: string) => Promise<void>
  setGalleryLocal: (slug: string, gallery: GalleryImage[]) => void
  addImage: (slug: string, imageUrl: string, caption?: string) => Promise<void>
  deleteImage: (slug: string, id: string) => Promise<void>
  reorderGallery: (slug: string, order: string[]) => Promise<void>
  updateContent: (slug: string, section: string, text: string) => Promise<void>
}

export const useEditionDataStore = create<EditionDataStore>((set, get) => ({
  contents: {},
  galleries: {},

  fetchContent: async (slug) => {
    const sections = (await api.getEditionContent(slug)) as ContentSection[]
    const content: Record<string, string> = {}
    for (const s of sections) content[s.section] = s.content
    set((state) => ({ contents: { ...state.contents, [slug]: content } }))
  },

  fetchGallery: async (slug) => {
    const gallery = (await api.getEditionGallery(slug)) as GalleryImage[]
    set((state) => ({ galleries: { ...state.galleries, [slug]: gallery } }))
  },

  setGalleryLocal: (slug, gallery) => {
    set((state) => ({ galleries: { ...state.galleries, [slug]: gallery } }))
  },

  addImage: async (slug, imageUrl, caption) => {
    await api.addEditionGalleryImage(slug, { image_url: imageUrl, caption: caption || '' })
    await get().fetchGallery(slug)
  },

  deleteImage: async (slug, id) => {
    await api.deleteEditionGalleryImage(slug, id)
    await get().fetchGallery(slug)
  },

  reorderGallery: async (slug, order) => {
    await api.reorderEditionGallery(slug, order)
  },

  updateContent: async (slug, section, text) => {
    await api.updateEditionContent(slug, section, text)
    set((state) => ({
      contents: {
        ...state.contents,
        [slug]: { ...(state.contents[slug] || {}), [section]: text },
      },
    }))
  },
}))
