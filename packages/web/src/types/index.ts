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
  | 'espositori'

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
  espositori: 'Espositori',
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
  'video-ai': '#00ACC1',
  vino: '#722F37',
  cucina: '#8B4513',
  'auto-epoca': '#4A4A4A',
  libri: '#2C6B4F',
  espositori: '#A0522D',
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
  artist_ids: string[]
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

// Piano Editoriale
export interface EditorialPost {
  id: string
  data: string
  fase: number
  tag: string
  emoji: string
  titolo: string
  descrizione: string
  caption_suggerita: string
  formato: string
  stato: 'da_fare' | 'in_progress' | 'pubblicato'
  canva_design_id: string | null
  artisti_coinvolti: string[]
  note: string
  created_at: string
  updated_at: string
}

export const FASE_LABELS: Record<number, string> = {
  1: 'Teaser',
  2: 'Artisti',
  3: 'Countdown',
}

export const FASE_COLORS: Record<number, string> = {
  1: '#7F77DD',
  2: '#1D9E75',
  3: '#EF9F27',
}

export const STATO_LABELS: Record<string, string> = {
  da_fare: 'Da fare',
  in_progress: 'In progress',
  pubblicato: 'Pubblicato',
}

export const STATO_COLORS: Record<string, string> = {
  da_fare: '#9CA3AF',
  in_progress: '#F59E0B',
  pubblicato: '#10B981',
}

// Edizione 0
export interface GalleryImage {
  id: string
  image_url: string
  caption: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ContentSection {
  id: string
  section: string
  content: string
  updated_at: string
}

// Accrediti
export interface Accreditation {
  id: string
  ticket_code: string
  name: string
  surname: string
  email: string
  phone: string
  cap: string
  birth_date: string
  consent_privacy: 0 | 1
  consent_newsletter: 0 | 1
  consent_photo: 0 | 1
  notes: string
  email_sent_at: string | null
  checked_in_at: string | null
  created_at: string
  updated_at: string
}

export interface AccreditationInput {
  name: string
  surname: string
  email: string
  phone?: string
  cap?: string
  birth_date?: string
  consent_privacy: boolean
  consent_newsletter: boolean
  consent_photo: boolean
  notes?: string
  // honeypot — se compilato il form viene rifiutato
  company?: string
}

// Menu
export interface MenuItem {
  id: string
  category: string
  name: string
  description: string
  price: string
  notes: string
  sort_order: number
  created_at: string
  updated_at: string
}

// Categoria dinamica (DB-backed)
export interface Category {
  id: string
  type: 'artist' | 'menu'
  slug: string
  label: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
}

