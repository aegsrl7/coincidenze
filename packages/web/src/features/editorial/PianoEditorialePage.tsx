import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEditorialStore } from '@/stores/editorialStore'
import { useAuthStore } from '@/stores/authStore'
import { FASE_LABELS, FASE_COLORS, STATO_COLORS, type EditorialPost } from '@/types'
import { PostFormDialog } from './PostFormDialog'
import { PostDetailPanel } from './PostDetailPanel'

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

const GIORNI_SETTIMANA = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Returns 0=Mon ... 6=Sun for the 1st of the given month */
function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay() // 0=Sun
  return day === 0 ? 6 : day - 1
}

function formatDateStr(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

interface CalendarDay {
  day: number
  month: number
  year: number
  isCurrentMonth: boolean
  dateStr: string
}

function buildCalendarGrid(year: number, month: number): CalendarDay[][] {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfWeek = getFirstDayOfWeek(year, month)

  const days: CalendarDay[] = []

  // Previous month fill
  if (firstDayOfWeek > 0) {
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const daysInPrev = getDaysInMonth(prevYear, prevMonth)
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrev - i
      days.push({
        day: d,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        dateStr: formatDateStr(prevYear, prevMonth, d),
      })
    }
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      day: d,
      month,
      year,
      isCurrentMonth: true,
      dateStr: formatDateStr(year, month, d),
    })
  }

  // Next month fill to complete last week
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    for (let d = 1; d <= remaining; d++) {
      days.push({
        day: d,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        dateStr: formatDateStr(nextYear, nextMonth, d),
      })
    }
  }

  // Split into weeks
  const weeks: CalendarDay[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return weeks
}

export function PianoEditorialePage() {
  const { posts, fetchPosts } = useEditorialStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(3) // April (0-indexed)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<EditorialPost | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewingPost, setViewingPost] = useState<EditorialPost | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const weeks = buildCalendarGrid(currentYear, currentMonth)

  // Index posts by date for quick lookup
  const postsByDate: Record<string, EditorialPost[]> = {}
  for (const post of posts) {
    const date = post.data // "YYYY-MM-DD"
    if (!postsByDate[date]) postsByDate[date] = []
    postsByDate[date].push(post)
  }

  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  function handlePostClick(post: EditorialPost) {
    setViewingPost(post)
  }

  function handleEditFromDetail() {
    if (!viewingPost) return
    setEditingPost(viewingPost)
    setViewingPost(null)
    setSelectedDate(null)
    setShowForm(true)
  }

  function handleEmptyCellClick(dateStr: string) {
    if (!isAuthenticated) return
    setEditingPost(null)
    setSelectedDate(dateStr)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingPost(null)
    setSelectedDate(null)
  }

  // Collect all posts for current month in a flat list (for mobile view)
  const monthPosts = posts
    .filter((p) => {
      const [y, m] = p.data.split('-').map(Number)
      return y === currentYear && m === currentMonth + 1
    })
    .sort((a, b) => a.data.localeCompare(b.data))

  const fasi = [1, 2, 3] as const

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-navy min-w-[200px] text-center">
            {MESI[currentMonth]} {currentYear}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {isAuthenticated && (
          <Button
            onClick={() => {
              setEditingPost(null)
              setSelectedDate(null)
              setShowForm(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Aggiungi Post
          </Button>
        )}
      </div>

      {/* Phase legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {fasi.map((fase) => (
          <Badge
            key={fase}
            className="text-xs text-white"
            style={{ backgroundColor: FASE_COLORS[fase] }}
          >
            {FASE_LABELS[fase]}
          </Badge>
        ))}
      </div>

      {/* Desktop calendar grid */}
      <div className="hidden md:block">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-px mb-px">
          {GIORNI_SETTIMANA.map((g) => (
            <div
              key={g}
              className="py-2 text-center text-xs font-semibold text-navy uppercase tracking-wide"
            >
              {g}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="grid grid-cols-1 gap-px border border-ink/10 rounded-lg overflow-hidden">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-px bg-ink/10">
              {week.map((calDay) => {
                const dayPosts = postsByDate[calDay.dateStr] || []
                return (
                  <div
                    key={calDay.dateStr}
                    className={`bg-white min-h-[120px] p-2 flex flex-col transition-colors ${
                      calDay.isCurrentMonth
                        ? 'hover:bg-cream/50'
                        : 'bg-cream/30'
                    } ${isAuthenticated && dayPosts.length === 0 ? 'cursor-pointer' : ''}`}
                    onClick={(e) => {
                      // Only trigger on the cell background, not on post cards
                      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.cellBg) {
                        handleEmptyCellClick(calDay.dateStr)
                      }
                    }}
                  >
                    <span
                      data-cell-bg="true"
                      className={`text-xs font-medium mb-1 ${
                        calDay.isCurrentMonth ? 'text-navy' : 'text-ink-muted/40'
                      }`}
                    >
                      {calDay.day}
                    </span>
                    <div className="flex-1 space-y-1 overflow-hidden" data-cell-bg="true">
                      {dayPosts.map((post) => (
                        <div
                          key={post.id}
                          className="rounded px-1.5 py-1 text-[11px] leading-tight bg-cream/60 hover:bg-cream border-l-[3px] cursor-pointer transition-colors"
                          style={{ borderLeftColor: FASE_COLORS[post.fase] || '#2C3E6B' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePostClick(post)
                          }}
                        >
                          <div className="flex items-start gap-1">
                            <span className="shrink-0">{post.emoji}</span>
                            <span className="text-ink truncate font-medium">
                              {post.titolo}
                            </span>
                          </div>
                          <div className="mt-0.5">
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: STATO_COLORS[post.stato] || '#9CA3AF' }}
                              title={post.stato}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile list view */}
      <div className="md:hidden space-y-3">
        {monthPosts.length === 0 ? (
          <div className="py-16 text-center text-ink-muted">
            <p>Nessun post per {MESI[currentMonth]} {currentYear}</p>
          </div>
        ) : (
          monthPosts.map((post) => {
            const dayNum = parseInt(post.data.split('-')[2], 10)
            return (
              <div
                key={post.id}
                className="bg-white rounded-lg border border-ink/10 overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
                onClick={() => handlePostClick(post)}
              >
                <div className="flex">
                  <div
                    className="w-1.5 shrink-0"
                    style={{ backgroundColor: FASE_COLORS[post.fase] || '#2C3E6B' }}
                  />
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{post.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-ink truncate">
                            {post.titolo}
                          </p>
                          <p className="text-xs text-ink-muted mt-0.5">
                            {dayNum} {MESI[currentMonth]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          className="text-[10px] text-white"
                          style={{ backgroundColor: FASE_COLORS[post.fase] }}
                        >
                          {FASE_LABELS[post.fase]}
                        </Badge>
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: STATO_COLORS[post.stato] || '#9CA3AF' }}
                          title={post.stato}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Mobile: tap empty area to add */}
        {isAuthenticated && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              setEditingPost(null)
              setSelectedDate(null)
              setShowForm(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Aggiungi Post
          </Button>
        )}
      </div>

      {/* Post detail panel */}
      {viewingPost && (
        <PostDetailPanel
          post={viewingPost}
          onClose={() => setViewingPost(null)}
          onEdit={handleEditFromDetail}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Post form dialog */}
      {isAuthenticated && showForm && (
        <PostFormDialog
          open={showForm}
          onClose={handleCloseForm}
          editPost={editingPost}
          defaultDate={selectedDate}
        />
      )}
    </div>
  )
}
