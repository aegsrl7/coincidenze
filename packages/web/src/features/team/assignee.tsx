import type { OrgUser, Task, TeamMember } from '@/types'

/**
 * Un compito va a un utente del sito oppure a una persona senza accesso. Nei menu a tendina il valore
 * è "u:<id utente>" o "m:<id persona>"; verso l'API diventa assigneeUserId o assigneeId.
 */
export const assigneeValue = (t: Pick<Task, 'assignee_id' | 'assignee_user_id'>) =>
  t.assignee_user_id ? `u:${t.assignee_user_id}` : t.assignee_id ? `m:${t.assignee_id}` : ''

export const assigneePayload = (value: string) => ({
  assigneeUserId: value.startsWith('u:') ? value.slice(2) : undefined,
  assigneeId: value.startsWith('m:') ? value.slice(2) : undefined,
})

/** Le persone del team che hanno già un utente compaiono come utenti, non qui */
export const withoutAccess = (members: TeamMember[]) => members.filter((m) => !m.user_id)

export function assigneeName(t: Pick<Task, 'assignee_id' | 'assignee_user_id'>, users: OrgUser[], members: TeamMember[]): string | null {
  if (t.assignee_user_id) return users.find((u) => u.id === t.assignee_user_id)?.name ?? null
  if (t.assignee_id) return members.find((m) => m.id === t.assignee_id)?.name ?? null
  return null
}

/** "Marco" trova "Marco Salzotto"; prima tra gli utenti, poi tra chi non ha accesso. "Tutti" non trova nessuno. */
export function assigneeFor(owner: string, users: OrgUser[], members: TeamMember[]): string {
  const o = owner.trim().toLowerCase()
  if (!o) return ''
  const match = <T extends { name: string }>(list: T[]) =>
    list.find((x) => x.name.trim().toLowerCase() === o) ?? list.find((x) => x.name.trim().toLowerCase().split(/\s+/)[0] === o)
  const user = match(users)
  if (user) return `u:${user.id}`
  const member = match(withoutAccess(members))
  return member ? `m:${member.id}` : ''
}

export function AssigneeOptions({ users, members }: { users: OrgUser[]; members: TeamMember[] }) {
  const others = withoutAccess(members)
  return (
    <>
      <option value="">Nessuno</option>
      {users.length > 0 && (
        <optgroup label="Con accesso al sito">
          {users.map((u) => <option key={u.id} value={`u:${u.id}`}>{u.name}</option>)}
        </optgroup>
      )}
      {others.length > 0 && (
        <optgroup label="Senza accesso">
          {others.map((m) => <option key={m.id} value={`m:${m.id}`}>{m.name}</option>)}
        </optgroup>
      )}
    </>
  )
}
