import { useEffect, useState } from 'react'
import { Users, Plus, GripVertical, User, Trash2, UserPlus, X, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useTasksStore } from '@/stores/tasksStore'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthStore } from '@/stores/authStore'
import { CATEGORY_LABELS, CATEGORY_COLORS, type EventCategory, type Task, type TeamMember } from '@/types'
import { TaskFormDialog } from './TaskFormDialog'
import { MemberFormDialog } from './MemberFormDialog'

const COLUMNS = [
  { id: 'todo', label: 'Da Fare', color: '#2C3E6B' },
  { id: 'in_progress', label: 'In Corso', color: '#6B3FA0' },
  { id: 'done', label: 'Completato', color: '#2C6B4F' },
] as const

type ColumnId = typeof COLUMNS[number]['id']

export function TeamPage() {
  const { tasks, fetchTasks, updateTask, deleteTask } = useTasksStore()
  const { members, fetchMembers, createMember, deleteMember } = useTeamStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)

  useEffect(() => {
    fetchTasks()
    fetchMembers()
  }, [fetchTasks, fetchMembers])

  const getColumnTasks = (status: ColumnId) =>
    tasks.filter((t) => t.status === status)

  const getMemberName = (id: string | null | undefined) => {
    if (!id) return null
    return members.find((m) => m.id === id)?.name || null
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, colId: ColumnId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(colId)
  }

  const handleDragLeave = () => {
    setDragOverCol(null)
  }

  const handleDrop = async (status: ColumnId) => {
    setDragOverCol(null)
    if (!draggedTaskId) return
    const task = tasks.find((t) => t.id === draggedTaskId)
    if (task && task.status !== status) {
      await updateTask(draggedTaskId, { ...task, status })
    }
    setDraggedTaskId(null)
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
    setDragOverCol(null)
  }

  const handleDeleteTask = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await deleteTask(confirmDelete.id)
      setConfirmDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return
    await createMember({ name: newMemberName.trim(), role: newMemberRole.trim() })
    setNewMemberName('')
    setNewMemberRole('')
    setShowAddMember(false)
  }

  const priorityColors = {
    high: 'bg-bordeaux text-white',
    medium: 'bg-navy text-white',
    low: 'bg-beige-dark text-ink-light',
  }

  const priorityLabels = { high: 'Alta', medium: 'Media', low: 'Bassa' }

  return (
    <div className="p-4 sm:p-6 pb-8 space-y-8">
      {/* Sezione Membri */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          {isAuthenticated && (
            <Button
              size="sm"
              onClick={() => setShowAddMember(!showAddMember)}
            >
              {showAddMember ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {showAddMember ? 'Annulla' : 'Aggiungi Membro'}
            </Button>
          )}
          <h3 className="font-display text-sm font-semibold text-navy">Membri del Team</h3>
        </div>

        {isAuthenticated && showAddMember && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-md bg-beige-dark/50 border border-navy/10">
            <Input
              placeholder="Nome"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="flex-1 min-w-[150px]"
              onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
            />
            <Input
              placeholder="Ruolo"
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className="flex-1 min-w-[150px]"
              onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
            />
            <Button size="sm" onClick={handleAddMember} disabled={!newMemberName.trim()}>
              Aggiungi
            </Button>
          </div>
        )}

        {members.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {members.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-2 rounded-full bg-crema border border-navy/10 px-3 py-1.5 ${
                  isAuthenticated ? 'cursor-pointer hover:bg-beige-dark transition-colors' : ''
                }`}
                onClick={() => isAuthenticated && setEditingMember(m)}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-navy/10">
                  <User className="h-3 w-3 text-navy" />
                </div>
                <span className="text-sm text-navy">{m.name}</span>
                {m.role && <span className="text-[10px] text-ink-muted">{m.role}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Nessun membro nel team</p>
        )}
      </section>

      {/* Sezione Task */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          {isAuthenticated && (
            <Button size="sm" onClick={() => { setEditingTask(undefined); setShowForm(true) }}>
              <Plus className="h-4 w-4" /> Nuovo Task
            </Button>
          )}
          <h3 className="font-display text-sm font-semibold text-navy">Task</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className={`min-w-[280px] rounded-lg border-2 border-dashed p-3 transition-colors min-h-[200px] ${
              dragOverCol === col.id
                ? 'border-navy/40 bg-navy/5'
                : 'border-transparent bg-beige-dark/30'
            }`}
            onDragOver={isAuthenticated ? (e) => handleDragOver(e, col.id) : undefined}
            onDragLeave={isAuthenticated ? handleDragLeave : undefined}
            onDrop={isAuthenticated ? () => handleDrop(col.id) : undefined}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="font-display text-sm font-semibold text-navy">{col.label}</h3>
              <Badge variant="secondary" className="text-[10px]">
                {getColumnTasks(col.id).length}
              </Badge>
            </div>

            <div className="space-y-2 pb-2">
              {getColumnTasks(col.id).map((task) => (
                <Card
                  key={task.id}
                  draggable={isAuthenticated}
                  onDragStart={isAuthenticated ? (e) => handleDragStart(e, task.id) : undefined}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    if (isAuthenticated) {
                      setEditingTask(task)
                      setShowForm(true)
                    }
                  }}
                  className={`${isAuthenticated ? 'cursor-grab active:cursor-grabbing' : ''} transition-all ${
                    draggedTaskId === task.id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      {isAuthenticated && (
                        <GripVertical className="h-4 w-4 mt-0.5 text-ink-muted/50 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy">{task.title}</p>
                        {task.description && (
                          <p className="mt-1 text-xs text-ink-muted line-clamp-2">{task.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <Badge className={`text-[10px] ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
                            {priorityLabels[task.priority as keyof typeof priorityLabels] || 'Media'}
                          </Badge>
                          {task.category && (
                            <Badge
                              className="text-[10px]"
                              style={{ backgroundColor: CATEGORY_COLORS[task.category as EventCategory] }}
                            >
                              {CATEGORY_LABELS[task.category as EventCategory]}
                            </Badge>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-0.5 text-[10px] text-ink-muted">
                              <CalendarDays className="h-2.5 w-2.5" />
                              {new Date(task.due_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          {getMemberName(task.assignee_id) && (
                            <span className="text-[10px] text-ink-muted">
                              {getMemberName(task.assignee_id)}
                            </span>
                          )}
                        </div>
                      </div>
                      {isAuthenticated && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDelete(task)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-ink-muted" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {getColumnTasks(col.id).length === 0 && (
                <p className="py-8 text-center text-xs text-ink-muted/50">
                  {isAuthenticated ? 'Trascina qui un task' : 'Nessun task'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      </section>

      {isAuthenticated && showForm && (
        <TaskFormDialog open={showForm} onClose={() => { setShowForm(false); setEditingTask(undefined) }} task={editingTask} />
      )}

      {isAuthenticated && editingMember && (
        <MemberFormDialog
          open={!!editingMember}
          onClose={() => setEditingMember(null)}
          member={editingMember}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Elimina Task"
        message={`Eliminare "${confirmDelete?.title}"? L'azione non può essere annullata.`}
        onConfirm={handleDeleteTask}
        onCancel={() => setConfirmDelete(null)}
        loading={deleting}
      />
    </div>
  )
}
