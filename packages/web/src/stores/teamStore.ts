import { create } from 'zustand'
import { api } from '@/lib/api'
import type { OrgUser, TeamMember } from '@/types'

interface TeamState {
  members: TeamMember[]
  /** Utenti attivi del sito, con il ruolo d'accesso */
  users: OrgUser[]
  fetchUsers: () => Promise<void>
  loading: boolean
  error: string | null
  fetchMembers: () => Promise<void>
  createMember: (data: Partial<TeamMember>) => Promise<TeamMember>
  updateMember: (id: string, data: Partial<TeamMember>) => Promise<void>
  deleteMember: (id: string) => Promise<void>
}

export const useTeamStore = create<TeamState>((set, get) => ({
  members: [],
  users: [],

  fetchUsers: async () => {
    try {
      set({ users: await api.getTeamUsers() })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Errore' })
    }
  },
  loading: false,
  error: null,

  fetchMembers: async () => {
    set({ loading: true, error: null })
    try {
      const members = await api.getTeamMembers()
      set({ members, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  createMember: async (data) => {
    const member = await api.createTeamMember(data)
    set({ members: [...get().members, member] })
    return member
  },

  updateMember: async (id, data) => {
    await api.updateTeamMember(id, data)
    set({ members: get().members.map((m) => (m.id === id ? { ...m, ...data } : m)) })
  },

  deleteMember: async (id) => {
    await api.deleteTeamMember(id)
    set({ members: get().members.filter((m) => m.id !== id) })
  },
}))
