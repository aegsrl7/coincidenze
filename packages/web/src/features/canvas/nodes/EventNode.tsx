import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Calendar, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABELS, CATEGORY_COLORS, type EventCategory } from '@/types'

interface EventNodeData {
  label: string
  category?: EventCategory
  startTime?: string
  endTime?: string
  location?: string
  artistName?: string
  [key: string]: unknown
}

export const EventNode = memo(({ data, selected }: NodeProps) => {
  const d = data as EventNodeData
  const color = d.category ? CATEGORY_COLORS[d.category] : '#2C3E6B'

  return (
    <div
      className={`min-w-[200px] max-w-[280px] rounded-lg border-2 bg-crema shadow-md transition-shadow ${
        selected ? 'shadow-lg ring-2 ring-navy/30' : ''
      }`}
      style={{ borderColor: color }}
    >
      <Handle type="target" position={Position.Top} className="!bg-navy !w-1.5 !h-1.5" />

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-sm font-semibold text-navy leading-tight">
            {d.label || 'Evento'}
          </h3>
          {d.category && (
            <Badge
              className="shrink-0 text-[10px]"
              style={{ backgroundColor: color }}
            >
              {CATEGORY_LABELS[d.category]}
            </Badge>
          )}
        </div>

        {d.artistName && (
          <p className="mt-1 text-xs text-ink-light">{d.artistName}</p>
        )}

        <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-muted">
          {d.startTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {d.startTime}{d.endTime ? ` - ${d.endTime}` : ''}
            </span>
          )}
          {d.location && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {d.location}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-navy !w-1.5 !h-1.5" />
    </div>
  )
})

EventNode.displayName = 'EventNode'
