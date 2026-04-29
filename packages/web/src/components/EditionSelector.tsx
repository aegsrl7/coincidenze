import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, Calendar } from 'lucide-react'
import { useEditionsStore } from '@/stores/editionsStore'

/**
 * Selettore "edizione su cui stai lavorando" — dropdown nell'header admin.
 * Filtra programma, accrediti, spuntino, piano editoriale per l'edizione scelta.
 * Default: edizione corrente (is_current=1).
 */
export function EditionSelector() {
  const editions = useEditionsStore((s) => s.editions)
  const adminSlug = useEditionsStore((s) => s.adminSlug)
  const setAdminSlug = useEditionsStore((s) => s.setAdminSlug)
  const fetchEditions = useEditionsStore((s) => s.fetch)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchEditions() }, [fetchEditions])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (editions.length === 0) return null

  const active = editions.find((e) => e.slug === adminSlug) || editions.find((e) => e.is_current === 1) || editions[0]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-md border border-navy/15 bg-white/60 hover:bg-white text-navy transition-colors"
        title="Edizione su cui stai lavorando"
      >
        <Calendar className="h-3.5 w-3.5 text-viola" />
        <span className="truncate max-w-[120px] sm:max-w-none">{active.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-lg border border-navy/10 bg-crema shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-navy/10">
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">Edizione attiva</p>
          </div>
          <ul className="py-1 max-h-80 overflow-auto">
            {editions.map((ed) => {
              const isActive = ed.slug === adminSlug
              return (
                <li key={ed.id}>
                  <button
                    onClick={() => {
                      setAdminSlug(ed.slug)
                      setOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-navy/5 transition-colors"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="font-medium text-navy">{ed.name}</span>
                      <span className="ml-1.5 text-xs text-ink-muted">{ed.year}</span>
                      {ed.is_current === 1 && <span className="ml-1.5 text-[10px] text-viola">corrente</span>}
                    </span>
                    {isActive && <Check className="h-3.5 w-3.5 text-viola shrink-0" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
