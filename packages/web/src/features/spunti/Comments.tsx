import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Check, ChevronDown, Loader2, MessageSquareText, RotateCcw, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePagesStore } from '@/stores/pagesStore'
import { useAuthStore, useCan } from '@/stores/authStore'
import type { PageComment } from '@/types'
import type { Anchor } from './commentAnchors'
import { fmtWhen } from './tree'

const textareaCls = 'w-full rounded-md border border-navy/20 bg-white p-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-viola/40 resize-y'

/** Tutti i commenti della pagina: in fondo, discussioni sul testo e loro risposte */
export function usePageComments(pageId: string) {
  const { fetchComments, addComment, resolveComment, deleteComment } = usePagesStore()
  const [list, setList] = useState<PageComment[] | null>(null)

  useEffect(() => {
    let alive = true
    fetchComments(pageId).then((c) => alive && setList(c)).catch(() => alive && setList([]))
    return () => { alive = false }
  }, [pageId, fetchComments])

  const add = useCallback(async (body: string, extra?: { parent_id?: string } & Partial<Anchor>) => {
    const c = await addComment(pageId, body, extra && {
      parent_id: extra.parent_id,
      ...(extra.quote ? { anchor_quote: extra.quote, anchor_prefix: extra.prefix, anchor_suffix: extra.suffix } : {}),
    })
    setList((l) => [...(l ?? []), c])
    return c
  }, [pageId, addComment])

  const resolve = useCallback(async (id: string, resolved: boolean) => {
    const c = await resolveComment(id, resolved)
    setList((l) => (l ?? []).map((x) => (x.id === id ? c : x)))
  }, [resolveComment])

  const remove = useCallback(async (id: string) => {
    await deleteComment(id)
    setList((l) => (l ?? []).filter((x) => x.id !== id && x.parent_id !== id))
  }, [deleteComment])

  return { list, add, resolve, remove }
}

export type PageCommentsData = ReturnType<typeof usePageComments>

const isThread = (c: PageComment) => !!c.anchor_quote && !c.parent_id

function CommentItem({ c, onDelete }: { c: PageComment; onDelete: (id: string) => void }) {
  const me = useAuthStore((s) => s.user)
  const canDeleteAny = useCan('spunti.delete')
  return (
    <div>
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-navy">{c.user_name ?? 'Utente rimosso'}</span>
        <span className="text-ink-muted">{fmtWhen(c.created_at)}</span>
        {(c.user_id === me?.id || canDeleteAny) && (
          <button
            type="button"
            onClick={() => onDelete(c.id)}
            aria-label="Elimina il commento"
            className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded text-ink-muted hover:bg-bordeaux/10 hover:text-bordeaux"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="mt-0.5 text-sm text-ink-light whitespace-pre-wrap break-words">{c.body}</p>
    </div>
  )
}

function Composer({ placeholder, label, onSend, autoFocus }: { placeholder: string; label: string; onSend: (body: string) => Promise<unknown>; autoFocus?: boolean }) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    setError('')
    try {
      await onSend(body)
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commento non inviato')
    } finally {
      setSending(false)
    }
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} maxLength={5000} placeholder={placeholder} aria-label={placeholder} autoFocus={autoFocus} className={textareaCls} />
      {error && <p className="text-sm text-bordeaux">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={sending || !body.trim()}>
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {label}
        </Button>
      </div>
    </form>
  )
}

/** Commenti in fondo alla pagina, non legati a un pezzo di testo */
export function PageComments({ data }: { data: PageCommentsData }) {
  const comments = (data.list ?? []).filter((c) => !c.anchor_quote && !c.parent_id)
  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold text-navy uppercase tracking-wider font-body mb-2">
        Commenti{comments.length > 0 ? ` (${comments.length})` : ''}
      </h2>
      {data.list === null ? (
        <Loader2 className="h-4 w-4 animate-spin text-navy/40" />
      ) : (
        <ul className="space-y-3 mb-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-navy/10 bg-white/60 px-3 py-2.5">
              <CommentItem c={c} onDelete={(id) => void data.remove(id)} />
            </li>
          ))}
        </ul>
      )}
      <Composer placeholder="Scrivi un commento" label="Commenta" onSend={(body) => data.add(body)} />
    </section>
  )
}

