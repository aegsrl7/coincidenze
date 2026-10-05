import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "2027-04-25" → "domenica 25 aprile 2027". Con `withYear: false` → "domenica 25 aprile". */
export function formatItalianDate(iso: string, { withYear = true }: { withYear?: boolean } = {}): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Riga data di un'edizione: il sottotitolo scritto a mano se c'è, altrimenti la data evento. */
export function editionDateLine(edition: { hero_subtitle: string; event_date: string }): string {
  return edition.hero_subtitle || capitalize(formatItalianDate(edition.event_date))
}
