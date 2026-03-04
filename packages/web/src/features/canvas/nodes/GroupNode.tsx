import { memo } from 'react'
import { type NodeProps, NodeResizer } from '@xyflow/react'

interface GroupNodeData {
  label: string
  color?: string
  [key: string]: unknown
}

export const GroupNode = memo(({ data, selected }: NodeProps) => {
  const d = data as GroupNodeData
  const color = d.color || '#2C3E6B'

  return (
    <div
      className="h-full w-full rounded-xl"
      style={{
        border: `2px dashed ${color}40`,
        backgroundColor: `${color}08`,
      }}
    >
      <NodeResizer
        color={color}
        isVisible={selected}
        minWidth={200}
        minHeight={150}
      />
      <div className="p-3">
        <span
          className="font-display text-xs font-semibold uppercase tracking-wider"
          style={{ color: `${color}80` }}
        >
          {d.label || 'Area'}
        </span>
      </div>
    </div>
  )
})

GroupNode.displayName = 'GroupNode'
