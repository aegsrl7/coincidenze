import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useEditionsStore } from '@/stores/editionsStore'
import { useAuthStore } from '@/stores/authStore'
import { CurrentEdition } from './CurrentEdition'
import { PastEdition } from './PastEdition'

/**
 * Dispatcher: l'edizione corrente (is_current=1) usa l'hero foto pieno schermo
 * anche se l'evento è già passato — la pagina pubblica resta quella "principale"
 * finché l'admin non promuove un'edizione nuova come corrente. Le altre edizioni
 * vanno in archive mode (compatto).
 */
export function EditionPage({ slug }: { slug: string }) {
  const editions = useEditionsStore((s) => s.editions)
  const editionsLoaded = useEditionsStore((s) => s.loaded)
  const fetchEditions = useEditionsStore((s) => s.fetch)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const checkAuth = useAuthStore((s) => s.checkAuth)

  useEffect(() => {
    checkAuth()
    fetchEditions()
  }, [checkAuth, fetchEditions])

  const edition = editions.find((e) => e.slug === slug) || null

  if (!editionsLoaded) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy/40" />
      </div>
    )
  }

  if (!edition) {
    return <Navigate to="/" replace />
  }

  return edition.is_current === 1
    ? <CurrentEdition edition={edition} isAuthenticated={isAuthenticated} />
    : <PastEdition edition={edition} isAuthenticated={isAuthenticated} />
}
