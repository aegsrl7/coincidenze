import { NavLink } from 'react-router-dom'
import {
  Calendar,
  Users,
  User,
  Music,
  Archive,
  LogOut,
  ExternalLink,
  X,
  FileText,
  Ticket,
  Utensils,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

const navItems = [
  { to: '/admin/programma', icon: Calendar, label: 'Programma' },
  { to: '/admin/artisti', icon: User, label: 'Artisti' },
  { to: '/admin/accrediti', icon: Ticket, label: 'Accrediti' },
  { to: '/admin/menu', icon: Utensils, label: 'Menù' },
  { to: '/admin/categorie', icon: Tag, label: 'Categorie' },
  { to: '/admin/team', icon: Users, label: 'Team' },
  { to: '/admin/media', icon: Music, label: 'Media' },
  { to: '/admin/piano-editoriale', icon: FileText, label: 'Piano Editoriale' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const logout = useAuthStore((s) => s.logout)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-navy/10 bg-crema transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-5 pb-4">
          <img
            src="/logo-coincidenze.png"
            alt="COINCIDENZE"
            className="h-10 w-auto"
          />
          <button onClick={onClose} className="lg:hidden text-ink-muted hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-navy text-white'
                    : 'text-ink-light hover:bg-beige-dark hover:text-navy'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}

          <div className="pt-3 mt-3 border-t border-navy/10">
            <p className="px-3 text-[11px] uppercase tracking-wider text-ink-muted mb-1.5">
              Pubblico
            </p>
            <a
              href="/edizione-1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink-light hover:bg-beige-dark hover:text-navy transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Edizione 1
            </a>
            <a
              href="/edizione-0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink-light hover:bg-beige-dark hover:text-navy transition-colors"
            >
              <Archive className="h-4 w-4" />
              Edizione 0
            </a>
          </div>
        </nav>

        <div className="border-t border-navy/10 p-4 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-ink-light hover:text-bordeaux"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Esci
          </Button>
          <p className="text-xs text-ink-muted">Edizione 1 — 25 Aprile 2026</p>
          <p className="text-xs text-ink-muted">Marsam Locanda, Bene Vagienna</p>
        </div>
      </aside>
    </>
  )
}
