import { Menu, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PAGE_TITLES: Record<string, string> = {
  '/admin/canvas': 'Canvas',
  '/admin/programma': 'Programma',
  '/admin/artisti': 'Artisti',
  '/admin/team': 'Team & Task',
  '/admin/media': 'Libreria Media',
  '/admin/piano-editoriale': 'Piano Editoriale',
  '/admin/accrediti': 'Accrediti',
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'COINCIDENZE'

  return (
    <header className="flex h-14 items-center gap-4 border-b border-navy/10 bg-crema/80 px-4 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <h2 className="font-display text-lg font-semibold text-navy">{title}</h2>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Cerca..."
            className="w-56 pl-8"
          />
        </div>
      </div>
    </header>
  )
}
