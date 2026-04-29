import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Edition } from '@/types'

const ADMIN_SLUG_KEY = 'coincidenze:admin:edition'

interface EditionsStore {
  editions: Edition[]
  current: Edition | null
  /**
   * Slug dell'edizione su cui sta lavorando l'admin (filtra programma, accrediti, ecc.).
   * Persistito in localStorage. Default: edizione corrente.
   */
  adminSlug: string | null
  loaded: boolean
  fetch: () => Promise<void>
  setAdminSlug: (slug: string | null) => void
  refresh: () => Promise<void>
}

function loadAdminSlug(): string | null {
  try {
    return localStorage.getItem(ADMIN_SLUG_KEY)
  } catch {
    return null
  }
}

function saveAdminSlug(slug: string | null) {
  try {
    if (slug) localStorage.setItem(ADMIN_SLUG_KEY, slug)
    else localStorage.removeItem(ADMIN_SLUG_KEY)
  } catch {}
}

export const useEditionsStore = create<EditionsStore>((set, get) => ({
  editions: [],
  current: null,
  adminSlug: loadAdminSlug(),
  loaded: false,

  fetch: async () => {
    if (get().loaded) return
    await get().refresh()
  },

  refresh: async () => {
    const editions = (await api.getEditions()) as Edition[]
    const current = editions.find((e) => e.is_current === 1) || null
    let adminSlug = get().adminSlug
    if (!adminSlug || !editions.some((e) => e.slug === adminSlug)) {
      adminSlug = current?.slug ?? null
      saveAdminSlug(adminSlug)
    }
    set({ editions, current, adminSlug, loaded: true })
  },

  setAdminSlug: (slug) => {
    saveAdminSlug(slug)
    set({ adminSlug: slug })
  },
}))

/**
 * Hook helper per le pagine admin: ritorna lo slug dell'edizione attualmente
 * selezionata (default: corrente). Usalo per passare a getEvents/listAccreditations/ecc.
 */
export function useAdminEditionSlug(): string | null {
  return useEditionsStore((s) => s.adminSlug)
}
