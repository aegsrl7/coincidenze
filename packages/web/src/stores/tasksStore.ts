import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Task } from '@/types'

interface TasksState {
  tasks: Task[]
  loading: boolean
  error: string | null
  fetchTasks: () => Promise<void>
  createTask: (data: Partial<Task>) => Promise<Task>
  updateTask: (id: string, data: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null })
    try {
      const tasks = await api.getTasks()
      set({ tasks, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  createTask: async (data) => {
    const task = await api.createTask(data)
    set({ tasks: [...get().tasks, task] })
    return task
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
