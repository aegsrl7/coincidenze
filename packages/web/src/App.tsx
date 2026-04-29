import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/components/RequireAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProgrammaPage } from '@/features/programma/ProgrammaPage'
import { TeamPage } from '@/features/team/TeamPage'
import { MediaPage } from '@/features/media/MediaPage'
import { ArtistsPage } from '@/features/artists/ArtistsPage'
import { PianoEditorialePage } from '@/features/editorial/PianoEditorialePage'
import { EditionPage } from '@/features/edition/EditionPage'
import { HomeRedirect } from '@/features/edition/HomeRedirect'
import { ProgrammaInstagramPage } from '@/features/edizione1/ProgrammaInstagramPage'
import { BigliettoPage } from '@/features/accrediti/BigliettoPage'
import { AdminAccreditiPage } from '@/features/accrediti/AdminAccreditiPage'
import { CheckInPage } from '@/features/accrediti/CheckInPage'
import { AdminSpuntinoPage } from '@/features/spuntino/AdminSpuntinoPage'
import { ArtistDetailPage } from '@/features/artists/ArtistDetailPage'
import { AdminMenuPage } from '@/features/menu/AdminMenuPage'
import { AdminCategoriesPage } from '@/features/categories/AdminCategoriesPage'
import { AdminEdizioniPage } from '@/features/editions/AdminEdizioniPage'
import { PrivacyPage } from '@/features/legal/PrivacyPage'
import { useAuthStore } from '@/stores/authStore'
import { useCategoriesStore } from '@/stores/categoriesStore'

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const fetchCategories = useCategoriesStore((s) => s.fetch)

  useEffect(() => {
    checkAuth()
    fetchCategories()
  }, [checkAuth, fetchCategories])

  return (
    <BrowserRouter>
      <Routes>
        {/* Pubblico — rotte statiche più specifiche prima */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/programma-instagram" element={<ProgrammaInstagramPage />} />
        <Route path="/edizione-1-v2" element={<Navigate to="/" replace />} />
        <Route path="/accrediti" element={<Navigate to="/" replace />} />
        <Route path="/spuntino" element={<Navigate to="/" replace />} />
        <Route path="/biglietto/:code" element={<BigliettoPage />} />
        <Route path="/artisti/:id" element={<ArtistDetailPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Edizioni (param dinamico full-segment, es. "edizione-1") */}
        <Route path="/:editionSlug" element={<EditionRoute />} />

        {/* Redirect legacy → /admin */}
        <Route path="/canvas" element={<Navigate to="/admin/programma" replace />} />
        <Route path="/programma" element={<Navigate to="/admin/programma" replace />} />
        <Route path="/team" element={<Navigate to="/admin/team" replace />} />
        <Route path="/artisti" element={<Navigate to="/admin/artisti" replace />} />
        <Route path="/media" element={<Navigate to="/admin/media" replace />} />
        <Route path="/piano-editoriale" element={<Navigate to="/admin/piano-editoriale" replace />} />

        {/* Admin (protetto) */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/admin" element={<Navigate to="/admin/programma" replace />} />
            <Route path="/admin/canvas" element={<Navigate to="/admin/programma" replace />} />
            <Route path="/admin/programma" element={<ProgrammaPage />} />
            <Route path="/admin/team" element={<TeamPage />} />
            <Route path="/admin/artisti" element={<ArtistsPage />} />
            <Route path="/admin/media" element={<MediaPage />} />
            <Route path="/admin/piano-editoriale" element={<PianoEditorialePage />} />
            <Route path="/admin/accrediti" element={<AdminAccreditiPage />} />
            <Route path="/admin/check-in" element={<CheckInPage />} />
            <Route path="/admin/spuntino" element={<AdminSpuntinoPage />} />
            <Route path="/admin/menu" element={<AdminMenuPage />} />
            <Route path="/admin/categorie" element={<AdminCategoriesPage />} />
            <Route path="/admin/edizioni" element={<AdminEdizioniPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

// React Router v7 non supporta param parziali nel segmento (es. /edizione-:slug),
// servono full-segment params. Usiamo /:editionSlug e validiamo dentro che sia
// un'edizione (slug del DB tipo "edizione-1"). Rotte non-edizione non-statiche
// finiscono qui e vengono reindirizzate alla home.
import { useParams } from 'react-router-dom'

function EditionRoute() {
  const { editionSlug } = useParams<{ editionSlug: string }>()
  const slug = editionSlug || ''
  if (!slug.startsWith('edizione-')) {
    return <Navigate to="/" replace />
  }
  return <EditionPage key={slug} slug={slug} />
}
