import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Check, Loader2, GripVertical } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useCategoryMaps } from '@/stores/categoriesStore'
import { api } from '@/lib/api'
import type { MenuItem } from '@/types'

function emptyDraft(): Omit<MenuItem, 'id' | 'created_at' | 'updated_at' | 'sort_order'> {
  return { category: '', name: '', description: '', price: '', notes: '' }
}

type Group = { label: string; items: MenuItem[]; empty: boolean }

export function AdminMenuPage() {
  const { list: menuCats } = useCategoryMaps('menu')
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState(emptyDraft())
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<MenuItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const load = async () => {
    setLoading(true)
    try {
      const data = (await api.getMenu()) as MenuItem[]
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const categorySuggestions = useMemo(() => {
    const set = new Set<string>()
    for (const c of menuCats) set.add(c.label)
    for (const item of items) if (item.category) set.add(item.category)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [items, menuCats])

  // Bucket items per categoria; ordine = ordine definito in /admin/categorie.
  // Categorie senza voci: in fondo, in grigio. Voci con label non riconosciuta:
  // raggruppate in "Senza categoria" alla fine.
  const grouped = useMemo<Group[]>(() => {
    const buckets = new Map<string, MenuItem[]>()
    for (const c of menuCats) buckets.set(c.label, [])
    const orphans: MenuItem[] = []
    for (const item of items) {
      const k = item.category || ''
      if (k && buckets.has(k)) buckets.get(k)!.push(item)
      else orphans.push(item)
    }
    const withItems: Group[] = []
    const empty: Group[] = []
    for (const c of menuCats) {
      const list = buckets.get(c.label) || []
      if (list.length > 0) withItems.push({ label: c.label, items: list, empty: false })
      else empty.push({ label: c.label, items: list, empty: true })
    }
    const out: Group[] = [...withItems, ...empty]
    if (orphans.length > 0) out.push({ label: 'Senza categoria', items: orphans, empty: false })
    return out
  }, [items, menuCats])

  const handleAdd = async () => {
    if (!draft.name.trim()) return
    setAdding(true)
    try {
      await api.createMenuItem({ ...draft, sort_order: items.length })
      setDraft(emptyDraft())
      await load()
    } finally {
      setAdding(false)
    }
  }

  const handleStartEdit = (item: MenuItem) => {
    setEditingId(item.id)
    setEditDraft({ ...item })
  }

  const handleSaveEdit = async () => {
    if (!editDraft) return
    await api.updateMenuItem(editDraft.id, editDraft)
    setEditingId(null)
    setEditDraft(null)
    await load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteMenuItem(deleteTarget.id)
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  // Reorder solo dentro la stessa categoria. Trovo il bucket dell'item attivo,
  // applico arrayMove sui suoi indici, poi ricostruisco l'array piatto e salvo
  // una volta sola.
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const activeId = String(active.id)
    const overId = String(over.id)

    const activeItem = items.find((i) => i.id === activeId)
    const overItem = items.find((i) => i.id === overId)
    if (!activeItem || !overItem) return
    if (activeItem.category !== overItem.category) return

    const bucket = items.filter((i) => i.category === activeItem.category)
    const oldIdx = bucket.findIndex((i) => i.id === activeId)
    const newIdx = bucket.findIndex((i) => i.id === overId)
    if (oldIdx < 0 || newIdx < 0) return
    const reordered = arrayMove(bucket, oldIdx, newIdx)

    const reorderedIds = new Set(reordered.map((i) => i.id))
    let cursor = 0
    const next = items.map((i) => (reorderedIds.has(i.id) ? reordered[cursor++] : i))

    setItems(next)
    api.reorderMenu(next.map((i) => i.id))
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h1 className="font-display text-2xl font-semibold text-navy">Menù</h1>
        <Link to="/admin/categorie" className="text-xs text-ink-muted hover:text-navy underline">
          Riordina o rinomina le categorie →
        </Link>
      </div>

      <div className="bg-white/70 rounded-lg border border-navy/10 p-4 mb-6">
        <p className="text-xs text-ink-muted mb-2">Aggiungi voce</p>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
          <div className="sm:col-span-2">
            <Input
              list="menu-categories"
              placeholder="Categoria"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            />
            <datalist id="menu-categories">
              {categorySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="sm:col-span-2">
            <Input
              placeholder="Nome *"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div>
            <Input
              placeholder="Prezzo"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            />
          </div>
          <Button onClick={handleAdd} disabled={adding || !draft.name.trim()}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Aggiungi
          </Button>
        </div>
        <Input
          className="mt-2"
          placeholder="Descrizione (opzionale)"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </div>

      {loading && items.length === 0 ? (
        <div className="py-20 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-navy/50 mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-navy/15 bg-white/30">
          <p className="text-sm text-ink-muted italic">Nessuna voce di menu. Aggiungine una qui sopra.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            {grouped.map(({ label: cat, items: group, empty }) => (
              <section key={cat} className={empty ? 'opacity-50' : ''}>
                <h2 className={`font-display text-lg font-semibold mb-2 ${empty ? 'text-ink-muted italic' : 'text-navy'}`}>
                  {cat}
                  {empty && (
                    <span className="ml-2 text-xs font-normal not-italic text-ink-muted">(vuota)</span>
                  )}
                </h2>
                {empty ? (
                  <p className="text-xs text-ink-muted italic px-1">
                    Nessuna voce. Usa il form sopra per aggiungerne, oppure rinomina/elimina la categoria da{' '}
                    <Link to="/admin/categorie" className="underline">/admin/categorie</Link>.
                  </p>
                ) : (
                  <SortableContext items={group.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {group.map((item) => (
                        <SortableMenuRow
                          key={item.id}
                          item={item}
                          isEditing={editingId === item.id}
                          editDraft={editingId === item.id ? editDraft : null}
                          setEditDraft={setEditDraft}
                          onStartEdit={handleStartEdit}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={() => {
                            setEditingId(null)
                            setEditDraft(null)
                          }}
                          onDelete={(it) => setDeleteTarget(it)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </section>
            ))}
          </div>
        </DndContext>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Elimina voce menu"
        message={deleteTarget ? `Eliminare "${deleteTarget.name}"?` : ''}
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}

interface SortableRowProps {
  item: MenuItem
  isEditing: boolean
  editDraft: MenuItem | null
  setEditDraft: (m: MenuItem | null) => void
  onStartEdit: (item: MenuItem) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: (item: MenuItem) => void
}

function SortableMenuRow({
  item,
  isEditing,
  editDraft,
  setEditDraft,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isEditing })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white/60 rounded-lg border border-navy/8 p-3 flex items-start gap-2 ${isDragging ? 'shadow-md' : ''}`}
    >
      {!isEditing && (
        <button
          {...attributes}
          {...listeners}
          className="touch-none mt-1 p-0.5 rounded hover:bg-navy/5 text-ink-muted cursor-grab active:cursor-grabbing shrink-0"
          aria-label="Trascina per riordinare"
          title="Trascina per riordinare"
          type="button"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        {isEditing && editDraft ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Input
                list="menu-categories"
                placeholder="Categoria"
                value={editDraft.category}
                onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })}
              />
              <Input
                placeholder="Nome"
                value={editDraft.name}
                onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                className="sm:col-span-2"
              />
              <Input
                placeholder="Prezzo"
                value={editDraft.price}
                onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })}
              />
            </div>
            <Input
              placeholder="Descrizione"
              value={editDraft.description}
              onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
            />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy">{item.name}</p>
              {item.description && (
                <p className="text-xs text-ink-light mt-0.5">{item.description}</p>
              )}
            </div>
            {item.price && (
              <p className="text-sm font-medium text-navy shrink-0">{item.price}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isEditing ? (
          <>
            <button onClick={onSaveEdit} className="p-1.5 rounded hover:bg-navy/5 text-navy" title="Salva">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={onCancelEdit} className="p-1.5 rounded hover:bg-navy/5 text-ink-muted" title="Annulla">
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => onStartEdit(item)} className="p-1.5 rounded hover:bg-navy/5 text-ink-muted hover:text-navy" title="Modifica">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(item)} className="p-1.5 rounded hover:bg-bordeaux/10 text-ink-muted hover:text-bordeaux" title="Elimina">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
