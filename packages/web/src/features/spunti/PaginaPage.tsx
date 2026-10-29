import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Editor } from '@tiptap/react'
import { ArrowLeft, ChevronRight, FileText, Loader2, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { usePagesStore } from '@/stores/pagesStore'
import { useCan } from '@/stores/authStore'
import type { Page } from '@/types'
import { PageEditor, type EditorChange } from './PageEditor'
import { PageComments, TextThreads, ThreadDialog, usePageComments } from './Comments'
import { locate, type Anchor, type AnchoredThread } from './commentAnchors'
import { ancestorsOf, childrenOf, countDescendants, fmtWhen, pageTitle } from './tree'

type Status = 'saved' | 'dirty' | 'saving' | 'error'
interface Draft { title: string; tags: string[]; json: string; text: string }

const SAVE_DELAY = 1200

/** La rotta rimonta la pagina a ogni cambio di id: stato e salvataggi non si mescolano tra pagine */
export function PaginaRoute() {
  const { id = '' } = useParams<{ id: string }>()
  return <PaginaPage key={id} id={id} />
}

function PaginaPage({ id }: { id: string }) {
  const navigate = useNavigate()
  const { pages, editionSlug, fetchPages, fetchPage, savePage, createPage, deletePage } = usePagesStore()
  const canEdit = useCan('spunti.edit')
  const canDelete = useCan('spunti.delete')

  const [page, setPage] = useState<Page | null>(null)
  const [loadError, setLoadError] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState<Status>('saved')
  const [conflict, setConflict] = useState<Page | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  // Commenti: in fondo e sul testo (pezzi evidenziati nell'editor)
  const comments = usePageComments(id)
  const [openThread, setOpenThread] = useState<string | null>(null)
  const [newAnchor, setNewAnchor] = useState<Anchor | null>(null)
  const [docTick, setDocTick] = useState(0)

  // Salvataggio automatico: l'ultima bozza, la versione del server su cui si basa, un solo salvataggio alla volta
  const draft = useRef<Draft | null>(null)
  const version = useRef(0)
  const dirty = useRef(false)
  const saving = useRef(false)
  const blocked = useRef(false) // conflitto aperto: niente salvataggi finché l'utente non sceglie
  const timer = useRef<number | undefined>(undefined)
  const editorRef = useRef<Editor | null>(null)

  useEffect(() => {
    let alive = true
    fetchPage(id)
      .then((p) => {
        if (!alive) return
        setPage(p)
        setTitle(p.title)
        setTags(p.tags)
        draft.current = { title: p.title, tags: p.tags, json: p.content_json, text: p.content_text }
        version.current = p.version
      })
      .catch((e) => alive && setLoadError(e instanceof Error ? e.message : 'Pagina non trovata'))
    return () => { alive = false }
  }, [id, fetchPage])

  // Albero dell'edizione della pagina: percorso, sottopagine ed etichette già usate
  useEffect(() => {
    if (page && page.edition_slug !== editionSlug) fetchPages(page.edition_slug)
  }, [page, editionSlug, fetchPages])

  const save = useCallback(async () => {
    window.clearTimeout(timer.current)
    if (!draft.current || blocked.current || !dirty.current) return
    if (saving.current) {
      timer.current = window.setTimeout(() => void save(), SAVE_DELAY)
      return
    }
    saving.current = true
    dirty.current = false
    setStatus('saving')
    const d = draft.current
    try {
      const res = await savePage(id, { title: d.title, tags: d.tags, content_json: d.json, content_text: d.text, version: version.current })
      if (res.conflict) {
        blocked.current = true
        dirty.current = true
        setConflict(res.page)
        setStatus('dirty')
      } else {
        version.current = res.page.version
        setPage(res.page)
        setStatus(dirty.current ? 'dirty' : 'saved')
        if (dirty.current) timer.current = window.setTimeout(() => void save(), SAVE_DELAY)
      }
    } catch {
      dirty.current = true
      setStatus('error')
    } finally {
      saving.current = false
    }
  }, [id, savePage])

  const change = useCallback((patch: Partial<Draft>) => {
    if (!draft.current) return
    draft.current = { ...draft.current, ...patch }
    dirty.current = true
    setStatus('dirty')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void save(), SAVE_DELAY)
  }, [save])

  // Uscendo dalla pagina si salva subito; chiudendo la scheda con modifiche in sospeso il browser avvisa
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) e.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
      if (dirty.current && !blocked.current) void save()
    }
  }, [save])

  const onEditorChange = useCallback((c: EditorChange) => {
    change({ json: c.json, text: c.text })
    setDocTick((t) => t + 1)
  }, [change])
  const onEditorReady = useCallback((e: Editor) => {
    editorRef.current = e
    setDocTick((t) => t + 1)
  }, [])

  const anchored = useMemo<(AnchoredThread & { resolved: boolean })[]>(() => (comments.list ?? [])
    .filter((c) => c.anchor_quote && !c.parent_id)
    .map((c) => ({ id: c.id, quote: c.anchor_quote!, prefix: c.anchor_prefix ?? '', suffix: c.anchor_suffix ?? '', resolved: !!c.resolved_at })), [comments.list])
  const openThreads = useMemo(() => anchored.filter((t) => !t.resolved), [anchored])
  const located = useMemo(() => {
    void docTick // si ricalcola quando cambia il testo
    const doc = editorRef.current?.state.doc
    return doc ? new Set(locate(doc, anchored).keys()) : new Set<string>()
  }, [anchored, docTick])
  const goToThread = (threadId: string) => {
    document.querySelector(`[data-thread="${threadId}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setOpenThread(threadId)
  }

  const takeTheirs = () => {
    if (!conflict) return
    editorRef.current?.commands.setContent(conflict.content_json ? JSON.parse(conflict.content_json) : '', { emitUpdate: false })
    setTitle(conflict.title)
    setTags(conflict.tags)
    draft.current = { title: conflict.title, tags: conflict.tags, json: conflict.content_json, text: conflict.content_text }
    version.current = conflict.version
    setPage(conflict)
    blocked.current = false
    dirty.current = false
    setConflict(null)
    setStatus('saved')
  }

  const keepMine = () => {
    if (!conflict) return
    version.current = conflict.version
    blocked.current = false
    dirty.current = true
    setConflict(null)
    void save()
  }

  const children = useMemo(() => childrenOf(pages), [pages])
  const subpages = children.get(id) ?? []
  const path = useMemo(() => ancestorsOf(id, pages), [id, pages])
  const knownTags = useMemo(() => [...new Set(pages.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, 'it')), [pages])

  const newSubpage = async () => {
    setBusy(true)
    try {
      await save()
      const sub = await createPage({ title: '', parent_id: id })
      navigate(`/admin/spunti/${sub.id}`)
    } catch {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    dirty.current = false
    window.clearTimeout(timer.current)
    try {
      await deletePage(id)
      navigate(page?.parent_id ? `/admin/spunti/${page.parent_id}` : '/admin/spunti', { replace: true })
    } catch {
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  if (loadError) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl">
        <BackLink />
        <p className="text-sm text-bordeaux">{loadError}</p>
      </div>
    )
  }
  if (!page) {
    return <div className="py-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-navy/40" /></div>
  }

  const descendants = countDescendants(id, children)

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-4">
        <nav className="flex-1 min-w-0 flex items-center gap-1 text-sm text-ink-muted overflow-hidden" aria-label="Percorso">
          <Link to="/admin/spunti" className="inline-flex items-center gap-1 shrink-0 hover:text-navy">
            <ArrowLeft className="h-4 w-4" />Spunti
          </Link>
          {path.map((p) => (
            <span key={p.id} className="flex items-center gap-1 min-w-0">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-navy/30" />
              <Link to={`/admin/spunti/${p.id}`} className="truncate hover:text-navy">{pageTitle(p.title)}</Link>
            </span>
          ))}
        </nav>
        {canDelete && (
          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} className="shrink-0 hover:text-bordeaux hover:border-bordeaux/40" aria-label="Elimina la pagina">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <TitleField value={title} editable={canEdit} onChange={(t) => { setTitle(t); change({ title: t }) }} />

      <div className="mt-1 mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
        <span>
          {page.updated_by_name ? `Modificata da ${page.updated_by_name}` : 'Modificata'} il {fmtWhen(page.updated_at)}
        </span>
        {canEdit && <SaveStatus status={status} onRetry={() => { dirty.current = true; void save() }} />}
      </div>

      <TagsField
        tags={tags}
        known={knownTags}
        editable={canEdit}
        onChange={(t) => { setTags(t); change({ tags: t }) }}
      />

      {conflict && (
        <div className="my-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>
            Mentre scrivevi, {conflict.updated_by_name ?? 'qualcun altro'} ha salvato questa pagina ({fmtWhen(conflict.updated_at)}).
            Le tue ultime modifiche non sono ancora salvate.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={takeTheirs}>Carica la sua versione</Button>
            <Button size="sm" onClick={keepMine}>Tieni la mia</Button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <PageEditor
          content={page.content_json}
          editable={canEdit}
          onChange={onEditorChange}
          onReady={onEditorReady}
          threads={openThreads}
          activeThread={openThread}
          onThreadClick={setOpenThread}
          onCommentRequest={setNewAnchor}
        />
      </div>

      <section className="mt-8">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="flex-1 text-xs font-semibold text-navy uppercase tracking-wider font-body">Sottopagine</h2>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={newSubpage} disabled={busy}>
              <Plus className="h-3.5 w-3.5" />Nuova sottopagina
            </Button>
          )}
        </div>
        {subpages.length === 0 ? (
          <p className="text-sm text-ink-muted">Nessuna sottopagina.</p>
        ) : (
          <ul className="rounded-xl border border-navy/10 bg-white/60 divide-y divide-navy/5">
            {subpages.map((s) => (
              <li key={s.id}>
                <Link to={`/admin/spunti/${s.id}`} className="flex items-center gap-2 px-3 py-2.5 hover:bg-white">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-navy/40" />
                  <span className={`flex-1 min-w-0 text-sm break-words ${s.title.trim() ? 'text-navy' : 'text-ink-muted italic'}`}>{pageTitle(s.title)}</span>
                  {(children.get(s.id)?.length ?? 0) > 0 && <span className="text-[11px] text-ink-muted">{children.get(s.id)!.length} sotto</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <TextThreads data={comments} located={located} onOpen={goToThread} />
      <PageComments data={comments} />

      {(openThread || newAnchor) && (
        <ThreadDialog
          data={comments}
          threadId={openThread}
          anchor={newAnchor}
          onClose={() => { setOpenThread(null); setNewAnchor(null) }}
          onCreated={(threadId) => { setNewAnchor(null); setOpenThread(threadId) }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Elimina pagina"
        message={`Eliminare "${pageTitle(title)}"${descendants ? ` e le sue ${descendants} sottopagine` : ''}? Si perdono anche i commenti, e non si può annullare.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={busy}
      />
    </div>
  )
}