/** Discussioni sul testo: aperte in vista, risolte a scomparsa; un tocco porta al pezzo commentato */
export function TextThreads({ data, located, onOpen }: { data: PageCommentsData; located: Set<string>; onOpen: (id: string) => void }) {
  const [showResolved, setShowResolved] = useState(false)
  const threads = useMemo(() => (data.list ?? []).filter(isThread), [data.list])
  const replies = (id: string) => (data.list ?? []).filter((c) => c.parent_id === id).length
  if (threads.length === 0) return null
  const open = threads.filter((t) => !t.resolved_at)
  const resolved = threads.filter((t) => t.resolved_at)

  const row = (t: PageComment) => (
    <li key={t.id}>
      <button type="button" onClick={() => onOpen(t.id)} className="w-full text-left rounded-lg border border-navy/10 bg-white/60 px-3 py-2.5 hover:bg-white">
        <p className="text-xs italic text-ink-muted border-l-2 border-amber-400 pl-2 line-clamp-2 break-words">{t.anchor_quote}</p>
        <p className="mt-1.5 text-sm text-ink-light line-clamp-2 break-words"><span className="font-semibold text-navy">{t.user_name ?? 'Utente rimosso'}</span> {t.body}</p>
        <p className="mt-1 text-[11px] text-ink-muted">
          {replies(t.id) > 0 ? `${replies(t.id)} ${replies(t.id) === 1 ? 'risposta' : 'risposte'} · ` : ''}
          {t.resolved_at ? `Risolto${t.resolved_by_name ? ` da ${t.resolved_by_name}` : ''}` : !located.has(t.id) ? 'Il testo commentato è cambiato' : fmtWhen(t.created_at)}
        </p>
      </button>
    </li>
  )

  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold text-navy uppercase tracking-wider font-body mb-2 flex items-center gap-1.5">
        <MessageSquareText className="h-3.5 w-3.5" />Commenti sul testo{open.length > 0 ? ` (${open.length})` : ''}
      </h2>
      {open.length === 0 && <p className="text-sm text-ink-muted mb-2">Tutte le discussioni sono risolte.</p>}
      <ul className="space-y-2">{open.map(row)}</ul>
      {resolved.length > 0 && (
        <>
          <button type="button" onClick={() => setShowResolved(!showResolved)} className="mt-2 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-navy" aria-expanded={showResolved}>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showResolved ? 'rotate-180' : ''}`} />
            {showResolved ? 'Nascondi' : 'Mostra'} i risolti ({resolved.length})
          </button>
          {showResolved && <ul className="space-y-2 mt-2 opacity-75">{resolved.map(row)}</ul>}
        </>
      )}
    </section>
  )
}

/** Una discussione sul testo (o una nuova, se arriva solo il pezzo selezionato) */
export function ThreadDialog({ data, threadId, anchor, onClose, onCreated }: {
  data: PageCommentsData
  threadId: string | null
  anchor: Anchor | null
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const root = threadId ? (data.list ?? []).find((c) => c.id === threadId) ?? null : null
  const replies = root ? (data.list ?? []).filter((c) => c.parent_id === root.id) : []
  const quote = root?.anchor_quote ?? anchor?.quote ?? ''
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggleResolved = async () => {
    if (!root) return
    setBusy(true)
    setError('')
    try {
      await data.resolve(root.id, !root.resolved_at)
      if (!root.resolved_at) onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Non riuscito')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>{root ? 'Discussione' : 'Commenta il testo'}</DialogTitle></DialogHeader>
        <blockquote className="text-sm italic text-ink-light border-l-[3px] border-amber-400 bg-amber-50/60 px-3 py-2 rounded-r break-words">{quote}</blockquote>
        {root && (
          <ul className="space-y-3">
            {[root, ...replies].map((c) => (
              <li key={c.id}><CommentItem c={c} onDelete={(id) => { void data.remove(id); if (id === root.id) onClose() }} /></li>
            ))}
          </ul>
        )}
        {root?.resolved_at && (
          <p className="text-xs text-green-800">Risolto{root.resolved_by_name ? ` da ${root.resolved_by_name}` : ''} il {fmtWhen(root.resolved_at)}.</p>
        )}
        <Composer
          autoFocus={!root}
          placeholder={root ? 'Rispondi' : 'Scrivi un commento su questo pezzo'}
          label={root ? 'Rispondi' : 'Commenta'}
          onSend={async (body) => {
            if (root) await data.add(body, { parent_id: root.id })
            else if (anchor) onCreated((await data.add(body, anchor)).id)
          }}
        />
        {error && <p className="text-sm text-bordeaux">{error}</p>}
        {root && (
          <div className="flex justify-start border-t border-navy/10 pt-3">
            <Button type="button" size="sm" variant="outline" onClick={toggleResolved} disabled={busy}>
              {root.resolved_at ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              {root.resolved_at ? 'Riapri' : 'Segna come risolto'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
