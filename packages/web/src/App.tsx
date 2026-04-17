import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { CanvasPage } from '@/features/canvas/CanvasPage'
import { ProgrammaPage } from '@/features/programma/ProgrammaPage'
import { TeamPage } from '@/features/team/TeamPage'
import { MediaPage } from '@/features/media/MediaPage'
import { ArtistsPage } from '@/features/artists/ArtistsPage'
import { PianoEditorialePage } from '@/features/editorial/PianoEditorialePage'
import { Edizione0Page } from '@/features/edizione0/Edizione0Page'
import { Edizione1Page } from '@/features/edizione1/Edizione1Page'
import { useAuthStore } from '@/stores/authStore'

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/edizione-0" element={<Edizione0Page />} />
        <Route path="/edizione-1" element={<Edizione1Page />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/canvas" replace />} />
          <Route path="/canvas" element={<CanvasPage />} />
          <Route path="/programma" element={<ProgrammaPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/artisti" element={<ArtistsPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/piano-editoriale" element={<PianoEditorialePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