const BackLink = () => (
  <Link to="/admin/spunti" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-navy mb-4">
    <ArrowLeft className="h-4 w-4" />Spunti
  </Link>
)

/** Titolo su più righe se serve, come in Notion; Invio non va a capo */
function TitleField({ value, editable, onChange }: { value: string; editable: boolean; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  if (!editable) return <h1 className="font-display text-2xl sm:text-3xl font-semibold text-navy leading-tight break-words">{pageTitle(value)}</h1>
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      autoFocus={!value}
      maxLength={200}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))}
      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
      placeholder="Senza titolo"
      aria-label="Titolo della pagina"
      className="block w-full resize-none overflow-hidden bg-transparent font-display text-2xl sm:text-3xl font-semibold text-navy leading-tight placeholder:text-navy/25 focus:outline-none"
    />
  )
}

function SaveStatus({ status, onRetry }: { status: Status; onRetry: () => void }) {
  if (status === 'error') {
    return (
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 text-bordeaux hover:underline">
        <RotateCcw className="h-3 w-3" />Non salvato, riprova
      </button>
    )
  }
  const label = { saved: 'Salvato', dirty: 'Modifiche in corso…', saving: 'Salvataggio…' }[status]
  return <span className={status === 'saved' ? 'text-green-700' : ''} aria-live="polite">{label}</span>
}

