import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Placeholder } from '@tiptap/extensions'
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered, ListChecks, Quote, Link2, Minus, Undo2, Redo2, Check, X, MessageSquarePlus,
} from 'lucide-react'
import { anchorFromRange, CommentHighlights, setCommentThreads, type Anchor, type AnchoredThread } from './commentAnchors'

export interface EditorChange {
  json: string
  text: string
}

/** Testo della pagina: documento dell'editor in JSON ('' = pagina vuota) */
const parse = (json: string) => {
  if (!json) return ''
  try {
    return JSON.parse(json)
  } catch {
    return ''
  }
}

/**
 * Editor degli Spunti (Tiptap). Titoli, grassetto, elenchi, cose da fare, citazioni, link.
 * Chi ha solo il permesso di vedere riceve lo stesso editor in sola lettura, senza barra.
 */
export function PageEditor({ content, editable, onChange, onReady, threads, activeThread, onThreadClick, onCommentRequest }: {
  content: string
  editable: boolean
  onChange: (change: EditorChange) => void
  /** Per sostituire il testo da fuori, per esempio con la versione di un altro dopo un conflitto */
  onReady?: (editor: Editor) => void
  /** Discussioni aperte sul testo: i pezzi commentati restano evidenziati */
  threads: AnchoredThread[]
  activeThread: string | null
  onThreadClick: (id: string) => void
  /** Testo selezionato e "Commenta": anche in sola lettura */
  onCommentRequest: (anchor: Anchor) => void
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // Il titolo della pagina è l'unico h1. I link si aprono solo in lettura;
        // isAllowedUri di Tiptap blocca gli indirizzi javascript: e simili.
        link: { openOnClick: !editable, autolink: true, defaultProtocol: 'https' },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        a11y: { checkboxLabel: (node, checked) => `${checked ? 'Fatto' : 'Da fare'}: ${node.textContent || 'voce vuota'}` },
      }),
      Placeholder.configure({ placeholder: 'Scrivi qui. Titoli, elenchi e cose da fare dalla barra sopra.' }),
      CommentHighlights,
    ],
    content: parse(content),
    editable,
    immediatelyRender: true,
    editorProps: { attributes: { class: 'spunti-editor', 'aria-label': 'Testo della pagina' } },
    onUpdate: ({ editor: e }) => {
      onChange({ json: e.isEmpty ? '' : JSON.stringify(e.getJSON()), text: e.getText({ blockSeparator: '\n' }) })
    },
  })

  useEffect(() => {
    if (editor) onReady?.(editor)
  }, [editor, onReady])

  useEffect(() => {
    editor?.setEditable(editable)
  }, [editor, editable])

  useEffect(() => {
    if (editor) setCommentThreads(editor.view, threads, activeThread)
  }, [editor, threads, activeThread])

  // Tocco su un pezzo evidenziato: apre la sua discussione
  const onThreadClickRef = useRef(onThreadClick)
  onThreadClickRef.current = onThreadClick
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const click = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest('[data-thread]') as HTMLElement | null
      if (el?.dataset.thread) onThreadClickRef.current(el.dataset.thread)
    }
    dom.addEventListener('click', click)
    return () => dom.removeEventListener('click', click)
  }, [editor])

  if (!editor) return null
  return (
    <div>
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
      <SelectionComment editor={editor} onComment={onCommentRequest} />
    </div>
  )
}

/**
 * Tasto "Commenta" sotto il testo selezionato (sotto, perché sul telefono sopra c'è il menu del sistema).
 * Usa la selezione del browser, quindi funziona anche in sola lettura.
 */
