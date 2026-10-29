import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePagesStore } from '@/stores/pagesStore'
import { useAuthStore, useCan } from '@/stores/authStore'
import type { PageComment } from '@/types'
import { fmtWhen } from './tree'

/** Commenti sotto una pagina: li scrive chiunque la vede; si cancellano i propri, gli altri con spunti.delete */
export function Comments({ pageId }: { pageId: string }) {
  const { fetchComments, addComment, deleteComment } = usePagesStore()
  const me = useAuthStore((s) => s.user)
  const canDeleteAny = useCan('spunti.delete')
  const [comments, setComments] = useState<PageComment[] | null>(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    fetchComments(pageId).then((c) => alive && setComments(c)).catch(() => alive && setComments([]))
    return () => { alive = false }
  }, [pageId, fetchComments])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    setError('')
    try {
      const c = await addComment(pageId, body)
      setComments((list) => [...(list ?? []), c])
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commento non inviato')
    } finally {
      setSending(false)
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteComment(id)
      setComments((list) => (list ?? []).filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commento non eliminato')
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold text-navy uppercase tracking-wider font-body mb-2">
        Commenti{comments && comments.length > 0 ? ` (${comments.length})` : ''}
      </h2>
      {comments === null ? (
        <Loader2 className="h-4 w-4 animate-spin text-navy/40" />
      ) : (
        <ul className="space-y-3 mb-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-navy/10 bg-white/60 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-navy">{c.user_name ?? 'Utente rimosso'}</span>
                <span className="text-ink-muted">{fmtWhen(c.created_at)}</span>
                {(c.user_id === me?.id || canDeleteAny) && (
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    aria-label="Elimina il commento"
                    className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded text-ink-muted hover:bg-bordeaux/10 hover:text-bordeaux"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-light whitespace-pre-wrap break-words">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          maxLength={5000}
          placeholder="Scrivi un commento"
          aria-label="Nuovo commento"
          className="w-full rounded-md border border-navy/20 bg-white p-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-viola/40 resize-y"
        />
        {error && <p className="text-sm text-bordeaux">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={sending || !body.trim()}>
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Commenta
          </Button>
        </div>
      </form>
    </section>
  )
}
