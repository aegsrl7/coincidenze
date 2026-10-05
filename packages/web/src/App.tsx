import { useEffect, type ReactNode } from 'react'
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
import { ProgrammaInstagramPage } from '@/features/programma/ProgrammaInstagramPage'
import { BigliettoPage } from '@/features/accrediti/BigliettoPage'
import { AccreditiGate } from '@/features/accrediti/AccreditiGate'
import { AdminAccreditiPage } from '@/features/accrediti/AdminAccreditiPage'
import { CheckInPage } from '@/features/accrediti/CheckInPage'
import { AdminSpuntinoPage } from '@/features/spuntino/AdminSpuntinoPage'
import { SpuntinoGate } from '@/features/spuntino/SpuntinoGate'
import { ArtistDetailPage } from '@/features/artists/ArtistDetailPage'
import { AdminMenuPage } from '@/features/menu/AdminMenuPage'
import { AdminCategoriesPage } from '@/features/categories/AdminCategoriesPage'
import { AdminEdizioniPage } from '@/features/editions/AdminEdizioniPage'
import { PrivacyPage } from '@/features/legal/PrivacyPage'
import { SetPasswordPage } from '@/features/auth/SetPasswordPage'
import { AccountPage } from '@/features/auth/AccountPage'
import { UtentiPage } from '@/features/users/UtentiPage'
import { RuoliPage } from '@/features/users/RuoliPage'
import { AdminHome } from '@/components/AdminHome'
import { ADMIN_NAV } from '@/lib/adminNav'
import { useAuthStore } from '@/stores/authStore'
import { useCategoriesStore } from '@/stores/categoriesStore'

const ADMIN_PAGES: Record<string, ReactNode> = {
  '/admin/programma': <ProgrammaPage />,
  '/admin/artisti': <ArtistsPage />,
  '/admin/accrediti': <AdminAccreditiPage />,
  '/admin/check-in': <CheckInPage />,
  '/admin/spuntino': <AdminSpuntinoPage />,
  '/admin/menu': <AdminMenuPage />,
  '/admin/categorie': <AdminCategoriesPage />,
  '/admin/team': <TeamPage />,
  '/admin/media': <MediaPage />,
  '/admin/piano-editoriale': <PianoEditorialePage />,
  '/admin/edizioni': <AdminEdizioniPage />,
  '/admin/utenti': <UtentiPage />,
  '/admin/ruoli': <RuoliPage />,
}

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
        {/* Le forme pubbliche si attivano dal flag accrediti_open/spuntino_open dell'edizione corrente */}
        <Route path="/accrediti" element={<AccreditiGate />} />
        <Route path="/spuntino" element={<SpuntinoGate />} />
        <Route path="/biglietto/:code" element={<BigliettoPage />} />
        <Route path="/artisti/:id" element={<ArtistDetailPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Link di invito e di reset password mandati via email */}
        <Route path="/accesso/:token" element={<SetPasswordPage />} />
        {/* Edizioni (param dinamico full-segment, es. "edizione-1") */}
        <Route path="/:editionSlug" element={<EditionRoute />} />

        {/* Redirect legacy → /admin */}
        <Route path="/canvas" element={<Navigate to="/admin/programma" replace />} />
        <Route path="/programma" element={<Navigate to="/admin/programma" replace />} />
        <Route path="/team" element={<Navigate to="/admin/team" replace />} />
        <Route path="/artisti" element={<Navigate to="/admin/artisti" replace />} />
        <Route path="/media" element={<Navigate to="/admin/media" replace />} />
        <Route path="/piano-editoriale" element={<Navigate to="/admin/piano-editoriale" replace />} />

        {/* Area riservata: ogni sezione richiede il permesso indicato in lib/adminNav.ts */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/canvas" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/account" element={<AccountPage />} />
            {ADMIN_NAV.map((item) => (
              <Route key={item.to} element={<RequireAuth permission={item.permission} />}>
                <Route path={item.to} element={ADMIN_PAGES[item.to]} />
              </Route>
            ))}
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
