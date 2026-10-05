import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

/**
 * Protegge le rotte dell'area riservata. Con `permission` limita la pagina a chi
 * ha quel permesso: gli altri tornano a /admin, che apre la prima sezione permessa.
 */
export function RequireAuth({ permission }: { permission?: string }) {
  const { isAuthenticated, permissions, loading } = useAuthStore()
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

  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
