/**
 * Markdown essenziale per i testi interni (riunioni): titoli, elenchi puntati e numerati,
 * paragrafi, grassetto, corsivo, link. Tutto il testo viene prima escapato, quindi
 * l'HTML scritto a mano nel markdown non passa.
 */

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const safeUrl = (url: string) => (/^(https?:|mailto:|tel:|\/)/i.test(url) ? url : '#')

// Riceve testo già escapato
function inline(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) =>
      `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g, '$1<em>$2</em>')
}

export function renderMarkdown(src: string): string {
  const out: string[] = []
  let para: string[] = []
  let list: { tag: 'ul' | 'ol'; items: string[] } | null = null

  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join('<br>'))}</p>`)
    para = []
  }
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`)
    list = null
  }

  for (const line of escape(src.replace(/\r\n/g, '\n')).split('\n')) {
    if (!line.trim()) {
      flushPara()
      flushList()
      continue
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      flushPara()
      flushList()
      // # diventa h2: il titolo della pagina resta l'unico h1
      const level = Math.min(heading[1].length + 1, 5)
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`)
      continue
    }
    const item = /^\s*(?:([-*])|\d+[.)])\s+(.*)$/.exec(line)
    if (item) {
      flushPara()
      const tag = item[1] ? 'ul' : 'ol'
      if (list && list.tag !== tag) flushList()
      if (!list) list = { tag, items: [] }
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
  return out.join('\n')
}

/** Classi Tailwind per un blocco di markdown renderizzato con renderMarkdown */
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
