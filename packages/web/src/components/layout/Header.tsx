import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EditionSelector } from '@/components/EditionSelector'

const PAGE_TITLES: Record<string, string> = {
  '/admin/programma': 'Programma',
  '/admin/artisti': 'Artisti',
  '/admin/team': 'Team & Task',
  '/admin/media': 'Libreria Media',
  '/admin/piano-editoriale': 'Piano Editoriale',
  '/admin/accrediti': 'Accrediti',
  '/admin/check-in': 'Check-in',
  '/admin/spuntino': 'Spuntino delle 18',
  '/admin/menu': 'Menù',
  '/admin/categorie': 'Categorie',
  '/admin/edizioni': 'Edizioni',
}

// Pagine che operano su una specifica edizione → mostro il selettore.
// Le altre (Artisti, Menù, Categorie, Team, Media, Edizioni) sono globali.
const SCOPED_PATHS = new Set([
  '/admin/programma',
  '/admin/artisti',
  '/admin/menu',
  '/admin/media',
  '/admin/accrediti',
  '/admin/check-in',
  '/admin/spuntino',
  '/admin/piano-editoriale',
])

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'COINCIDENZE'
  const showSelector = SCOPED_PATHS.has(location.pathname)

  return (
    <header className="flex h-14 items-center gap-2 sm:gap-4 border-b border-navy/10 bg-crema/80 px-3 sm:px-4 backdrop-blur-sm shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden shrink-0"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <h2 className="font-display text-base sm:text-lg font-semibold text-navy truncate min-w-0">{title}</h2>

      <div className="ml-auto flex items-center gap-2 shrink-0">
        {showSelector && <EditionSelector />}
      </div>
    </header>
  )
}
