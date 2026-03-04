// Categorie evento
export type EventCategory =
  | 'scrittura'
  | 'teatro'
  | 'fotografia'
  | 'pittura'
  | 'scultura'
  | 'grafica'
  | 'musica'
  | 'video'
  | 'video-ai'
  | 'vino'
  | 'cucina'
  | 'auto-epoca'
  | 'libri'

export type MacroCategory = 'arte' | 'musica' | 'video' | 'vino' | 'cucina' | 'auto-epoca' | 'libri'

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  scrittura: 'Scrittura',
  teatro: 'Teatro',
  fotografia: 'Fotografia',
  pittura: 'Pittura',
  scultura: 'Scultura',
  grafica: 'Grafica',
  musica: 'Musica',
  video: 'Proiezioni Video',
  'video-ai': 'Video AI',
  vino: 'Vino',
  cucina: 'Cucina',
  'auto-epoca': 'Auto d\'Epoca',
  libri: 'Libri',
}

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  scrittura: '#6B3FA0',
  teatro: '#8B2252',
  fotografia: '#2C3E6B',
  pittura: '#B8860B',
  scultura: '#5F6B4E',
  grafica: '#C4697C',
  musica: '#D4A017',
  video: '#4A7C8F',
  'video-ai': '#7B4F9D',
  vino: '#722F37',
  cucina: '#8B4513',
  'auto-epoca': '#4A4A4A',
  libri: '#2C6B4F',
}

export const MACRO_TO_CATEGORIES: Record<MacroCategory, EventCategory[]> = {
  arte: ['scrittura', 'teatro', 'fotografia', 'pittura', 'scultura', 'grafica'],
  musica: ['musica'],
  video: ['video', 'video-ai'],
  vino: ['vino'],
  cucina: ['cucina'],
  'auto-epoca': ['auto-epoca'],
  libri: ['libri'],
}

// Entità — snake_case per match diretto con API/D1
export interface Event {
  id: string
  title: string
  description: string
  date: string
  start_time: string
  end_time: string
  location: string
  category: EventCategory
  artist_id?: string
  exhibitor_id?: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Artist {
  id: string
  name: string
  bio: string
  category: EventCategory
  image_url: string
  website: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Exhibitor {
  id: string
  name: string
  description: string
  category: EventCategory
  contact_info: string
  notes: string
  created_at: string
  updated_at: string
}

export interface MediaItem {
  id: string
  title: string
  type: 'audio' | 'video' | 'image'
  url: string
  thumbnail_url: string
  artist_id?: string
  category: EventCategory
  duration?: number
  notes: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignee_id?: string
  due_date?: string
  category?: EventCategory
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  email: string
  phone: string
  notes: string
  created_at: string
  updated_at: string
}

export interface CanvasNode {
  id: string
  type: 'event' | 'artist' | 'exhibitor' | 'media' | 'group'
  entity_id?: string
  label: string
  position_x: number
  position_y: number
  width?: number
  height?: number
  data: string
  created_at: string
  updated_at: string
}

export interface CanvasEdge {
  id: string
  source: string
  target: string
  label?: string
  created_at: string
}

