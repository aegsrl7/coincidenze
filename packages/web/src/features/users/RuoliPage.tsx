import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, Loader2, ShieldCheck, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useRolesStore } from '@/stores/rolesStore'
import type { PermissionCatalog, Role } from '@/types'

/** Riepilogo leggibile: "Programma: vede, modifica" per ogni area con permessi. */
function summary(role: Role, catalog: PermissionCatalog): string[] {
  return catalog.areas.flatMap((area) => {
    const actions = area.actions.filter((a) => role.permissions.includes(`${area.key}.${a}`))
    return actions.length ? [`${area.label}: ${actions.map((a) => catalog.actions[a]?.toLowerCase() ?? a).join(', ')}`] : []
  })
}

/**
 * Stesse regole del server: elimina implica modifica, modifica implica vede.
 * Togliendo "vede" si tolgono anche modifica ed elimina dell'area.
 */
function toggle(perms: string[], area: { key: string; actions: string[] }, action: string): string[] {
  const set = new Set(perms)
  const key = `${area.key}.${action}`
  const has = (a: string) => area.actions.includes(a)
  if (set.has(key)) {
    set.delete(key)
    if (action === 'view') { set.delete(`${area.key}.edit`); set.delete(`${area.key}.delete`) }
    if (action === 'edit') set.delete(`${area.key}.delete`)
  } else {
    set.add(key)
    if (action === 'delete' && has('edit')) set.add(`${area.key}.edit`)
    if ((action === 'edit' || action === 'delete') && has('view')) set.add(`${area.key}.view`)
  }
  return [...set]
}

export function RuoliPage() {
  const { roles, catalog, loading, error, fetchRoles, deleteRole } = useRolesStore()
  const [editing, setEditing] = useState<Role | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => { fetchRoles() }, [fetchRoles])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError('')
    try {
      await deleteRole(deleteTarget.id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Eliminazione non riuscita')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <p className="text-sm text-ink-muted">Ogni ruolo è un insieme di permessi. Le modifiche valgono subito per tutti gli utenti con quel ruolo.</p>
        <Button className="ml-auto" onClick={() => setEditing('new')} disabled={!catalog}>
          <Plus className="h-4 w-4" />
          Nuovo ruolo
        </Button>
      </div>

      {(error || actionError) && <p className="text-sm text-bordeaux mb-4">{actionError || error}</p>}

      {loading && roles.length === 0 ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-navy/40" /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {catalog && roles.map((role) => (
            <div key={role.id} className="bg-white/60 rounded-xl border border-navy/10 p-4 flex flex-col">
              <div className="flex items-start gap-2">
                {role.is_system && <ShieldCheck className="h-4 w-4 text-viola mt-1 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-semibold text-navy">{role.name}</h3>
                  <p className="text-xs text-ink-muted">{role.users === 1 ? '1 utente' : `${role.users} utenti`}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(role)} title={role.is_system ? 'Vedi i permessi' : 'Modifica'}>
                    {role.is_system ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    {role.is_system ? 'Vedi' : 'Modifica'}
                  </Button>
                  {!role.is_system && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-bordeaux hover:text-bordeaux hover:bg-bordeaux/10"
                      onClick={() => setDeleteTarget(role)}
                      title={role.users > 0 ? 'Assegna prima un altro ruolo ai suoi utenti' : 'Elimina'}
                      disabled={role.users > 0}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              {role.description && <p className="text-sm text-ink-light mt-2">{role.description}</p>}
              <ul className="mt-3 space-y-0.5 text-xs text-ink-muted">
                {role.is_system
                  ? <li>Tutti i permessi</li>
                  : summary(role, catalog).map((line) => <li key={line}>{line}</li>)}
                {!role.is_system && role.permissions.length === 0 && <li>Nessun permesso</li>}
              </ul>
            </div>
          ))}
        </div>
      )}

      {editing && catalog && (
        <RoleDialog role={editing === 'new' ? null : editing} catalog={catalog} onClose={() => setEditing(null)} />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Elimina ruolo"
        message={deleteTarget ? `Eliminare il ruolo ${deleteTarget.name}?` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}

function RoleDialog({ role, catalog, onClose }: { role: Role | null; catalog: PermissionCatalog; onClose: () => void }) {
  const { createRole, updateRole } = useRolesStore()
  const readOnly = role?.is_system ?? false
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? [])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const data = { name, description, permissions }
      if (role) await updateRole(role.id, data)
      else await createRole(data)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvataggio non riuscito')
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{readOnly ? role!.name : role ? `Modifica ${role.name}` : 'Nuovo ruolo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {readOnly ? (
            <p className="text-sm text-ink-light">Il ruolo Amministratore ha sempre tutti i permessi e non si modifica.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-[1fr,2fr]">
              <div>
                <label className="text-xs font-medium text-ink-muted">Nome</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Descrizione</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A chi serve questo ruolo" />
              </div>
            </div>
          )}

          <div className="rounded-lg border border-navy/10 divide-y divide-navy/5">
            {catalog.areas.map((area) => {
              const hints = area.actions.map((a) => catalog.hints[`${area.key}.${a}`]).filter(Boolean)
              return (
                <div key={area.key} className="px-3 py-2.5 sm:flex sm:items-start sm:gap-4">
                  <div className="sm:w-48 shrink-0">
                    <p className="text-sm font-medium text-navy">{area.label}</p>
                    {hints.length > 0 && <p className="text-[11px] text-ink-muted leading-snug">{hints.join('. ')}</p>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 sm:mt-0">
                    {area.actions.map((action) => {
                      const key = `${area.key}.${action}`
                      return (
                        <label key={key} className="inline-flex items-center gap-1.5 text-sm text-ink-light">
                          <input
                            type="checkbox"
                            checked={readOnly || permissions.includes(key)}
                            disabled={readOnly}
                            onChange={() => setPermissions((p) => toggle(p, area, action))}
                          />
                          {catalog.actions[action] ?? action}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {error && <p className="text-sm text-bordeaux">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{readOnly ? 'Chiudi' : 'Annulla'}</Button>
            {!readOnly && <Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Salvataggio...' : 'Salva'}</Button>}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
