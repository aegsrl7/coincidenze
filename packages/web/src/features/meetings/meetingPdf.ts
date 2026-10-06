/**
 * PDF di una riunione, generato nel browser. Questo modulo si carica solo quando si crea
 * il PDF (import dinamico), insieme a pdfmake e ai font: il resto dell'area riservata non li scarica.
 */
import pdfMake from 'pdfmake/build/pdfmake'
import interRegular from '@fontsource/inter/files/inter-latin-400-normal.woff?url'
import interItalic from '@fontsource/inter/files/inter-latin-400-italic.woff?url'
import interSemibold from '@fontsource/inter/files/inter-latin-600-normal.woff?url'
import interSemiboldItalic from '@fontsource/inter/files/inter-latin-600-italic.woff?url'
import playfairSemibold from '@fontsource/playfair-display/files/playfair-display-latin-600-normal.woff?url'
import playfairSemiboldItalic from '@fontsource/playfair-display/files/playfair-display-latin-600-italic.woff?url'
import playfairBold from '@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff?url'
import playfairBoldItalic from '@fontsource/playfair-display/files/playfair-display-latin-700-italic.woff?url'
import { parseInline, parseMarkdown, type MdSpan } from '@/lib/markdown'
import type { Meeting } from '@/types'
import { parseTranscript, isTurn, speakersOf } from './transcript'
import { fmtMeetingDate } from './RiunioniPage'

export type PdfSection = 'summary' | 'prep_notes' | 'transcript'

export const PDF_SECTIONS: { key: PdfSection; label: string }[] = [
  { key: 'summary', label: 'Punti chiave' },
  { key: 'prep_notes', label: 'Materiale preparatorio' },
  { key: 'transcript', label: 'Trascrizione' },
]

const C = { navy: '#2C3E6B', viola: '#6B3FA0', bordeaux: '#8B2252', ink: '#1a1a1a', light: '#4a4a4a', muted: '#8a8a8a', rule: '#ddd6c8' }
const SPEAKER_COLORS = [C.navy, C.viola, C.bordeaux, C.light] // stesso ordine della pagina

type Node = Record<string, unknown>

// pdfmake scarica font e immagini da URL assoluti; gli si permette solo il sito stesso
const abs = (path: string) => new URL(path, window.location.origin).href

let fontsReady = false
function setupFonts() {
  if (fontsReady) return
  pdfMake.addFonts({
    Inter: { normal: abs(interRegular), bold: abs(interSemibold), italics: abs(interItalic), bolditalics: abs(interSemiboldItalic) },
    Playfair: { normal: abs(playfairSemibold), bold: abs(playfairBold), italics: abs(playfairSemiboldItalic), bolditalics: abs(playfairBoldItalic) },
  })
  pdfMake.setUrlAccessPolicy((url) => url.startsWith(window.location.origin + '/'))
  fontsReady = true
}

const spans = (list: MdSpan[]): Node[] =>
  list.map((s) => ({
    text: s.text,
    ...(s.bold ? { bold: true, color: C.navy } : {}),
    ...(s.italic ? { italics: true } : {}),
    ...(s.href ? { link: s.href, color: C.viola, decoration: 'underline' } : {}),
  }))

const list = (ordered: boolean, items: string[], extra: Node = {}): Node => ({
  [ordered ? 'ol' : 'ul']: items.map((i) => ({ text: spans(parseInline(i)), margin: [0, 0, 0, 3] })),
  markerColor: C.navy,
  margin: [0, 0, 0, 8],
  ...extra,
})

/**
 * Un titolo non deve restare da solo in fondo alla pagina: i titoli consecutivi e la prima riga
 * che li segue (il paragrafo o la prima voce dell'elenco) stanno in un blocco che non si spezza.
 */
function markdown(src: string): Node[] {
  const out: Node[] = []
  let headings: Node[] = []
  const keepWithHeadings = (...nodes: Node[]) => {
    out.push(headings.length ? { stack: [...headings, nodes[0]], unbreakable: true } : nodes[0], ...nodes.slice(1))
    headings = []
  }
  for (const b of parseMarkdown(src)) {
    if (b.type === 'heading') {
      headings.push({ text: spans(parseInline(b.text)), style: `h${Math.min(b.level, 3)}` })
    } else if (b.type === 'paragraph') {
      keepWithHeadings({ text: spans(parseInline(b.text)), margin: [0, 0, 0, 8] })
    } else if (headings.length && b.items.length > 1) {
      // Solo la prima voce resta col titolo, il resto dell'elenco può andare a capo pagina
      const [first, ...rest] = b.items
      keepWithHeadings(list(b.ordered, [first], { margin: [0, 0, 0, 0] }), list(b.ordered, rest, b.ordered ? { start: 2 } : {}))
    } else {
      keepWithHeadings(list(b.ordered, b.items))
    }
  }
  return [...out, ...headings]
}

