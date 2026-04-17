import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Store } from 'lucide-react'
import { CATEGORY_LABELS, CATEGORY_COLORS, type EventCategory } from '@/types'

interface ExhibitorNodeData {
  label: string
  category?: EventCategory
  description?: string
  [key: string]: unknown
}

export const ExhibitorNode = memo(({ data, selected }: NodeProps) => {
  const d = data as ExhibitorNodeData
  const color = d.category ? CATEGORY_COLORS[d.category] : '#8B2252'

  return (
    <div
      className={`min-w-[180px] max-w-[250px] rounded-lg border-2 bg-crema shadow-md transition-shadow ${
        selected ? 'shadow-lg ring-2 ring-bordeaux/30' : ''
      }`}
      style={{ borderColor: color }}
    >
      <Handle type="target" position={Position.Top} className="!bg-bordeaux !w-1.5 !h-1.5" />

      <div className="p-3">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 shrink-0" style={{ color }} />
          <h3 className="font-display text-sm font-semibold text-navy truncate">
            {d.label || 'Espositore'}
          </h3>
        </div>
        {d.category && (
          <span className="text-[10px] mt-1 inline-block" style={{ color }}>
            {CATEGORY_LABELS[d.category]}
          </span>
        )}
        {d.description && (
          <p className="mt-2 text-[11px] text-ink-muted line-clamp-2">{d.description}</p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-bordeaux !w-1.5 !h-1.5" />
    </div>
  )
})

ExhibitorNode.displayName = 'ExhibitorNode'
