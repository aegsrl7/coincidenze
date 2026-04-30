import type {
  Edition,
  Event,
  Artist,
  Exhibitor,
  MediaItem,
  Task,
  TeamMember,
  CanvasNode,
  CanvasEdge,
  EditorialPost,
  Accreditation,
  AccreditationInput,
  SpuntinoBooking,
  MenuItem,
  Category,
  GalleryImage,
  ContentSection,
} from '@/types'

const API_BASE = import.meta.env.DEV ? '/api' : 'https://api.coincidenze.org/api'

type JsonRecord = Record<string, unknown>

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
  getEditions: () => request<Edition[]>('/editions'),
  getCurrentEdition: () => request<Edition>('/editions/current'),
  getEdition: (slug: string) => request<Edition>(`/editions/${encodeURIComponent(slug)}`),
  createEdition: (data: JsonRecord) => request<Edition>('/editions', { method: 'POST', body: JSON.stringify(data) }),
  updateEdition: (id: string, data: JsonRecord) => request<Edition>(`/editions/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  setCurrentEdition: (id: string) => request<Edition>(`/editions/${encodeURIComponent(id)}/set-current`, { method: 'POST' }),
  deleteEdition: (id: string) => request<void>(`/editions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getEditionGallery: (slug: string) => request<GalleryImage[]>(`/editions/${encodeURIComponent(slug)}/gallery`),
  addEditionGalleryImage: (slug: string, data: JsonRecord) => request<GalleryImage>(`/editions/${encodeURIComponent(slug)}/gallery`, { method: 'POST', body: JSON.stringify(data) }),
  reorderEditionGallery: (slug: string, order: string[]) => request<{ ok: true }>(`/editions/${encodeURIComponent(slug)}/gallery/reorder`, { method: 'PUT', body: JSON.stringify({ order }) }),
  deleteEditionGalleryImage: (slug: string, id: string) => request<void>(`/editions/${encodeURIComponent(slug)}/gallery/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getEditionContent: (slug: string) => request<ContentSection[]>(`/editions/${encodeURIComponent(slug)}/content`),
  updateEditionContent: (slug: string, section: string, content: string) =>
    request<ContentSection>(`/editions/${encodeURIComponent(slug)}/content/${encodeURIComponent(section)}`, { method: 'PUT', body: JSON.stringify({ content }) }),

  // Events (scoped per edizione tramite ?edition=slug; default = corrente)
  getEvents: (editionSlug?: string | null) => request<Event[]>(withEdition('/events', editionSlug)),
  getEvent: (id: string) => request<Event>(`/events/${id}`),
  createEvent: (data: JsonRecord, editionSlug?: string | null) => request<Event>(withEdition('/events', editionSlug), { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: string, data: JsonRecord) => request<Event>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id: string) => request<void>(`/events/${id}`, { method: 'DELETE' }),

  // Artists (scoped per edizione)
  getArtists: (editionSlug?: string | null) => request<Artist[]>(withEdition('/artists', editionSlug)),
  getArtist: (id: string) => request<Artist>(`/artists/${id}`),
  createArtist: (data: JsonRecord, editionSlug?: string | null) => request<Artist>(withEdition('/artists', editionSlug), { method: 'POST', body: JSON.stringify(data) }),
  updateArtist: (id: string, data: JsonRecord) => request<Artist>(`/artists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteArtist: (id: string) => request<void>(`/artists/${id}`, { method: 'DELETE' }),

  // Exhibitors
  getExhibitors: () => request<Exhibitor[]>('/exhibitors'),
  createExhibitor: (data: JsonRecord) => request<Exhibitor>('/exhibitors', { method: 'POST', body: JSON.stringify(data) }),
  updateExhibitor: (id: string, data: JsonRecord) => request<Exhibitor>(`/exhibitors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExhibitor: (id: string) => request<void>(`/exhibitors/${id}`, { method: 'DELETE' }),

  // Media (scoped per edizione)
  getMedia: (editionSlug?: string | null) => request<MediaItem[]>(withEdition('/media', editionSlug)),
  createMedia: (data: JsonRecord, editionSlug?: string | null) => request<MediaItem>(withEdition('/media', editionSlug), { method: 'POST', body: JSON.stringify(data) }),
  updateMedia: (id: string, data: JsonRecord) => request<MediaItem>(`/media/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedia: (id: string) => request<void>(`/media/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: () => request<Task[]>('/tasks'),
  createTask: (data: JsonRecord) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: JsonRecord) => request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  // Team
  getTeamMembers: () => request<TeamMember[]>('/team'),
  createTeamMember: (data: JsonRecord) => request<TeamMember>('/team', { method: 'POST', body: JSON.stringify(data) }),
  updateTeamMember: (id: string, data: JsonRecord) => request<TeamMember>(`/team/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTeamMember: (id: string) => request<void>(`/team/${id}`, { method: 'DELETE' }),

  // Canvas
  getCanvasNodes: () => request<CanvasNode[]>('/canvas/nodes'),
  getCanvasEdges: () => request<CanvasEdge[]>('/canvas/edges'),
  saveCanvas: (data: { nodes: JsonRecord[]; edges: JsonRecord[] }) => request<{ ok: true }>('/canvas', { method: 'PUT', body: JSON.stringify(data) }),

  // Editorial (scoped per edizione)
  getEditorialPosts: (editionSlug?: string | null) => request<EditorialPost[]>(withEdition('/editorial', editionSlug)),
  createEditorialPost: (data: JsonRecord) => request<EditorialPost>('/editorial', { method: 'POST', body: JSON.stringify(data) }),
  updateEditorialPost: (id: string, data: JsonRecord) => request<EditorialPost>(`/editorial/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEditorialPost: (id: string) => request<void>(`/editorial/${id}`, { method: 'DELETE' }),

  // Accrediti (scoped per edizione)
  createAccreditation: (data: AccreditationInput) => request<{
    ticket_code: string
    existing?: boolean
    email_sent?: boolean
    ticket?: {
      id: string
      edition_id: string
      ticket_code: string
      name: string
      surname: string
      checked_in_at: string | null
      created_at: string
    }
  }>('/accrediti', { method: 'POST', body: JSON.stringify(data) }),
  getAccreditationByCode: (code: string) => request<Accreditation>(`/accrediti/by-code/${encodeURIComponent(code)}`),
  listAccreditations: (editionSlug?: string | null) => request<Accreditation[]>(withEdition('/accrediti', editionSlug)),
  checkInAccreditation: (code: string) => request<{ accreditation: Accreditation; already_checked_in: boolean }>(`/accrediti/${encodeURIComponent(code)}/check-in`, { method: 'POST' }),
  uncheckInAccreditation: (code: string) => request<{ accreditation: Accreditation }>(`/accrediti/${encodeURIComponent(code)}/uncheck-in`, { method: 'POST' }),
  deleteAccreditation: (id: string) => request<void>(`/accrediti/${id}`, { method: 'DELETE' }),

  // Spuntino delle 18 (scoped per edizione)
  getSpuntinoStatus: () => request<{ open: boolean; taken: number; capacity: number; remaining: number }>('/spuntino/status'),
  setSpuntinoStatus: (open: boolean) => request<{ open: boolean }>('/spuntino/status', { method: 'PUT', body: JSON.stringify({ open }) }),
  createSpuntinoBooking: (data: JsonRecord) => request<{ id: string; seats: number; total_booked: number; email_sent: boolean }>('/spuntino', { method: 'POST', body: JSON.stringify(data) }),
  listSpuntinoBookings: (editionSlug?: string | null) => request<SpuntinoBooking[]>(withEdition('/spuntino', editionSlug)),
  updateSpuntinoBooking: (id: string, data: JsonRecord) => request<SpuntinoBooking>(`/spuntino/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSpuntinoBooking: (id: string) => request<void>(`/spuntino/${id}`, { method: 'DELETE' }),

  // Menu (scoped per edizione)
  getMenu: (editionSlug?: string | null) => request<MenuItem[]>(withEdition('/menu', editionSlug)),
  createMenuItem: (data: JsonRecord, editionSlug?: string | null) => request<MenuItem>(withEdition('/menu', editionSlug), { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id: string, data: JsonRecord) => request<MenuItem>(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenuItem: (id: string) => request<void>(`/menu/${id}`, { method: 'DELETE' }),
  reorderMenu: (order: string[]) => request<{ ok: true }>('/menu/reorder', { method: 'PUT', body: JSON.stringify({ order }) }),

  // Categories (globali)
  getCategories: () => request<Category[]>('/categories'),
  createCategory: (data: JsonRecord) => request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: JsonRecord) => request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  reorderCategories: (order: string[]) => request<{ ok: true }>('/categories/reorder', { method: 'PUT', body: JSON.stringify({ order }) }),
}
