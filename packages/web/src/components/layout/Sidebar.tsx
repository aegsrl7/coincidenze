import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  Calendar,
  Users,
  Music,
  LogIn,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { LoginDialog } from '@/features/auth/LoginDialog'

const navItems = [
  { to: '/canvas', icon: LayoutGrid, label: 'Canvas' },
  { to: '/programma', icon: Calendar, label: 'Programma' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/media', icon: Music, label: 'Media' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { isAuthenticated, logout } = useAuthStore()
  const [showLogin, setShowLogin] = useState(false)

  return (
    <>
      {/* Overlay mobile */}
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
        {/* Logo */}
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

        {/* Nav */}
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
        </nav>

        {/* Auth + Footer */}
        <div className="border-t border-navy/10 p-4 space-y-3">
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-ink-light hover:text-bordeaux"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              Esci
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-ink-light hover:text-navy"
              onClick={() => setShowLogin(true)}
            >
              <LogIn className="h-4 w-4" />
              Accedi
            </Button>
          )}
          <p className="text-xs text-ink-muted">
            Edizione 1 — 25 Aprile 2026
          </p>
          <p className="text-xs text-ink-muted">
            Marsam Locanda, Bene Vagienna
          </p>
        </div>
      </aside>

      {showLogin && <LoginDialog open={showLogin} onClose={() => setShowLogin(false)} />}
    </>
  )
}
