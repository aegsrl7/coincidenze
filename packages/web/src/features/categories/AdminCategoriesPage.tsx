import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Loader2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useCategoriesStore } from '@/stores/categoriesStore'
import type { Category } from '@/types'

type CatType = 'artist' | 'menu'

export function AdminCategoriesPage() {
  const { categories, fetched, loading, refetch, create, update, remove, reorder } = useCategoriesStore()

  useEffect(() => {
    if (!fetched) refetch()
  }, [fetched, refetch])

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-navy">Categorie</h1>
        <p className="text-sm text-ink-muted mt-1">
          Gestisci le categorie usate da artisti e piatti del menu. Modifiche applicate immediatamente a tutto il sito.
        </p>
      </div>

      {loading && categories.length === 0 ? (
        <div className="py-20 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-navy/50 mx-auto" />
        </div>
      ) : (
        <div className="space-y-10">
          <CategorySection
            type="artist"
            title="Categorie artisti"
            description="Applicate agli artisti e usate per il colore nei punti colorati del programma e del canvas."
            withColor
            categories={categories.filter((c) => c.type === 'artist')}
            onCreate={create}
            onUpdate={update}
            onRemove={remove}
            onReorder={reorder}
          />
          <CategorySection
            type="menu"
            title="Categorie menu"
            description="Applicate ai piatti del menu. Usate per raggrupparli nella tab Menù."
            categories={categories.filter((c) => c.type === 'menu')}
            onCreate={create}
            onUpdate={update}
            onRemove={remove}
            onReorder={reorder}
          />
        </div>
      )}
    </div>
  )
}

interface SectionProps {
  type: CatType
  title: string
  description: string
  withColor?: boolean
  categories: Category[]
  onCreate: (data: Partial<Category>) => Promise<Category>
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onReorder: (order: string[]) => Promise<void>
}

function CategorySection({
  type, title, description, withColor, categories, onCreate, onUpdate, onRemove, onReorder,
}: SectionProps) {
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('#2C3E6B')
  const [creating, setCreating] = useState(false)
  const [err, setErr] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ label: string; color: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [dragId, setDragId] = useState<string | null>(null)
  const [localOrder, setLocalOrder] = useState<Category[] | null>(null)

  const ordered = useMemo(() => {
    if (localOrder) return localOrder
    return [...categories].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label))
  }, [localOrder, categories])

  const handleAdd = async () => {
    const label = newLabel.trim()
    if (!label) return
    setErr('')
    setCreating(true)
    try {
      await onCreate({ type, label, color: withColor ? newColor : '' })
      setNewLabel('')
      setNewColor('#2C3E6B')
      setAdding(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Errore')
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (c: Category) => {
    setEditingId(c.id)
    setEditDraft({ label: c.label, color: c.color || '#2C3E6B' })
  }

  const saveEdit = async () => {
    if (!editingId || !editDraft) return
    setSaving(true)
    try {
      await onUpdate(editingId, {
        label: editDraft.label,
        color: withColor ? editDraft.color : '',
      })
      setEditingId(null)
      setEditDraft(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await onRemove(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) return
    const list = localOrder || ordered
    const from = list.findIndex((x) => x.id === dragId)
    const to = list.findIndex((x) => x.id === targetId)
    if (from < 0 || to < 0) return
    const next = [...list]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setLocalOrder(next)
  }

  const handleDragEnd = async () => {
    if (!dragId) return
    setDragId(null)
    if (localOrder) {
      await onReorder(localOrder.map((c) => c.id))
      setLocalOrder(null)
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-navy">{title}</h2>
          <p className="text-xs text-ink-muted">{description}</p>
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Nuova
          </Button>
        )}
      </div>

      {adding && (
        <div className="bg-white/70 rounded-lg border border-navy/10 p-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Nome categoria (es. Fumetto)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              autoFocus
              className="flex-1 min-w-[180px]"
            />
            {withColor && (
              <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                Colore
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-8 w-10 rounded border border-navy/20 cursor-pointer"
                />
              </label>
            )}
            <Button size="sm" onClick={handleAdd} disabled={creating || !newLabel.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salva
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setNewLabel(''); setErr('') }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {err && <p className="text-xs text-bordeaux mt-2">{err}</p>}
        </div>
      )}

      {ordered.length === 0 ? (
        <div className="py-10 text-center rounded-xl border border-dashed border-navy/15 bg-white/30">
          <p className="text-sm text-ink-muted italic">Nessuna categoria. Aggiungine una qui sopra.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {ordered.map((c) => {
            const isEditing = editingId === c.id
            return (
              <div
                key={c.id}
                draggable={!isEditing}
                onDragStart={() => setDragId(c.id)}
                onDragOver={(e) => handleDragOver(e, c.id)}
                onDragEnd={handleDragEnd}
                className={`bg-white/60 rounded-lg border border-navy/8 p-3 flex items-center gap-3 ${dragId === c.id ? 'opacity-50' : ''}`}
              >
                {!isEditing && (
                  <GripVertical className="h-4 w-4 text-ink-muted cursor-grab shrink-0" />
                )}
                {withColor && (
                  isEditing && editDraft ? (
                    <input
                      type="color"
                      value={editDraft.color}
                      onChange={(e) => setEditDraft({ ...editDraft, color: e.target.value })}
                      className="h-8 w-10 rounded border border-navy/20 cursor-pointer shrink-0"
                    />
                  ) : (
                    <span
                      className="h-6 w-6 rounded-md shrink-0 border border-navy/10"
                      style={{ backgroundColor: c.color || '#2C3E6B' }}
                    />
                  )
                )}
                <div className="flex-1 min-w-0">
                  {isEditing && editDraft ? (
                    <Input
                      value={editDraft.label}
                      onChange={(e) => setEditDraft({ ...editDraft, label: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-medium text-navy">{c.label}</p>
                      <span className="text-[11px] font-mono text-ink-muted">{c.slug}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isEditing ? (
                    <>
                      <button onClick={saveEdit} disabled={saving} className="p-1.5 rounded hover:bg-navy/5 text-navy" title="Salva">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button onClick={() => { setEditingId(null); setEditDraft(null) }} className="p-1.5 rounded hover:bg-navy/5 text-ink-muted" title="Annulla">
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(c)} className="p-1.5 rounded hover:bg-navy/5 text-ink-muted hover:text-navy" title="Modifica">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded hover:bg-bordeaux/10 text-ink-muted hover:text-bordeaux" title="Elimina">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Elimina categoria"
        message={
          deleteTarget
            ? `Eliminare "${deleteTarget.label}"? Artisti o piatti che la usano continueranno a funzionare ma verranno mostrati con label di default.`
            : ''
        }
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </section>
  )
}
