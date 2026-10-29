/**
 * Commenti sul testo: il pezzo commentato si salva come citazione con un po' di contesto prima
 * e dopo, non come posizione. Così il testo della pagina non cambia (può commentare anche chi la
 * legge soltanto) e il pezzo si ritrova anche dopo modifiche altrove. Se la citazione sparisce,
 * il commento resta nell'elenco con la nota che il testo è cambiato.
 */
import { Extension } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'
import type { Node as PMNode } from '@tiptap/pm/model'

export interface Anchor {
  quote: string
  prefix: string
  suffix: string
}

export interface AnchoredThread extends Anchor {
  id: string
}

const CONTEXT = 32

/** Testo della pagina con un a capo tra i blocchi, e per ogni carattere la sua posizione nel documento (-1 = a capo aggiunto) */
function flatten(doc: PMNode): { text: string; pos: number[] } {
  let text = ''
  const pos: number[] = []
  doc.descendants((node, at) => {
    if (node.isTextblock && text.length > 0) {
      text += '\n'
      pos.push(-1)
    } else if (node.type.name === 'hardBreak') {
      text += '\n'
      pos.push(-1)
    } else if (node.isText && node.text) {
      for (let i = 0; i < node.text.length; i++) pos.push(at + i)
      text += node.text
    }
    return true
  })
  return { text, pos }
}

/** Citazione e contesto per la selezione [from, to) del documento; null se non c'è testo */
export function anchorFromRange(doc: PMNode, from: number, to: number): Anchor | null {
  const { text, pos } = flatten(doc)
  let start = pos.findIndex((p) => p >= from)
  if (start < 0) return null
  let end = start
  while (end < pos.length && (pos[end] === -1 || pos[end] < to)) end++
  // Niente spazi o a capo ai bordi della citazione
  while (start < end && /\s/.test(text[start])) start++
  while (end > start && /\s/.test(text[end - 1])) end--
  if (end <= start) return null
  return {
    quote: text.slice(start, end).slice(0, 1000),
    prefix: text.slice(Math.max(0, start - CONTEXT), start),
    suffix: text.slice(end, end + CONTEXT),
  }
}

const commonSuffix = (a: string, b: string) => { let n = 0; while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++; return n }
const commonPrefix = (a: string, b: string) => { let n = 0; while (n < a.length && n < b.length && a[n] === b[n]) n++; return n }

/** Posizione nel documento di ogni discussione ritrovata; quelle non ritrovate mancano dalla mappa */
export function locate(doc: PMNode, threads: AnchoredThread[]): Map<string, { from: number; to: number }> {
  const out = new Map<string, { from: number; to: number }>()
  if (!threads.length) return out
  const { text, pos } = flatten(doc)
  for (const t of threads) {
    if (!t.quote) continue
    let best = -1
    let bestScore = -1
    for (let i = text.indexOf(t.quote); i >= 0; i = text.indexOf(t.quote, i + 1)) {
      const score = commonSuffix(text.slice(Math.max(0, i - CONTEXT), i), t.prefix) +
        commonPrefix(text.slice(i + t.quote.length, i + t.quote.length + CONTEXT), t.suffix)
      if (score > bestScore) { best = i; bestScore = score }
    }
    if (best < 0) continue
    const first = pos.slice(best, best + t.quote.length).find((p) => p >= 0)
    const last = [...pos.slice(best, best + t.quote.length)].reverse().find((p) => p >= 0)
    if (first === undefined || last === undefined) continue
    out.set(t.id, { from: first, to: last + 1 })
  }
  return out
}

interface HighlightState { threads: AnchoredThread[]; active: string | null; deco: DecorationSet }
const key = new PluginKey<HighlightState>('spuntiComments')

function decorations(doc: PMNode, threads: AnchoredThread[], active: string | null) {
  const found = locate(doc, threads)
  return DecorationSet.create(doc, [...found.entries()].map(([id, r]) =>
    Decoration.inline(r.from, r.to, { class: id === active ? 'spunti-comment is-active' : 'spunti-comment', 'data-thread': id })))
}

/** Evidenzia i pezzi commentati. Le discussioni aperte arrivano con setCommentThreads. */
export const CommentHighlights = Extension.create({
  name: 'commentHighlights',
  addProseMirrorPlugins() {
    return [new Plugin<HighlightState>({
      key,
      state: {
        init: (): HighlightState => ({ threads: [], active: null, deco: DecorationSet.empty }),
        apply(tr, value, _old, state) {
          const meta = tr.getMeta(key) as { threads: AnchoredThread[]; active: string | null } | undefined
          if (!meta && !tr.docChanged) return value
          const threads = meta?.threads ?? value.threads
          const active = meta ? meta.active : value.active
          return { threads, active, deco: decorations(state.doc, threads, active) }
        },
      },
      props: {
        decorations: (state) => key.getState(state)?.deco,
      },
    })]
  },
})

/** Passa all'editor le discussioni aperte da evidenziare e quella aperta ora */
export function setCommentThreads(view: EditorView, threads: AnchoredThread[], active: string | null) {
  view.dispatch(view.state.tr.setMeta(key, { threads, active }).setMeta('addToHistory', false))
}
