import { Fragment, useMemo, type ReactNode } from 'react'
import { parseInline, parseMarkdown } from '@/lib/markdown'

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((s, i) => {
        let node: ReactNode = s.text.split('\n').flatMap((part, j) => (j ? [<br key={j} />, part] : [part]))
        if (s.bold) node = <strong>{node}</strong>
        if (s.italic) node = <em>{node}</em>
        if (s.href) node = <a href={s.href} target="_blank" rel="noopener noreferrer">{node}</a>
        return <Fragment key={i}>{node}</Fragment>
      })}
    </>
  )
}

/**
 * Markdown delle riunioni come elementi React (niente HTML iniettato). `itemAction` aggiunge
 * qualcosa in fondo a ogni voce di elenco e riceve il titolo della sezione in cui sta la voce.
 */
export function MarkdownView({ src, className, itemAction }: {
  src: string
  className?: string
  itemAction?: (item: string, heading: string | null) => ReactNode
}) {
  const blocks = useMemo(() => parseMarkdown(src), [src])
  let heading: string | null = null
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        if (b.type === 'heading') {
          heading = b.text
          // # diventa h2: il titolo della pagina resta l'unico h1
          const H = `h${Math.min(b.level + 1, 5)}` as 'h2' | 'h3' | 'h4' | 'h5'
          return <H key={i}><Inline text={b.text} /></H>
        }
        if (b.type === 'list') {
          const List = b.ordered ? 'ol' : 'ul'
          const section = heading
          return (
            <List key={i}>
              {b.items.map((item, j) => (
                <li key={j}><Inline text={item} />{itemAction?.(item, section)}</li>
              ))}
            </List>
          )
        }
        return <p key={i}><Inline text={b.text} /></p>
      })}
    </div>
  )
}