function SelectionComment({ editor, onComment }: { editor: Editor; onComment: (anchor: Anchor) => void }) {
  const [pending, setPending] = useState<{ anchor: Anchor; top: number; left: number } | null>(null)
  const hideTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const dom = editor.view.dom
    const hideSoon = () => {
      window.clearTimeout(hideTimer.current)
      // Un attimo di margine: toccare il tasto può far sparire la selezione prima del clic
      hideTimer.current = window.setTimeout(() => setPending(null), 250)
    }
    const onSelection = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.rangeCount || !dom.contains(sel.anchorNode) || !dom.contains(sel.focusNode)) return hideSoon()
      let anchor: Anchor | null = null
      try {
        const a = editor.view.posAtDOM(sel.anchorNode!, sel.anchorOffset)
        const f = editor.view.posAtDOM(sel.focusNode!, sel.focusOffset)
        anchor = anchorFromRange(editor.state.doc, Math.min(a, f), Math.max(a, f))
      } catch {
        anchor = null
      }
      if (!anchor) return hideSoon()
      window.clearTimeout(hideTimer.current)
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      const below = rect.bottom + 10
      setPending({
        anchor,
        top: below + 40 > window.innerHeight ? Math.max(8, rect.top - 46) : below,
        left: Math.min(Math.max(rect.left + rect.width / 2, 70), window.innerWidth - 70),
      })
    }
    const onScroll = () => setPending(null)
    document.addEventListener('selectionchange', onSelection)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('selectionchange', onSelection)
      window.removeEventListener('scroll', onScroll, true)
      window.clearTimeout(hideTimer.current)
    }
  }, [editor])

  if (!pending) return null
  return (
    <button
      type="button"
      onPointerDown={(e) => e.preventDefault()}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        onComment(pending.anchor)
        setPending(null)
        window.getSelection()?.removeAllRanges()
      }}
      style={{ top: pending.top, left: pending.left }}
      className="fixed z-40 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-navy px-3.5 py-2 text-sm font-medium text-white shadow-lg"
    >
      <MessageSquarePlus className="h-4 w-4" />
      Commenta
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  // Lo stato dei pulsanti segue la selezione senza ridisegnare tutto l'editor
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      strike: e.isActive('strike'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      task: e.isActive('taskList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })
  const [linkOpen, setLinkOpen] = useState(false)
  const [url, setUrl] = useState('')
  const chain = () => editor.chain().focus()

  const openLink = () => {
    setUrl((editor.getAttributes('link').href as string | undefined) ?? '')
    setLinkOpen(true)
  }
  const applyLink = () => {
    const href = url.trim()
    if (!href) chain().extendMarkRange('link').unsetLink().run()
    else chain().extendMarkRange('link').setLink({ href: /^[a-z]+:/i.test(href) ? href : `https://${href}` }).run()
    setLinkOpen(false)
  }

  return (
    <div className="sticky top-0 z-10 -mx-1 mb-3 bg-crema/95 backdrop-blur-sm border-b border-navy/10">
      <div className="flex items-center gap-0.5 overflow-x-auto px-1 py-1.5 [scrollbar-width:none]" role="toolbar" aria-label="Formattazione">
        <Btn label="Titolo" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}><Heading2 /></Btn>
        <Btn label="Sottotitolo" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}><Heading3 /></Btn>
        <Sep />
        <Btn label="Grassetto" active={state.bold} onClick={() => chain().toggleBold().run()}><Bold /></Btn>
        <Btn label="Corsivo" active={state.italic} onClick={() => chain().toggleItalic().run()}><Italic /></Btn>
        <Btn label="Barrato" active={state.strike} onClick={() => chain().toggleStrike().run()}><Strikethrough /></Btn>
        <Sep />
        <Btn label="Elenco puntato" active={state.bullet} onClick={() => chain().toggleBulletList().run()}><List /></Btn>
        <Btn label="Elenco numerato" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}><ListOrdered /></Btn>
        <Btn label="Cose da fare" active={state.task} onClick={() => chain().toggleTaskList().run()}><ListChecks /></Btn>
        <Btn label="Citazione" active={state.quote} onClick={() => chain().toggleBlockquote().run()}><Quote /></Btn>
        <Btn label="Link" active={state.link || linkOpen} onClick={openLink}><Link2 /></Btn>
        <Btn label="Linea di separazione" onClick={() => chain().setHorizontalRule().run()}><Minus /></Btn>
        <Sep />
        <Btn label="Annulla" disabled={!state.canUndo} onClick={() => chain().undo().run()}><Undo2 /></Btn>
        <Btn label="Ripeti" disabled={!state.canRedo} onClick={() => chain().redo().run()}><Redo2 /></Btn>
      </div>
      {linkOpen && (
        <form
          className="flex items-center gap-1.5 px-1 pb-2"
          onSubmit={(e) => { e.preventDefault(); applyLink() }}
        >
          <input
            autoFocus
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Indirizzo del link (vuoto per toglierlo)"
            className="flex h-8 w-full min-w-0 rounded-md border border-navy/20 bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
          />
          <Btn label="Applica il link" type="submit"><Check /></Btn>
          <Btn label="Chiudi" onClick={() => setLinkOpen(false)}><X /></Btn>
        </form>
      )}
    </div>
  )
}

function Btn({ label, active, disabled, onClick, type = 'button', children }: {
  label: string; active?: boolean; disabled?: boolean; onClick?: () => void; type?: 'button' | 'submit'; children: ReactNode
}) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Il tocco non deve togliere la selezione al testo prima del comando
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-35 [&_svg]:h-4 [&_svg]:w-4 ${
        active ? 'bg-navy text-white' : 'text-ink-light hover:bg-navy/5 hover:text-navy'
      }`}
    >
      {children}
    </button>
  )
}

const Sep = () => <span className="mx-1 h-5 w-px shrink-0 bg-navy/15" aria-hidden />
