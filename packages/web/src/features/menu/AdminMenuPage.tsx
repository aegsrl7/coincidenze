import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Loader2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { api } from '@/lib/api'
import type { MenuItem } from '@/types'

const DEFAULT_CATEGORY_SUGGESTIONS = ['Antipasti', 'Primi', 'Secondi', 'Dolci', 'Vini', 'Bevande', 'Altro']

function emptyDraft(): Omit<MenuItem, 'id' | 'created_at' | 'updated_at' | 'sort_order'> {
  return { category: '', name: '', description: '', price: '', notes: '' }
}

export function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState(emptyDraft())
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<MenuItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.getMenu() as MenuItem[]
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Unione tra suggestions di default e categorie già presenti
  const categorySuggestions = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORY_SUGGESTIONS)
    for (const item of items) {
      if (item.category) set.add(item.category)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [items])

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>()
    for (const item of items) {
      const k = item.category || 'Senza categoria'
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(item)
    }
    return Array.from(map.entries())
  }, [items])

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

  const handleDragStart = (id: string) => setDragId(id)
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) return
    const from = items.findIndex((i) => i.id === dragId)
    const to = items.findIndex((i) => i.id === targetId)
    if (from < 0 || to < 0) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setItems(next)
  }
  const handleDragEnd = async () => {
    if (!dragId) return
    setDragId(null)
    await api.reorderMenu(items.map((i) => i.id))
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="font-display text-2xl font-semibold text-navy mb-4">Menù</h1>

      {/* Form aggiunta */}
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
        <div className="space-y-6">
          {grouped.map(([cat, group]) => (
            <section key={cat}>
              <h2 className="font-display text-lg font-semibold text-navy mb-2">{cat}</h2>
              <div className="space-y-1">
                {group.map((item) => {
                  const isEditing = editingId === item.id
                  return (
                    <div
                      key={item.id}
                      draggable={!isEditing}
                      onDragStart={() => handleDragStart(item.id)}
                      onDragOver={(e) => handleDragOver(e, item.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white/60 rounded-lg border border-navy/8 p-3 flex items-start gap-2 ${dragId === item.id ? 'opacity-50' : ''}`}
                    >
                      {!isEditing && (
                        <GripVertical className="h-4 w-4 text-ink-muted mt-1 cursor-grab shrink-0" />
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
                            <button onClick={handleSaveEdit} className="p-1.5 rounded hover:bg-navy/5 text-navy" title="Salva">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => { setEditingId(null); setEditDraft(null) }} className="p-1.5 rounded hover:bg-navy/5 text-ink-muted" title="Annulla">
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleStartEdit(item)} className="p-1.5 rounded hover:bg-navy/5 text-ink-muted hover:text-navy" title="Modifica">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded hover:bg-bordeaux/10 text-ink-muted hover:text-bordeaux" title="Elimina">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
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
