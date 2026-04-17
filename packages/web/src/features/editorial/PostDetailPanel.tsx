import { X, Pencil, Calendar, Clock, Users, FileText, MessageSquare, StickyNote, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FASE_LABELS,
  FASE_COLORS,
  STATO_LABELS,
  STATO_COLORS,
  type EditorialPost,
} from '@/types'

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
  const dow = new Date(y, m - 1, d).getDay()
  return `${days[dow]} ${d} ${MESI[m - 1]} ${y}`
}

interface PostDetailPanelProps {
  post: EditorialPost
  onClose: () => void
  onEdit: () => void
  isAuthenticated: boolean
}

export function PostDetailPanel({ post, onClose, onEdit, isAuthenticated }: PostDetailPanelProps) {
  const faseColor = FASE_COLORS[post.fase] || '#2C3E6B'
  const statoColor = STATO_COLORS[post.stato] || '#9CA3AF'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con colore fase */}
        <div className="relative p-5 pb-4" style={{ borderTop: `4px solid ${faseColor}` }}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-ink-muted hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-3 pr-8">
            <span className="text-2xl shrink-0">{post.emoji}</span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold text-navy leading-tight">
                {post.titolo}
              </h2>
              <p className="text-sm text-ink-muted mt-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(post.data)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Badge className="text-[11px] text-white" style={{ backgroundColor: faseColor }}>
              {FASE_LABELS[post.fase]}
            </Badge>
            <Badge className="text-[11px] text-white" style={{ backgroundColor: statoColor }}>
              {STATO_LABELS[post.stato]}
            </Badge>
            {post.formato && (
              <Badge variant="outline" className="text-[11px]">
                {post.formato}
              </Badge>
            )}
          </div>
        </div>

        {/* Contenuto */}
        <div className="px-5 pb-5 space-y-4">
          {/* Descrizione — cosa fare */}
          {post.descrizione && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-navy uppercase tracking-wide mb-1.5">
                <FileText className="h-3.5 w-3.5" />
                Cosa fare
              </div>
              <p className="text-sm text-ink leading-relaxed">{post.descrizione}</p>
            </div>
          )}

          {/* Caption suggerita */}
          {post.caption_suggerita && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-navy uppercase tracking-wide mb-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Caption suggerita
              </div>
              <div className="bg-cream/60 rounded-lg p-3 text-sm text-ink leading-relaxed whitespace-pre-line">
                {post.caption_suggerita}
              </div>
            </div>
          )}

          {/* Artisti coinvolti */}
          {post.artisti_coinvolti && post.artisti_coinvolti.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-navy uppercase tracking-wide mb-1.5">
                <Users className="h-3.5 w-3.5" />
                Artisti coinvolti
              </div>
              <div className="flex flex-wrap gap-1.5">
                {post.artisti_coinvolti.map((name) => (
                  <Badge key={name} variant="outline" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tag */}
          {post.tag && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-navy uppercase tracking-wide mb-1.5">
                <Tag className="h-3.5 w-3.5" />
                Tag
              </div>
              <p className="text-sm text-ink-muted">{post.tag}</p>
            </div>
          )}

          {/* Note */}
          {post.note && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-navy uppercase tracking-wide mb-1.5">
                <StickyNote className="h-3.5 w-3.5" />
                Note
              </div>
              <p className="text-sm text-ink-muted italic">{post.note}</p>
            </div>
          )}

          {/* Bottone modifica */}
          {isAuthenticated && (
            <div className="pt-2 border-t border-ink/10">
              <Button onClick={onEdit} className="w-full">
                <Pencil className="h-4 w-4" />
                Modifica post
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
