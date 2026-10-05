import { create } from 'zustand'
import { api } from '@/lib/api'
import type { UserRole } from '@/types'

type LoginResult = { ok: true } | { ok: false; error: string }

interface AuthState {
  isAuthenticated: boolean
  /** admin = tutto, agency = agenzia social/marketing (programma, artisti, media, piano editoriale) */
  role: UserRole | null
  loading: boolean
  checkAuth: () => Promise<void>
  login: (password: string) => Promise<LoginResult>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  role: null,
  loading: true,

  checkAuth: async () => {
    try {
      const res = await api.authMe()
      set({ isAuthenticated: res.authenticated, role: res.role ?? null, loading: false })
    } catch {
      set({ isAuthenticated: false, role: null, loading: false })
    }
  },

  login: async (password: string) => {
    try {
      const res = await api.login(password)
      if (res.authenticated) {
        set({ isAuthenticated: true, role: res.role ?? null })
        return { ok: true }
      }
      return { ok: false, error: 'Password errata' }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Accesso non riuscito' }
    }
  },

  logout: async () => {
    try {
      await api.logout()
    } finally {
      set({ isAuthenticated: false, role: null })
    }
  },
}))

/** true solo per il ruolo admin (accrediti, spuntino, team, edizioni, testi delle pagine pubbliche) */
export function useIsAdmin(): boolean {
  return useAuthStore((s) => s.role === 'admin')
}
