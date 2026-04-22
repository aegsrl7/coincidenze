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
import { Edizione0Page } from '@/features/edizione0/Edizione0Page'
import { Edizione1Page } from '@/features/edizione1/Edizione1Page'
import { ProgrammaInstagramPage } from '@/features/edizione1/ProgrammaInstagramPage'
import { AccreditiFormPage } from '@/features/accrediti/AccreditiFormPage'
import { BigliettoPage } from '@/features/accrediti/BigliettoPage'
import { AdminAccreditiPage } from '@/features/accrediti/AdminAccreditiPage'
import { CheckInPage } from '@/features/accrediti/CheckInPage'
import { SpuntinoPage } from '@/features/spuntino/SpuntinoPage'
import { AdminSpuntinoPage } from '@/features/spuntino/AdminSpuntinoPage'
import { ArtistDetailPage } from '@/features/artists/ArtistDetailPage'
import { AdminMenuPage } from '@/features/menu/AdminMenuPage'
import { AdminCategoriesPage } from '@/features/categories/AdminCategoriesPage'
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
        {/* Pubblico */}
        <Route path="/" element={<Navigate to="/edizione-1" replace />} />
        <Route path="/edizione-0" element={<Edizione0Page />} />
        <Route path="/edizione-1" element={<Edizione1Page />} />
        <Route path="/programma-instagram" element={<ProgrammaInstagramPage />} />
        <Route path="/edizione-1-v2" element={<Navigate to="/edizione-1" replace />} />
        <Route path="/accrediti" element={<AccreditiFormPage />} />
        <Route path="/spuntino" element={<SpuntinoPage />} />
        <Route path="/biglietto/:code" element={<BigliettoPage />} />
        <Route path="/artisti/:id" element={<ArtistDetailPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/login" element={<LoginPage />} />

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
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/edizione-1" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
