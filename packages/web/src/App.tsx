import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { CanvasPage } from '@/features/canvas/CanvasPage'
import { ProgrammaPage } from '@/features/programma/ProgrammaPage'
import { TeamPage } from '@/features/team/TeamPage'
import { MediaPage } from '@/features/media/MediaPage'
import { useAuthStore } from '@/stores/authStore'

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/canvas" replace />} />
          <Route path="/canvas" element={<CanvasPage />} />
          <Route path="/programma" element={<ProgrammaPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/media" element={<MediaPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
