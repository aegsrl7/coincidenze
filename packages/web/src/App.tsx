import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/components/RequireAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { CanvasPage } from '@/features/canvas/CanvasPage'
import { ProgrammaPage } from '@/features/programma/ProgrammaPage'
import { TeamPage } from '@/features/team/TeamPage'
import { MediaPage } from '@/features/media/MediaPage'
import { ArtistsPage } from '@/features/artists/ArtistsPage'
import { PianoEditorialePage } from '@/features/editorial/PianoEditorialePage'
import { Edizione0Page } from '@/features/edizione0/Edizione0Page'
import { Edizione1Page } from '@/features/edizione1/Edizione1Page'
import { EdizioneV2Page } from '@/features/edizione1/EdizioneV2Page'
import { AccreditiFormPage } from '@/features/accrediti/AccreditiFormPage'
import { BigliettoPage } from '@/features/accrediti/BigliettoPage'
import { AdminAccreditiPage } from '@/features/accrediti/AdminAccreditiPage'
import { ArtistDetailPage } from '@/features/artists/ArtistDetailPage'
import { AdminMenuPage } from '@/features/menu/AdminMenuPage'
import { useAuthStore } from '@/stores/authStore'

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <Routes>
        {/* Pubblico */}
        <Route path="/" element={<Navigate to="/edizione-1" replace />} />
        <Route path="/edizione-0" element={<Edizione0Page />} />
        <Route path="/edizione-1" element={<Edizione1Page />} />
        <Route path="/edizione-1-v2" element={<EdizioneV2Page />} />
        <Route path="/accrediti" element={<AccreditiFormPage />} />
        <Route path="/biglietto/:code" element={<BigliettoPage />} />
        <Route path="/artisti/:id" element={<ArtistDetailPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Redirect legacy → /admin */}
        <Route path="/canvas" element={<Navigate to="/admin/canvas" replace />} />
        <Route path="/programma" element={<Navigate to="/admin/programma" replace />} />
        <Route path="/team" element={<Navigate to="/admin/team" replace />} />
        <Route path="/artisti" element={<Navigate to="/admin/artisti" replace />} />
        <Route path="/media" element={<Navigate to="/admin/media" replace />} />
        <Route path="/piano-editoriale" element={<Navigate to="/admin/piano-editoriale" replace />} />

        {/* Admin (protetto) */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/admin" element={<Navigate to="/admin/canvas" replace />} />
            <Route path="/admin/canvas" element={<CanvasPage />} />
            <Route path="/admin/programma" element={<ProgrammaPage />} />
            <Route path="/admin/team" element={<TeamPage />} />
            <Route path="/admin/artisti" element={<ArtistsPage />} />
            <Route path="/admin/media" element={<MediaPage />} />
            <Route path="/admin/piano-editoriale" element={<PianoEditorialePage />} />
            <Route path="/admin/accrediti" element={<AdminAccreditiPage />} />
            <Route path="/admin/menu" element={<AdminMenuPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/edizione-1" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
