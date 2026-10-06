import type { Meeting, Task, TeamMember } from '@/types'
import { fmtMeetingDate } from './RiunioniPage'

/** Sezione dei punti chiave le cui voci si possono mandare nel kanban */
export const isTodoSection = (heading: string | null) => heading != null && /^da fare\b/i.test(heading.trim())

export interface TodoDraft {
  /** Nome in grassetto all'inizio della voce (es. "Marco"), vuoto se manca */
  owner: string
  title: string
  description: string
}

const meetingRef = (m: Meeting) => `/admin/riunioni/${m.id}`

/**
 * "**Marco**: chiamare l'agenzia. Matteo mercoledì c'è. (1:09:12)" diventa
 * titolo "Chiamare l'agenzia.", note "Matteo mercoledì c'è." più il rimando alla riunione.
 */
export function todoDraft(item: string, m: Meeting): TodoDraft {
  const owned = /^\*\*(.+?)\*\*\s*:\s*([\s\S]*)$/.exec(item.trim())
  const owner = owned ? owned[1].trim() : ''
  const text = (owned ? owned[2] : item)
    .replace(/\s*\((?:\d{1,2}:)?\d{1,2}:\d{2}(?:,\s*(?:\d{1,2}:)?\d{1,2}:\d{2})*\)\s*$/, '') // minuti della trascrizione
    .replace(/\*\*?/g, '')
    .trim()
  const cut = text.search(/[.!?](\s|$)/)
  const first = cut >= 0 ? text.slice(0, cut + 1) : text
  const rest = cut >= 0 ? text.slice(cut + 1).trim() : ''
  const date = fmtMeetingDate(m.meeting_date).replace(/^\S+\s/, '') // senza il giorno della settimana
  return {
    owner,
    title: first.charAt(0).toUpperCase() + first.slice(1),
    description: [rest, `Dalla riunione "${m.title}" del ${date}: ${meetingRef(m)}`].filter(Boolean).join('\n\n'),
  }
}

/** Il task nasce da questa voce se rimanda alla riunione e ha ancora il titolo proposto */
export const taskMatches = (t: Task, draft: TodoDraft, m: Meeting) =>
  (t.description ?? '').includes(meetingRef(m)) && t.title.trim().toLowerCase() === draft.title.trim().toLowerCase()

/** "Marco" trova "Marco Rossi"; "Tutti" o "Da assegnare" non trovano nessuno */
export function memberFor(owner: string, members: TeamMember[]): string {
  const o = owner.trim().toLowerCase()
  if (!o) return ''
  const hit = members.find((mb) => mb.name.trim().toLowerCase() === o) ??
    members.find((mb) => mb.name.trim().toLowerCase().split(/\s+/)[0] === o)
  return hit?.id ?? ''
}
