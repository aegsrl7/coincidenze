import { NavLink } from 'react-router-dom'
import { LogOut, ExternalLink, X, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useEditionsStore } from '@/stores/editionsStore'
import { ADMIN_NAV } from '@/lib/adminNav'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const permissions = useAuthStore((s) => s.permissions)
  // Solo le sezioni permesse dal ruolo (le stesse rotte sono protette in App.tsx e nell'API)
  const visibleItems = ADMIN_NAV.filter((item) => permissions.includes(item.permission))

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
          {visibleItems.map((item) => (
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

          <PublicEditionLinks />
        </nav>

        <div className="border-t border-navy/10 p-4 space-y-3">
          {user && (
            <NavLink
              to="/admin/account"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
                  isActive ? 'bg-navy text-white' : 'text-ink-light hover:bg-beige-dark hover:text-navy'
                )
              }
              title="Il mio account"
            >
              <KeyRound className="h-4 w-4 shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-medium truncate">{user.name}</span>
                <span className="block text-xs opacity-75 truncate">{user.role.name}</span>
              </span>
            </NavLink>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-ink-light hover:text-bordeaux"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Esci
          </Button>
          <FooterMeta />
        </div>
      </aside>
    </>
  )
}

function FooterMeta() {
  const current = useEditionsStore((s) => s.current)
  if (!current) return null
  return (
    <>
      <p className="text-xs text-ink-muted">{current.name} — {current.event_date}</p>
      <p className="text-xs text-ink-muted">{current.hero_location}</p>
    </>
  )
}

function PublicEditionLinks() {
  const editions = useEditionsStore((s) => s.editions)
  const fetchEditions = useEditionsStore((s) => s.fetch)
  if (editions.length === 0) {
    fetchEditions()
    return null
  }
  return (
    <div className="pt-3 mt-3 border-t border-navy/10">
      <p className="px-3 text-[11px] uppercase tracking-wider text-ink-muted mb-1.5">
        Pubblico
      </p>
      {editions.map((ed) => (
        <a
          key={ed.id}
          href={`/${ed.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink-light hover:bg-beige-dark hover:text-navy transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          {ed.name}
          {ed.is_current === 1 && <span className="text-[10px] text-viola ml-auto">●</span>}
        </a>
      ))}
    </div>
  )
}
