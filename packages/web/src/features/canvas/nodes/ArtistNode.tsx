import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABELS, CATEGORY_COLORS, type EventCategory } from '@/types'

interface ArtistNodeData {
  label: string
  category?: EventCategory
  bio?: string
  [key: string]: unknown
}

export const ArtistNode = memo(({ data, selected }: NodeProps) => {
  const d = data as ArtistNodeData
  const color = d.category ? CATEGORY_COLORS[d.category] : '#6B3FA0'

  return (
    <div
      className={`min-w-[180px] max-w-[250px] rounded-lg border-2 bg-crema shadow-md transition-shadow ${
        selected ? 'shadow-lg ring-2 ring-viola/30' : ''
      }`}
      style={{ borderColor: color }}
    >
      <Handle type="target" position={Position.Top} className="!bg-viola !w-2 !h-2" />

      <div className="p-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}20` }}
          >
            <User className="h-4 w-4" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-semibold text-navy truncate">
              {d.label || 'Artista'}
            </h3>
            {d.category && (
              <span className="text-[10px]" style={{ color }}>
                {CATEGORY_LABELS[d.category]}
              </span>
            )}
          </div>
        </div>
        {d.bio && (
          <p className="mt-2 text-[11px] text-ink-muted line-clamp-2">{d.bio}</p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-viola !w-2 !h-2" />
    </div>
  )
})

ArtistNode.displayName = 'ArtistNode'