function transcript(src: string): Node[] {
  const blocks = parseTranscript(src)
  const speakers = speakersOf(blocks)
  return blocks.map((b): Node =>
    isTurn(b)
      ? {
          text: [
            ...(b.time ? [{ text: b.time + '   ', color: C.muted, fontSize: 7.5 }] : []),
            ...(b.speaker ? [{ text: b.speaker + '  ', bold: true, color: SPEAKER_COLORS[speakers.indexOf(b.speaker) % SPEAKER_COLORS.length] }] : []),
            b.text,
          ],
          margin: [0, 0, 0, 5],
        }
      : { text: b.text, italics: true, color: C.muted, fontSize: 8, margin: [0, 2, 0, 7] }
  )
}

function sectionTitle(label: string, pageBreak: boolean): Node {
  return {
    stack: [
      { text: label.toUpperCase(), style: 'section' },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 499, y2: 0, lineWidth: 0.6, lineColor: C.rule }], margin: [0, 4, 0, 12] },
    ],
    ...(pageBreak ? { pageBreak: 'before' } : {}),
  }
}

export function pdfFileName(m: Meeting): string {
  const clean = m.title.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim()
  return `COINCIDENZE - Riunione ${m.meeting_date} - ${clean}.pdf`
}

export async function buildMeetingPdf(m: Meeting, sections: PdfSection[]): Promise<Blob> {
  setupFonts()
  const date = fmtMeetingDate(m.meeting_date)
  const dateLabel = date.charAt(0).toUpperCase() + date.slice(1)

  const body: Node[] = []
  sections.forEach((key, i) => {
    const label = PDF_SECTIONS.find((s) => s.key === key)!.label
    // Materiale e trascrizione partono su una pagina nuova, se non sono la prima sezione
    body.push(sectionTitle(label, i > 0 && key !== 'summary'))
    body.push(...(key === 'transcript' ? transcript(m.transcript) : markdown(m[key])))
  })

  const doc = {
    pageSize: 'A4',
    pageMargins: [48, 48, 48, 56],
    info: { title: `${m.title} (${m.meeting_date})`, author: 'COINCIDENZE', subject: 'Riunione organizzativa' },
    images: { logo: abs('/logo-coincidenze.png') },
    defaultStyle: { font: 'Inter', fontSize: 9.5, lineHeight: 1.3, color: C.light },
    styles: {
      title: { font: 'Playfair', fontSize: 22, color: C.navy, lineHeight: 1.1 },
      h1: { font: 'Playfair', fontSize: 16, color: C.navy, margin: [0, 10, 0, 6] },
      h2: { font: 'Playfair', fontSize: 13.5, color: C.navy, margin: [0, 12, 0, 6] },
      h3: { bold: true, fontSize: 10, color: C.viola, margin: [0, 6, 0, 4] },
      section: { bold: true, fontSize: 8, color: C.navy, characterSpacing: 1.2 },
    },
    content: [
      { image: 'logo', width: 150, margin: [0, 0, 0, 22] },
      { text: dateLabel, color: C.muted, fontSize: 9 },
      { text: m.title, style: 'title', margin: [0, 2, 0, 4] },
      ...(m.participants ? [{ text: m.participants, color: C.light, margin: [0, 0, 0, 0] }] : []),
      { text: '', margin: [0, 0, 0, 20] },
      ...body,
    ],
    footer: (page: number, pages: number) => ({
      columns: [
        { text: `COINCIDENZE · ${m.title} · ${dateLabel}`, color: C.muted, fontSize: 7.5 },
        { text: `${page} / ${pages}`, alignment: 'right', color: C.muted, fontSize: 7.5, width: 40 },
      ],
      margin: [48, 18, 48, 0],
    }),
  }
  return pdfMake.createPdf(doc).getBlob()
}
