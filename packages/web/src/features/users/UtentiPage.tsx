import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Plus, Pencil, Send, Trash2, Loader2, Copy, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useUsersStore } from '@/stores/usersStore'
import { useRolesStore } from '@/stores/rolesStore'
import { useAuthStore } from '@/stores/authStore'
import type { AccessLinkResult } from '@/lib/api'
import type { AdminUser, Role } from '@/types'

const selectCls = 'flex h-9 w-full rounded-md border border-navy/20 bg-crema px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 disabled:opacity-50'

const STATUS_STYLE: Record<AdminUser['status'], string> = {
  attivo: 'bg-green-50 text-green-800 border-green-200',
  invitato: 'bg-amber-50 text-amber-900 border-amber-200',
  disattivato: 'bg-navy/5 text-ink-muted border-navy/10',
}

function fmtDate(s: string | null): string {
  if (!s) return 'mai'
  const d = new Date(s.replace(' ', 'T') + 'Z')
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Messaggio dopo un invito o un nuovo link: email partita, oppure link da inoltrare a mano. */
type Notice = { kind: 'ok'; text: string } | { kind: 'link'; text: string; link: string } | { kind: 'error'; text: string }

function noticeFor(res: AccessLinkResult, email: string, what: string): Notice {
  return res.email_sent || !res.link
    ? { kind: 'ok', text: `${what} mandato a ${email}.` }
    : { kind: 'link', text: `L'email per ${email} non è partita. Copia il link e mandalo tu:`, link: res.link }
}

export function UtentiPage() {
  const { users, loading, error, fetchUsers, sendLink, deleteUser } = useUsersStore()
  const { roles, fetchRoles } = useRolesStore()
  const me = useAuthStore((s) => s.user)

  const [inviting, setInviting] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [fetchUsers, fetchRoles])

  const handleSendLink = async (u: AdminUser) => {
    setBusyId(u.id)
    setNotice(null)
    try {
      const res = await sendLink(u.id)
      setNotice(noticeFor(res, u.email, u.status === 'invitato' ? 'Nuovo invito' : 'Link per una nuova password'))
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Invio non riuscito' })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteUser(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Eliminazione non riuscita' })
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <p className="text-sm text-ink-muted">Chi entra nell'area riservata e con quale ruolo. I permessi dei ruoli si cambiano dalla pagina Ruoli e permessi.</p>
        <Button className="ml-auto" onClick={() => { setNotice(null); setInviting(true) }}>
          <Plus className="h-4 w-4" />
          Invita utente
        </Button>
      </div>

      {notice && <NoticeBox notice={notice} onClose={() => setNotice(null)} />}
      {error && <p className="text-sm text-bordeaux mb-4">{error}</p>}

      {loading && users.length === 0 ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-navy/40" /></div>
      ) : (
        <div className="bg-white/60 rounded-xl border border-navy/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-ink-muted border-b border-navy/10">
                <th className="px-3 py-2 font-medium">Utente</th>
                <th className="px-3 py-2 font-medium hidden sm:table-cell">Ruolo</th>
                <th className="px-3 py-2 font-medium">Stato</th>
                <th className="px-3 py-2 font-medium hidden md:table-cell">Ultimo accesso</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-navy/5 last:border-0">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-navy">{u.name}{u.id === me?.id && <span className="ml-1.5 text-xs text-viola">(tu)</span>}</p>
                    <p className="text-xs text-ink-muted break-all">{u.email}</p>
                    <p className="text-xs text-ink-light sm:hidden">{u.role.name}</p>
                  </td>
                  <td className="px-3 py-2.5 text-ink-light hidden sm:table-cell">{u.role.name}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLE[u.status]}`}>{u.status}</span>
                  </td>
                  <td className="px-3 py-2.5 text-ink-muted hidden md:table-cell whitespace-nowrap">{fmtDate(u.last_login_at)}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <IconButton title="Modifica" onClick={() => { setNotice(null); setEditing(u) }}><Pencil className="h-3.5 w-3.5" /></IconButton>
                    {u.active && (
                      <IconButton
                        title={u.status === 'invitato' ? 'Rimanda l\'invito' : 'Manda un link per una nuova password'}
                        onClick={() => handleSendLink(u)}
                        disabled={busyId === u.id}
                      >
                        {busyId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      </IconButton>
                    )}
                    {u.id !== me?.id && (
                      <IconButton title="Elimina" danger onClick={() => setDeleteTarget(u)}><Trash2 className="h-3.5 w-3.5" /></IconButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inviting && (
        <InviteDialog
          roles={roles}
          onClose={() => setInviting(false)}
          onInvited={(res, email) => { setInviting(false); setNotice(noticeFor(res, email, 'Invito')) }}
        />
      )}
      {editing && <EditDialog user={editing} roles={roles} isMe={editing.id === me?.id} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Elimina utente"
        message={deleteTarget ? `Eliminare ${deleteTarget.name} (${deleteTarget.email})? Perde subito l'accesso. Per sospenderlo senza cancellarlo usa Modifica e togli "Attivo".` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}

function IconButton({ title, onClick, disabled, danger, children }: {
  title: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center h-7 w-7 rounded text-ink-muted disabled:opacity-50 ${
        danger ? 'hover:bg-bordeaux/10 hover:text-bordeaux' : 'hover:bg-navy/5 hover:text-navy'
      }`}
    >
      {children}
    </button>
  )
}

function NoticeBox({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const tone = notice.kind === 'error'
    ? 'border-bordeaux/30 bg-bordeaux/5 text-bordeaux'
    : notice.kind === 'link' ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-green-300 bg-green-50 text-green-800'
  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 text-sm flex gap-3 ${tone}`}>
      <div className="flex-1 min-w-0">
        <p>{notice.text}</p>
        {notice.kind === 'link' && (
          <div className="mt-2 flex gap-2">
            <Input readOnly value={notice.link} className="font-mono text-xs bg-white" onFocus={(e) => e.currentTarget.select()} />
            <Button
              size="sm"
              variant="outline"
              onClick={async () => { await navigator.clipboard.writeText(notice.link); setCopied(true) }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiato' : 'Copia'}
            </Button>
          </div>
        )}
      </div>
      <button type="button" onClick={onClose} aria-label="Chiudi" className="self-start opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function RoleSelect({ roles, value, onChange, disabled }: { roles: Role[]; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const selected = roles.find((r) => r.id === value)
  return (
    <>
      <select className={selectCls} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} required>
        <option value="" disabled>Scegli un ruolo</option>
        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      {selected?.description && <p className="text-[11px] text-ink-muted mt-1">{selected.description}</p>}
    </>
  )
}

function InviteDialog({ roles, onClose, onInvited }: {
  roles: Role[]; onClose: () => void; onInvited: (res: AccessLinkResult, email: string) => void
}) {
  const inviteUser = useUsersStore((s) => s.inviteUser)
  const [form, setForm] = useState({ name: '', email: '', role_id: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await inviteUser(form)
      onInvited(res, form.email.trim().toLowerCase())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invito non riuscito')
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Invita utente</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-muted">Nome</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus required />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted">Email</label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted">Ruolo</label>
            <RoleSelect roles={roles} value={form.role_id} onChange={(v) => setForm({ ...form, role_id: v })} />
          </div>
          <p className="text-xs text-ink-muted">Riceverà un'email con un link valido 7 giorni per scegliere la sua password.</p>
          {error && <p className="text-sm text-bordeaux">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
            <Button type="submit" disabled={saving || !form.role_id}>{saving ? 'Invio...' : 'Manda invito'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditDialog({ user, roles, isMe, onClose }: { user: AdminUser; roles: Role[]; isMe: boolean; onClose: () => void }) {
  const updateUser = useUsersStore((s) => s.updateUser)
  const [form, setForm] = useState({ name: user.name, role_id: user.role.id, active: user.active })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await updateUser(user.id, form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvataggio non riuscito')
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Modifica {user.name}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-muted">Nome</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted">Email</label>
            <Input value={user.email} readOnly className="bg-beige/60" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted">Ruolo</label>
            <RoleSelect roles={roles} value={form.role_id} onChange={(v) => setForm({ ...form, role_id: v })} />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={form.active}
              disabled={isMe}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span>
              Attivo
              <span className="block text-xs text-ink-muted">
                {isMe ? 'Non puoi disattivare il tuo account.' : 'Togliendolo l\'utente esce subito e non può più entrare, finché non lo riattivi.'}
              </span>
            </span>
          </label>
          {error && <p className="text-sm text-bordeaux">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
