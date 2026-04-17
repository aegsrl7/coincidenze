import { create } from 'zustand'
import { api } from '@/lib/api'
import type { EditorialPost } from '@/types'

interface EditorialStore {
  posts: EditorialPost[]
  fetchPosts: () => Promise<void>
  createPost: (data: Partial<EditorialPost>) => Promise<void>
  updatePost: (id: string, data: Partial<EditorialPost>) => Promise<void>
  deletePost: (id: string) => Promise<void>
}

export const useEditorialStore = create<EditorialStore>((set, get) => ({
  posts: [],
  fetchPosts: async () => {
    const posts = await api.getEditorialPosts()
    // Parse artisti_coinvolti from JSON string
    posts.forEach((p: any) => {
      if (typeof p.artisti_coinvolti === 'string') {
        try { p.artisti_coinvolti = JSON.parse(p.artisti_coinvolti) } catch { p.artisti_coinvolti = [] }
      }
      if (!Array.isArray(p.artisti_coinvolti)) p.artisti_coinvolti = []
    })
    set({ posts })
  },
  createPost: async (data) => {
    await api.createEditorialPost(data)
    await get().fetchPosts()
  },
  updatePost: async (id, data) => {
    await api.updateEditorialPost(id, data)
    await get().fetchPosts()
  },
  deletePost: async (id) => {
    await api.deleteEditorialPost(id)
    await get().fetchPosts()
  },
}))
