const API_BASE = import.meta.env.DEV ? '/api' : 'https://api.coincidenze.org/api'

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

async function uploadRequest(file: File): Promise<{ url: string; key: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || `Upload error: ${res.status}`)
  }
  return res.json()
}

function withEdition(path: string, slug?: string | null): string {
  if (!slug) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}edition=${encodeURIComponent(slug)}`
}

export const api = {
  // Upload
  uploadFile: (file: File) => uploadRequest(file),

  // Auth
  login: (password: string) => request<{ authenticated: boolean }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request<{ authenticated: boolean }>('/auth/logout', { method: 'POST' }),
  authMe: () => request<{ authenticated: boolean }>('/auth/me'),

  // Editions
  getEditions: () => request<any[]>('/editions'),
  getCurrentEdition: () => request<any>('/editions/current'),
  getEdition: (slug: string) => request<any>(`/editions/${encodeURIComponent(slug)}`),
  createEdition: (data: any) => request<any>('/editions', { method: 'POST', body: JSON.stringify(data) }),
  updateEdition: (id: string, data: any) => request<any>(`/editions/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  setCurrentEdition: (id: string) => request<any>(`/editions/${encodeURIComponent(id)}/set-current`, { method: 'POST' }),
  deleteEdition: (id: string) => request<void>(`/editions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getEditionGallery: (slug: string) => request<any[]>(`/editions/${encodeURIComponent(slug)}/gallery`),
  addEditionGalleryImage: (slug: string, data: any) => request<any>(`/editions/${encodeURIComponent(slug)}/gallery`, { method: 'POST', body: JSON.stringify(data) }),
  reorderEditionGallery: (slug: string, order: string[]) => request<any>(`/editions/${encodeURIComponent(slug)}/gallery/reorder`, { method: 'PUT', body: JSON.stringify({ order }) }),
  deleteEditionGalleryImage: (slug: string, id: string) => request<void>(`/editions/${encodeURIComponent(slug)}/gallery/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getEditionContent: (slug: string) => request<any[]>(`/editions/${encodeURIComponent(slug)}/content`),
  updateEditionContent: (slug: string, section: string, content: string) =>
    request<any>(`/editions/${encodeURIComponent(slug)}/content/${encodeURIComponent(section)}`, { method: 'PUT', body: JSON.stringify({ content }) }),

  // Events (scoped per edizione tramite ?edition=slug; default = corrente)
  getEvents: (editionSlug?: string | null) => request<any[]>(withEdition('/events', editionSlug)),
  getEvent: (id: string) => request<any>(`/events/${id}`),
  createEvent: (data: any, editionSlug?: string | null) => request<any>(withEdition('/events', editionSlug), { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: string, data: any) => request<any>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id: string) => request<void>(`/events/${id}`, { method: 'DELETE' }),

  // Artists (globali)
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

  // Editorial (scoped per edizione)
  getEditorialPosts: (editionSlug?: string | null) => request<any[]>(withEdition('/editorial', editionSlug)),
  createEditorialPost: (data: any) => request<any>('/editorial', { method: 'POST', body: JSON.stringify(data) }),
  updateEditorialPost: (id: string, data: any) => request<any>(`/editorial/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEditorialPost: (id: string) => request<void>(`/editorial/${id}`, { method: 'DELETE' }),

  // Accrediti (scoped per edizione)
  createAccreditation: (data: any) => request<{ ticket_code: string; existing?: boolean }>('/accrediti', { method: 'POST', body: JSON.stringify(data) }),
  getAccreditationByCode: (code: string) => request<any>(`/accrediti/by-code/${encodeURIComponent(code)}`),
  listAccreditations: (editionSlug?: string | null) => request<any[]>(withEdition('/accrediti', editionSlug)),
  checkInAccreditation: (code: string) => request<any>(`/accrediti/${encodeURIComponent(code)}/check-in`, { method: 'POST' }),
  uncheckInAccreditation: (code: string) => request<any>(`/accrediti/${encodeURIComponent(code)}/uncheck-in`, { method: 'POST' }),
  deleteAccreditation: (id: string) => request<void>(`/accrediti/${id}`, { method: 'DELETE' }),

  // Spuntino delle 18 (scoped per edizione)
  getSpuntinoStatus: () => request<{ open: boolean; taken: number }>('/spuntino/status'),
  setSpuntinoStatus: (open: boolean) => request<{ open: boolean }>('/spuntino/status', { method: 'PUT', body: JSON.stringify({ open }) }),
  createSpuntinoBooking: (data: any) => request<{ id: string; seats: number; total_booked: number; email_sent: boolean }>('/spuntino', { method: 'POST', body: JSON.stringify(data) }),
  listSpuntinoBookings: (editionSlug?: string | null) => request<any[]>(withEdition('/spuntino', editionSlug)),
  updateSpuntinoBooking: (id: string, data: any) => request<any>(`/spuntino/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSpuntinoBooking: (id: string) => request<void>(`/spuntino/${id}`, { method: 'DELETE' }),

  // Menu (globale)
  getMenu: () => request<any[]>('/menu'),
  createMenuItem: (data: any) => request<any>('/menu', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id: string, data: any) => request<any>(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenuItem: (id: string) => request<void>(`/menu/${id}`, { method: 'DELETE' }),
  reorderMenu: (order: string[]) => request<any>('/menu/reorder', { method: 'PUT', body: JSON.stringify({ order }) }),

  // Categories (globali)
  getCategories: () => request<any[]>('/categories'),
  createCategory: (data: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  reorderCategories: (order: string[]) => request<any>('/categories/reorder', { method: 'PUT', body: JSON.stringify({ order }) }),
}
