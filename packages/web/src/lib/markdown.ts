/**
 * Markdown essenziale per i testi interni (riunioni): titoli, elenchi puntati e numerati,
 * paragrafi, grassetto, corsivo, link. Un solo parser per la pagina (MarkdownView, elementi
 * React: l'HTML scritto a mano nel markdown resta testo) e per l'export PDF.
 */

export type MdBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }

export interface MdSpan {
  text: string
  bold?: boolean
  italic?: boolean
  href?: string
}

const safeUrl = (url: string) => (/^(https?:|mailto:|tel:|\/)/i.test(url) ? url : null)

export function parseMarkdown(src: string): MdBlock[] {
  const out: MdBlock[] = []
  let para: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushPara = () => {
    if (para.length) out.push({ type: 'paragraph', text: para.join('\n') })
    para = []
  }
  const flushList = () => {
    if (list) out.push({ type: 'list', ...list })
    list = null
  }

  for (const line of src.replace(/\r\n/g, '\n').split('\n')) {
    if (!line.trim()) {
      flushPara()
      flushList()
      continue
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      flushPara()
      flushList()
      out.push({ type: 'heading', level: heading[1].length, text: heading[2] })
      continue
    }
    const item = /^\s*(?:([-*])|\d+[.)])\s+(.*)$/.exec(line)
    if (item) {
      flushPara()
      const ordered = !item[1]
      if (list && list.ordered !== ordered) flushList()
      if (!list) list = { ordered, items: [] }
      list.items.push(item[2])
      continue
    }
    // Riga rientrata subito dopo una voce: continua la voce
    if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += ' ' + line.trim()
      continue
    }
    flushList()
    para.push(line)
  }
  flushPara()
  flushList()
  return out
}

// [testo](url) | **grassetto** | *corsivo* (l'asterisco non deve toccare lettere: 2*3 resta com'è)
const INLINE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([\s\S]+?)\*\*|(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g

export function parseInline(s: string): MdSpan[] {
  const out: MdSpan[] = []
  let last = 0
  for (const m of s.matchAll(INLINE)) {
    const start = m.index! + (m[5] !== undefined ? m[4].length : 0)
    if (start > last) out.push({ text: s.slice(last, start) })
    if (m[1] !== undefined) {
      const href = safeUrl(m[2])
      out.push(href ? { text: m[1], href } : { text: m[1] })
    } else if (m[3] !== undefined) out.push({ text: m[3], bold: true })
    else out.push({ text: m[5], italic: true })
    last = m.index! + m[0].length
  }
  if (last < s.length) out.push({ text: s.slice(last) })
  return out
}

/** Classi Tailwind per un blocco di markdown (MarkdownView) */
export const MARKDOWN_CLASS =
  'text-sm text-ink-light leading-relaxed space-y-3 ' +
  // # → h2, ## → h3 (sezioni), ### → h4 (sottosezioni, in sans per staccarle dalle sezioni)
  '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-navy [&_h2]:pt-4 ' +
  '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-navy [&_h3]:pt-4 [&_h3]:border-t [&_h3]:border-navy/10 ' +
  '[&_h4]:font-body [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-viola [&_h4]:pt-2 ' +
  '[&_h5]:font-body [&_h5]:font-semibold [&_h5]:text-navy ' +
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li+li]:mt-1 ' +
  '[&_a]:text-viola [&_a]:underline [&_strong]:text-navy [&_strong]:font-semibold [&_em]:italic ' +
  '[&>*:first-child]:pt-0 [&>*:first-child]:border-0'
