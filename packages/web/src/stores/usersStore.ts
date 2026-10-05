import { create } from 'zustand'
import { api, type AccessLinkResult } from '@/lib/api'
import type { AdminUser } from '@/types'

interface UsersState {
  users: AdminUser[]
  loading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  inviteUser: (data: { name: string; email: string; role_id: string }) => Promise<AccessLinkResult>
  updateUser: (id: string, data: { name?: string; role_id?: string; active?: boolean }) => Promise<void>
  sendLink: (id: string) => Promise<AccessLinkResult>
  deleteUser: (id: string) => Promise<void>
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null })
    try {
      set({ users: await api.getUsers(), loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Errore', loading: false })
    }
  },

  inviteUser: async (data) => {
    const res = await api.inviteUser(data)
    set({ users: [...get().users, res.user] })
    return { email_sent: res.email_sent, link: res.link }
  },

  updateUser: async (id, data) => {
    const updated = await api.updateUser(id, data)
    set({ users: get().users.map((u) => (u.id === id ? updated : u)) })
  },

  sendLink: (id) => api.sendUserLink(id),

  deleteUser: async (id) => {
    await api.deleteUser(id)
    set({ users: get().users.filter((u) => u.id !== id) })
  },
}))
