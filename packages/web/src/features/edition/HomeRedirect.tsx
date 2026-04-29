import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useEditionsStore } from '@/stores/editionsStore'

/**
 * Reindirizza la root `/` alla pagina dell'edizione corrente, letta dal DB.
 * Quando l'admin flippa is_current su una nuova edizione, qui cambia il target
 * automaticamente — nessun deploy necessario.
 */
export function HomeRedirect() {
  const fetch = useEditionsStore((s) => s.fetch)
  const current = useEditionsStore((s) => s.current)
  const editions = useEditionsStore((s) => s.editions)
  const loaded = useEditionsStore((s) => s.loaded)

  useEffect(() => { fetch() }, [fetch])

  if (!loaded) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy/40" />
      </div>
    )
  }

  // Se non c'è una corrente, fallback alla più recente per data
  const target = current ?? [...editions].sort((a, b) => b.year - a.year)[0]
  if (!target) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center px-6">
        <p className="text-sm text-ink-muted italic text-center">
          Nessuna edizione configurata.
        </p>
      </div>
    )
  }

  return <Navigate to={`/${target.slug}`} replace />
}
