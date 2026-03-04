import { create } from 'zustand'
import { api } from '@/lib/api'

interface AuthState {
  isAuthenticated: boolean
  loading: boolean
  checkAuth: () => Promise<void>
  login: (password: string) => Promise<boolean>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  loading: true,

  checkAuth: async () => {
    try {
      const res = await api.authMe()
      set({ isAuthenticated: res.authenticated, loading: false })
    } catch {
      set({ isAuthenticated: false, loading: false })
    }
  },

  login: async (password: string) => {
    try {
      const res = await api.login(password)
      if (res.authenticated) {
        set({ isAuthenticated: true })
        return true
      }
      return false
    } catch {
      return false
    }
  },

  logout: async () => {
    try {
      await api.logout()
    } finally {
      set({ isAuthenticated: false })
    }
  },
}))
