import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Task } from '@/types'

interface TasksState {
  tasks: Task[]
  loading: boolean
  error: string | null
  /** slug attivo dell'edizione (per refetch quando cambia) */
  editionSlug: string | null
  fetchTasks: (editionSlug?: string | null) => Promise<void>
  /** Senza editionSlug il task va nell'edizione mostrata dal kanban */
  createTask: (data: Partial<Task>, editionSlug?: string | null) => Promise<Task>
  /** Task di più edizioni che soddisfano match, senza toccare quelli caricati nel kanban */
  findTasks: (editionSlugs: string[], match: (t: Task) => boolean) => Promise<{ task: Task; editionSlug: string }[]>
  updateTask: (id: string, data: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  editionSlug: null,

  fetchTasks: async (editionSlug) => {
    set({ loading: true, error: null, editionSlug: editionSlug ?? get().editionSlug })
    try {
      const tasks = await api.getTasks(editionSlug ?? get().editionSlug ?? undefined)
      set({ tasks, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  createTask: async (data, editionSlug) => {
    const slug = editionSlug ?? get().editionSlug
    const task = await api.createTask(data, slug)
    if (slug === get().editionSlug) set({ tasks: [...get().tasks, task] })
    return task
  },

  findTasks: async (editionSlugs, match) => {
    const lists = await Promise.all(editionSlugs.map(async (slug) => ({ slug, tasks: await api.getTasks(slug) })))
    return lists.flatMap(({ slug, tasks }) => tasks.filter(match).map((task) => ({ task, editionSlug: slug })))
  },

  updateTask: async (id, data) => {
    await api.updateTask(id, data)
    set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...data } : t)) })
  },

  deleteTask: async (id) => {
    await api.deleteTask(id)
    set({ tasks: get().tasks.filter((t) => t.id !== id) })
  },
}))
