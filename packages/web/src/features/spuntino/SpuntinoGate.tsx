import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useEditionsStore } from '@/stores/editionsStore'
import { SpuntinoPage } from './SpuntinoPage'

/**
 * Mostra la form spuntino solo se l'edizione corrente ha `spuntino_open=1`.
 */
export function SpuntinoGate() {
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

  if (!current || current.spuntino_open !== 1) {
    return <Navigate to="/" replace />
  }

  return <SpuntinoPage />
}
