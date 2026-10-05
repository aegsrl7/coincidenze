import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ADMIN_NAV } from '@/lib/adminNav'

/** /admin apre la prima sezione permessa dal ruolo (es. il check-in per i volontari). */
export function AdminHome() {
  const permissions = useAuthStore((s) => s.permissions)
  const first = ADMIN_NAV.find((item) => permissions.includes(item.permission))
  if (first) return <Navigate to={first.to} replace />
  return (
    <div className="p-6 max-w-md">
      <p className="text-sm text-ink-light">
        Il tuo ruolo non dà accesso a nessuna sezione. Chiedi a un amministratore di assegnarti i permessi.
      </p>
    </div>
  )
}
