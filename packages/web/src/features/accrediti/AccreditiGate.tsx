import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useEditionsStore } from '@/stores/editionsStore'
import { AccreditiFormPage } from './AccreditiFormPage'

/**
 * Mostra la form accrediti solo se l'edizione corrente ha `accrediti_open=1`.
 * Quando l'admin flippa il flag (es. per l'edizione 2027), la rotta si attiva
 * automaticamente — nessun deploy necessario.
 */
export function AccreditiGate() {
  const fetch = useEditionsStore((s) => s.fetch)
  const current = useEditionsStore((s) => s.current)
  const loaded = useEditionsStore((s) => s.loaded)

  useEffect(() => { fetch() }, [fetch])

  if (!loaded) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy/40" />
      </div>
    )
  }

  if (!current || current.accrediti_open !== 1) {
    return <Navigate to="/" replace />
  }

  return <AccreditiFormPage />
}
