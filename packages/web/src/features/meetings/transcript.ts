export interface TranscriptBlock {
  speaker: string
  time: string
  text: string
}

/** Un blocco per paragrafo: "**Nome** [hh:mm:ss] testo", anche senza nome o senza orario.
 *  Un blocco senza nome né orario è una nota (per esempio un taglio). */
export function parseTranscript(src: string): TranscriptBlock[] {
  return src
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = /^(?:\*\*(.+?)\*\*\s*)?(?:\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*)?([\s\S]*)$/.exec(p)!
      return { speaker: m[1] ?? '', time: m[2] ?? '', text: m[3] }
    })
}

export const isTurn = (b: TranscriptBlock) => Boolean(b.speaker || b.time)

/** Parlanti nell'ordine in cui compaiono: decide il colore di ognuno, uguale su pagina e PDF */
export const speakersOf = (blocks: TranscriptBlock[]) => [...new Set(blocks.map((b) => b.speaker).filter(Boolean))]
