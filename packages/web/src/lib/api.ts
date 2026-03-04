const API_BASE = import.meta.env.DEV ? '/api' : 'https://coincidenze-api.lamaz7.workers.dev/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
    ...options,
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || `API error: ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Auth
  login: (password: string) => request<{ authenticated: boolean }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request<{ authenticated: boolean }>('/auth/logout', { method: 'POST' }),
  authMe: () => request<{ authenticated: boolean }>('/auth/me'),

  // Events
  getEvents: () => request<any[]>('/events'),
  getEvent: (id: string) => request<any>(`/events/${id}`),
  createEvent: (data: any) => request<any>('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: string, data: any) => request<any>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id: string) => request<void>(`/events/${id}`, { method: 'DELETE' }),

  // Artists
  getArtists: () => request<any[]>('/artists'),
  getArtist: (id: string) => request<any>(`/artists/${id}`),
  createArtist: (data: any) => request<any>('/artists', { method: 'POST', body: JSON.stringify(data) }),
  updateArtist: (id: string, data: any) => request<any>(`/artists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteArtist: (id: string) => request<void>(`/artists/${id}`, { method: 'DELETE' }),

  // Exhibitors
  getExhibitors: () => request<any[]>('/exhibitors'),
  createExhibitor: (data: any) => request<any>('/exhibitors', { method: 'POST', body: JSON.stringify(data) }),
  updateExhibitor: (id: string, data: any) => request<any>(`/exhibitors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExhibitor: (id: string) => request<void>(`/exhibitors/${id}`, { method: 'DELETE' }),

  // Media
  getMedia: () => request<any[]>('/media'),
  createMedia: (data: any) => request<any>('/media', { method: 'POST', body: JSON.stringify(data) }),
  updateMedia: (id: string, data: any) => request<any>(`/media/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedia: (id: string) => request<void>(`/media/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: () => request<any[]>('/tasks'),
  createTask: (data: any) => request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) => request<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  // Team
  getTeamMembers: () => request<any[]>('/team'),
  createTeamMember: (data: any) => request<any>('/team', { method: 'POST', body: JSON.stringify(data) }),
  updateTeamMember: (id: string, data: any) => request<any>(`/team/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTeamMember: (id: string) => request<void>(`/team/${id}`, { method: 'DELETE' }),

  // Canvas
  getCanvasNodes: () => request<any[]>('/canvas/nodes'),
  getCanvasEdges: () => request<any[]>('/canvas/edges'),
  saveCanvas: (data: { nodes: any[]; edges: any[] }) => request<any>('/canvas', { method: 'PUT', body: JSON.stringify(data) }),
}
