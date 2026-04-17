import { create } from 'zustand'
import { useMemo } from 'react'
import { api } from '@/lib/api'
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type Category,
  type EventCategory,
} from '@/types'

interface CategoriesState {
  categories: Category[]
  loading: boolean
  fetched: boolean
  fetch: () => Promise<void>
  refetch: () => Promise<void>
  create: (data: Partial<Category>) => Promise<Category>
  update: (id: string, data: Partial<Category>) => Promise<void>
  remove: (id: string) => Promise<void>
  reorder: (order: string[]) => Promise<void>
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  loading: false,
  fetched: false,

  fetch: async () => {
    if (get().fetched || get().loading) return
    set({ loading: true })
    try {
      const data = (await api.getCategories()) as Category[]
      set({ categories: data, fetched: true, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  refetch: async () => {
    set({ loading: true })
    try {
      const data = (await api.getCategories()) as Category[]
      set({ categories: data, fetched: true, loading: false })
    } finally {
      set({ loading: false })
    }
  },

  create: async (data) => {
    const created = (await api.createCategory(data)) as Category
    set({ categories: [...get().categories, created] })
    return created
  },

  update: async (id, data) => {
    const updated = (await api.updateCategory(id, data)) as Category
    set({
      categories: get().categories.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    })
  },

  remove: async (id) => {
    await api.deleteCategory(id)
    set({ categories: get().categories.filter((c) => c.id !== id) })
  },

  reorder: async (order) => {
    await api.reorderCategories(order)
    // Optimistic: applica sort_order localmente
    const map = new Map(order.map((id, i) => [id, i * 10]))
    set({
      categories: get().categories.map((c) =>
        map.has(c.id) ? { ...c, sort_order: map.get(c.id)! } : c
      ),
    })
  },
}))

function prettify(slug: string): string {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Hook che restituisce mappe {slug → label} e {slug → color}, sovrapponendo
 * dati DB alle mappe hardcoded (CATEGORY_LABELS/COLORS).
 *
 * Fallback per slug non in DB:
 * - label: prova CATEGORY_LABELS, poi prettify(slug)
 * - color: prova CATEGORY_COLORS, poi navy
 *
 * Oggetti Proxy: qualsiasi accesso `labels['slug']` viene risolto dinamicamente,
 * così il refactor è drop-in sui consumer che usano `CATEGORY_LABELS[cat]`.
 */
export function useCategoryMaps(type: 'artist' | 'menu' = 'artist') {
  const cats = useCategoriesStore((s) => s.categories)

  return useMemo(() => {
    const dbBySlug: Record<string, Category> = {}
    for (const c of cats) {
      if (c.type === type) dbBySlug[c.slug] = c
    }

    const labels = new Proxy({} as Record<string, string>, {
      get(_t, key: string) {
        if (dbBySlug[key]?.label) return dbBySlug[key].label
        const fromDefault = (CATEGORY_LABELS as Record<string, string>)[key]
        if (fromDefault) return fromDefault
        return prettify(key)
      },
    })

    const colors = new Proxy({} as Record<string, string>, {
      get(_t, key: string) {
        if (dbBySlug[key]?.color) return dbBySlug[key].color
        const fromDefault = (CATEGORY_COLORS as Record<string, string>)[key]
        if (fromDefault) return fromDefault
        return '#2C3E6B'
      },
    })

    const list = cats
      .filter((c) => c.type === type)
      .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label))

    return { labels, colors, list }
  }, [cats, type])
}

/** Helper non-reactive (es. per servizi fuori da componenti) */
export function resolveCategoryLabel(slug: string, type: 'artist' | 'menu' = 'artist'): string {
  const cats = useCategoriesStore.getState().categories
  const dbHit = cats.find((c) => c.type === type && c.slug === slug)
  if (dbHit?.label) return dbHit.label
  const fromDefault = (CATEGORY_LABELS as Record<string, string>)[slug as EventCategory]
  if (fromDefault) return fromDefault
  return prettify(slug)
}

export function resolveCategoryColor(slug: string, type: 'artist' | 'menu' = 'artist'): string {
  const cats = useCategoriesStore.getState().categories
  const dbHit = cats.find((c) => c.type === type && c.slug === slug)
  if (dbHit?.color) return dbHit.color
  const fromDefault = (CATEGORY_COLORS as Record<string, string>)[slug as EventCategory]
  if (fromDefault) return fromDefault
  return '#2C3E6B'
}