function TagsField({ tags, known, editable, onChange }: { tags: string[]; known: string[]; editable: boolean; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('')
  const add = (raw: string) => {
    const t = raw.trim().replace(/\s+/g, ' ').slice(0, 30)
    setInput('')
    if (!t || tags.some((x) => x.toLowerCase() === t.toLowerCase()) || tags.length >= 12) return
    onChange([...tags, t])
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(input)
    } else if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }
  if (!editable && tags.length === 0) return null
  const suggestions = known.filter((k) => !tags.some((t) => t.toLowerCase() === k.toLowerCase()))
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-viola/10 px-2.5 py-1 text-xs text-viola">
          {t}
          {editable && (
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Togli l'etichetta ${t}`} className="hover:text-bordeaux">
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {editable && (
        <>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            onBlur={() => input.trim() && add(input)}
            list="spunti-tags"
            placeholder={tags.length ? 'Altra etichetta' : 'Aggiungi etichetta (es. Sponsor)'}
            aria-label="Nuova etichetta"
            className="h-7 min-w-[9rem] flex-1 bg-transparent text-xs text-ink-light placeholder:text-ink-muted focus:outline-none"
          />
          <datalist id="spunti-tags">
            {suggestions.map((k) => <option key={k} value={k} />)}
          </datalist>
        </>
      )}
    </div>
  )
}
