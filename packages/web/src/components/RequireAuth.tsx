import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types'

/**
 * Protegge le rotte admin. Con `roles` limita l'accesso a quei ruoli: chi è
 * loggato con un ruolo diverso torna a /admin (programma, visibile a tutti).
 */
export function RequireAuth({ roles }: { roles?: UserRole[] }) {
  const { isAuthenticated, role, loading } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige">
        <Loader2 className="h-6 w-6 animate-spin text-navy/50" />
      </div>
    )
  }

  if (!isAuthenticated) {
    const from = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?from=${from}`} replace />
  }

  if (roles && (!role || !roles.includes(role))) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
