import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, FileText, Loader2, MessageSquare, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePagesStore } from '@/stores/pagesStore'
import { useAdminEditionSlug, useEditionsStore } from '@/stores/editionsStore'
import { useCan } from '@/stores/authStore'
import type { PageListItem } from '@/types'
import { ancestorsOf, childrenOf, fmtWhen, pageTitle } from './tree'

/** Elenco degli Spunti dell'edizione scelta in alto: albero di pagine, ricerca ed etichette. */
export function SpuntiPage() {
  const { pages, loading, error, fetchPages, createPage } = usePagesStore()
  const canEdit = useCan('spunti.edit')
  const slug = useAdminEditionSlug()
  const edition = useEditionsStore((s) => s.editions.find((e) => e.slug === slug))
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const [closed, setClosed] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => { fetchPages(slug) }, [fetchPages, slug])
  useEffect(() => { setTag(null) }, [slug])

  const children = useMemo(() => childrenOf(pages), [pages])
  const tags = useMemo(() => {
    const count = new Map<string, number>()
    for (const p of pages) for (const t of p.tags) count.set(t, (count.get(t) ?? 0) + 1)
    return [...count.entries()].sort((a, b) => a[0].localeCompare(b[0], 'it'))
  }, [pages])

  const q = query.trim().toLowerCase()
  const filtering = q !== '' || tag !== null
  const results = filtering
    ? pages.filter((p) => (!tag || p.tags.includes(tag)) && (!q || p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q)))
    : []

  const newPage = async () => {
    setCreating(true)
    setCreateError('')
    try {
      const page = await createPage({ title: '' }, slug)
      navigate(`/admin/spunti/${page.id}`)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Pagina non creata')
      setCreating(false)
    }
  }

  const toggle = (id: string) => {
    const next = new Set(closed)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setClosed(next)
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <p className="text-sm text-ink-muted flex-1 min-w-[12rem]">
          Idee, appunti e proposte per {edition ? edition.name : 'questa edizione'}. Ogni pagina può avere sottopagine, etichette e commenti.
        </p>
        {canEdit && (
          <Button onClick={newPage} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Nuova pagina
          </Button>
        )}
      </div>
      {createError && <p className="text-sm text-bordeaux mb-3">{createError}</p>}

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca nei titoli e nei testi" className="pl-8" />
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map(([t, n]) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(tag === t ? null : t)}
              aria-pressed={tag === t}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                tag === t ? 'border-navy bg-navy text-white' : 'border-navy/15 bg-white/60 text-ink-light hover:border-navy/30'
              }`}
            >
              {t}<span className={tag === t ? 'text-white/70' : 'text-ink-muted'}>{n}</span>
              {tag === t && <X className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-bordeaux mb-4">{error}</p>}

      {loading && pages.length === 0 ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-navy/40" /></div>
      ) : pages.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-ink-muted">Ancora nessuna pagina{edition ? ` per ${edition.name}` : ''}.</p>
          {canEdit && <p className="text-sm text-ink-muted mt-1">Crea la prima con "Nuova pagina".</p>}
        </div>
      ) : filtering ? (
        <div className="rounded-xl border border-navy/10 bg-white/60 divide-y divide-navy/5">
          {results.length === 0 && <p className="px-4 py-6 text-sm text-ink-muted text-center">Nessuna pagina trovata.</p>}
          {results.map((p) => {
            const path = ancestorsOf(p.id, pages)
            return (
              <Link key={p.id} to={`/admin/spunti/${p.id}`} className="block px-4 py-3 hover:bg-white">
                {path.length > 0 && <p className="text-[11px] text-ink-muted truncate">{path.map((a) => pageTitle(a.title)).join(' / ')}</p>}
                <Row page={p} />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-navy/10 bg-white/60 py-1">
          <Tree parent={null} depth={0} kids={children} closed={closed} onToggle={toggle} />
        </div>
      )}
    </div>
  )
}

function Tree({ parent, depth, kids: tree, closed, onToggle }: {
  parent: string | null
  depth: number
  kids: Map<string | null, PageListItem[]>
  closed: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <ul>
      {(tree.get(parent) ?? []).map((p) => {
        const kids = tree.get(p.id) ?? []
        const open = !closed.has(p.id)
        return (
          <li key={p.id}>
            <div className="flex items-center gap-1 pr-3 hover:bg-white" style={{ paddingLeft: `${0.5 + depth * 1.1}rem` }}>
              {kids.length > 0 ? (
                <button
                  type="button"
                  onClick={() => onToggle(p.id)}
                  aria-label={open ? 'Chiudi le sottopagine' : 'Apri le sottopagine'}
                  aria-expanded={open}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-ink-muted hover:text-navy"
                >
                  <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} />
                </button>
              ) : (
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-navy/30"><FileText className="h-3.5 w-3.5" /></span>
              )}
              <Link to={`/admin/spunti/${p.id}`} className="flex-1 min-w-0 py-2.5">
                <Row page={p} />
              </Link>
            </div>
            {kids.length > 0 && open && <Tree parent={p.id} depth={depth + 1} kids={tree} closed={closed} onToggle={onToggle} />}
          </li>
        )
      })}
    </ul>
  )
}

function Row({ page }: { page: PageListItem }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug break-words ${page.title.trim() ? 'text-navy' : 'text-ink-muted italic'}`}>{pageTitle(page.title)}</p>
        {page.tags.length > 0 && (
          <p className="mt-0.5 text-[11px] text-viola truncate">{page.tags.join(' · ')}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2 text-[11px] text-ink-muted pt-0.5">
        {page.comment_count > 0 && (
          <span className="inline-flex items-center gap-0.5" title={`${page.comment_count} commenti`}>
            <MessageSquare className="h-3 w-3" />{page.comment_count}
          </span>
        )}
        <span className="hidden sm:inline">{fmtWhen(page.updated_at)}</span>
      </div>
    </div>
  )
}
