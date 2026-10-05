import { create } from 'zustand'
import { api } from '@/lib/api'
import type { PermissionCatalog, Role } from '@/types'

type RoleInput = { name: string; description: string; permissions: string[] }

interface RolesState {
  roles: Role[]
  catalog: PermissionCatalog | null
  loading: boolean
  error: string | null
  fetchRoles: () => Promise<void>
  createRole: (data: RoleInput) => Promise<void>
  updateRole: (id: string, data: RoleInput) => Promise<void>
  deleteRole: (id: string) => Promise<void>
}

export const useRolesStore = create<RolesState>((set, get) => ({
  roles: [],
  catalog: null,
  loading: false,
  error: null,

  fetchRoles: async () => {
    set({ loading: true, error: null })
    try {
      const [roles, catalog] = await Promise.all([api.getRoles(), get().catalog ?? api.getPermissionCatalog()])
      set({ roles, catalog, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Errore', loading: false })
    }
  },

  createRole: async (data) => {
    const role = await api.createRole(data)
    set({ roles: [...get().roles, role] })
  },

  updateRole: async (id, data) => {
    const role = await api.updateRole(id, data)
    set({ roles: get().roles.map((r) => (r.id === id ? role : r)) })
  },

  deleteRole: async (id) => {
    await api.deleteRole(id)
    set({ roles: get().roles.filter((r) => r.id !== id) })
  },
}))
