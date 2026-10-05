import { create } from 'zustand'
import { api, type MeResponse } from '@/lib/api'
import type { SessionUser } from '@/types'

type Result = { ok: true } | { ok: false; error: string }

interface AuthState {
  isAuthenticated: boolean
  user: SessionUser | null
  /** Permessi del ruolo dell'utente, es. "programma.edit" (catalogo nell'API) */
  permissions: string[]
  loading: boolean
  checkAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<Result>
  logout: () => Promise<void>
}

function fromMe(res: MeResponse) {
  return { isAuthenticated: res.authenticated, user: res.user, permissions: res.permissions ?? [] }
}

const signedOut = { isAuthenticated: false, user: null, permissions: [] as string[] }

export const useAuthStore = create<AuthState>((set, get) => ({
  ...signedOut,
  loading: true,

  checkAuth: async () => {
    try {
      set({ ...fromMe(await api.authMe()), loading: false })
    } catch {
      set({ ...signedOut, loading: false })
    }
  },

  login: async (email, password) => {
    try {
      await api.login(email, password)
      await get().checkAuth()
      return get().isAuthenticated ? { ok: true } : { ok: false, error: 'Accesso non riuscito' }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Accesso non riuscito' }
    }
  },

  logout: async () => {
    try {
      await api.logout()
    } finally {
      set(signedOut)
    }
  },
}))

/** true se l'utente ha il permesso (es. useCan('programma.edit')) */
export function useCan(permission: string): boolean {
  return useAuthStore((s) => s.permissions.includes(permission))
}
