import type { PageListItem } from '@/types'

export const pageTitle = (title: string) => title.trim() || 'Senza titolo'

/** Figli per pagina madre; chiave null = pagine di primo livello (anche quelle con la madre sparita) */
export function childrenOf(pages: PageListItem[]): Map<string | null, PageListItem[]> {
  const ids = new Set(pages.map((p) => p.id))
  const map = new Map<string | null, PageListItem[]>()
  for (const p of pages) {
    const key = p.parent_id && ids.has(p.parent_id) ? p.parent_id : null
    map.set(key, [...(map.get(key) ?? []), p])
  }
  return map
}

/** Pagine madri dalla prima di primo livello fino a quella sopra id (esclusa id) */
export function ancestorsOf(id: string, pages: PageListItem[]): PageListItem[] {
  const byId = new Map(pages.map((p) => [p.id, p]))
  const out: PageListItem[] = []
  let cur = byId.get(id)?.parent_id
  while (cur && byId.has(cur) && out.length < 50) {
    const p = byId.get(cur)!
    out.unshift(p)
    cur = p.parent_id
  }
  return out
}

export function countDescendants(id: string, children: Map<string | null, PageListItem[]>): number {
  return (children.get(id) ?? []).reduce((n, c) => n + 1 + countDescendants(c.id, children), 0)
}

/** "29 ott, 14:05" (anno solo se diverso da quest'anno). Le date del DB sono UTC senza fuso. */
export function fmtWhen(s: string): string {
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z')
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleString('it-IT', {
    day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }), hour: '2-digit', minute: '2-digit',
  })
}
