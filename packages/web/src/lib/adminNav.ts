import {
  Calendar,
  Users,
  User,
  Music,
  FileText,
  Ticket,
  ScanLine,
  Utensils,
  UtensilsCrossed,
  Tag,
  Layers,
  UserCog,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export interface AdminNavItem {
  to: string
  icon: LucideIcon
  label: string
  /** Permesso che serve per vedere la sezione (catalogo nell'API) */
  permission: string
}

/** Sezioni dell'area riservata, nell'ordine della sidebar. */
export const ADMIN_NAV: AdminNavItem[] = [
  { to: '/admin/programma', icon: Calendar, label: 'Programma', permission: 'programma.view' },
  { to: '/admin/artisti', icon: User, label: 'Artisti', permission: 'artisti.view' },
  { to: '/admin/accrediti', icon: Ticket, label: 'Accrediti', permission: 'accrediti.view' },
  { to: '/admin/check-in', icon: ScanLine, label: 'Check-in', permission: 'accrediti.checkin' },
  { to: '/admin/spuntino', icon: UtensilsCrossed, label: 'Spuntino 18', permission: 'spuntino.view' },
  { to: '/admin/menu', icon: Utensils, label: 'Menù', permission: 'menu.edit' },
  { to: '/admin/categorie', icon: Tag, label: 'Categorie', permission: 'categorie.edit' },
  { to: '/admin/team', icon: Users, label: 'Team', permission: 'team.view' },
  { to: '/admin/media', icon: Music, label: 'Media', permission: 'media.view' },
  { to: '/admin/piano-editoriale', icon: FileText, label: 'Piano Editoriale', permission: 'editoriale.view' },
  { to: '/admin/edizioni', icon: Layers, label: 'Edizioni', permission: 'edizioni.edit' },
  { to: '/admin/utenti', icon: UserCog, label: 'Utenti', permission: 'utenti.manage' },
  { to: '/admin/ruoli', icon: ShieldCheck, label: 'Ruoli e permessi', permission: 'utenti.manage' },
]
