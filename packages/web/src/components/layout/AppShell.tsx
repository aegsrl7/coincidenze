import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { enableAppMode } from '@/lib/pwa'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Area riservata installabile come app (manifest + service worker)
  useEffect(() => { enableAppMode() }, [])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-beige">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
