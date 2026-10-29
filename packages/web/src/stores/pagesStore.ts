import { create } from 'zustand'
import { api } from '@/lib/api'
import type { CommentAnchorInput, Page, PageComment, PageInput, PageListItem } from '@/types'

interface PagesState {
  /** Pagine dell'edizione caricata (albero costruito dalla UI con parent_id) */
  pages: PageListItem[]
  editionSlug: string | null
  loading: boolean
  error: string | null
  fetchPages: (editionSlug: string | null) => Promise<void>
  fetchPage: (id: string) => Promise<Page>
  /** Senza editionSlug la pagina va nell'edizione caricata; una sottopagina in quella della madre */
  createPage: (data: { title?: string; parent_id?: string | null; tags?: string[] }, editionSlug?: string | null) => Promise<Page>
  savePage: (id: string, data: PageInput) => Promise<{ page: Page; conflict: boolean }>
  deletePage: (id: string) => Promise<void>
  fetchComments: (pageId: string) => Promise<PageComment[]>
  /** Commento in fondo, risposta (parent_id) o nuova discussione su un pezzo di testo (anchor_*) */
  addComment: (pageId: string, body: string, extra?: { parent_id?: string } & Partial<CommentAnchorInput>) => Promise<PageComment>
  resolveComment: (id: string, resolved: boolean) => Promise<PageComment>
  deleteComment: (id: string) => Promise<void>
}

const toListItem = (p: Page, comments = 0): PageListItem => ({
  id: p.id,
  parent_id: p.parent_id,
  title: p.title,
  tags: p.tags,
  sort_order: p.sort_order,
  text: p.content_text.slice(0, 2000),
  created_by_name: p.created_by_name,
  updated_by_name: p.updated_by_name,
  comment_count: comments,
  created_at: p.created_at,
  updated_at: p.updated_at,
})

export const usePagesStore = create<PagesState>((set, get) => ({
  pages: [],
  editionSlug: null,
  loading: false,
  error: null,

  fetchPages: async (editionSlug) => {
    set({ loading: true, error: null, editionSlug })
    try {
      set({ pages: await api.getPages(editionSlug), loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Errore', loading: false })
    }
  },

  fetchPage: (id) => api.getPage(id),

  createPage: async (data, editionSlug) => {
    const page = await api.createPage(data, editionSlug ?? get().editionSlug)
    if (page.edition_slug === get().editionSlug) set({ pages: [...get().pages, toListItem(page)] })
    return page
  },

  savePage: async (id, data) => {
    const res = await api.updatePage(id, data)
    // L'elenco segue l'ultima versione nota, anche quella di un altro in caso di conflitto
    set({
      pages: get().pages.map((p) => (p.id === id ? toListItem(res.page, p.comment_count) : p)),
    })
    return res
  },

  deletePage: async (id) => {
    await api.deletePage(id)
    // Via anche le sottopagine: si ricarica l'elenco
    await get().fetchPages(get().editionSlug)
  },

  fetchComments: (pageId) => api.getPageComments(pageId),

  addComment: async (pageId, body, extra) => {
    const comment = await api.addPageComment(pageId, body, extra)
    set({ pages: get().pages.map((p) => (p.id === pageId ? { ...p, comment_count: p.comment_count + 1 } : p)) })
    return comment
  },

  resolveComment: (id, resolved) => api.resolvePageComment(id, resolved),

  deleteComment: async (id) => {
    await api.deletePageComment(id)
  },
}))
