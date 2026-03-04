import { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeMouseHandler,
  type Node,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCanvasStore } from '@/stores/canvasStore'
import { useAuthStore } from '@/stores/authStore'
import { EventNode } from './nodes/EventNode'
import { ArtistNode } from './nodes/ArtistNode'
import { ExhibitorNode } from './nodes/ExhibitorNode'
import { MediaNode } from './nodes/MediaNode'
import { GroupNode } from './nodes/GroupNode'
import { CanvasToolbar } from './CanvasToolbar'
import { NodeDetailPanel } from './NodeDetailPanel'

const nodeTypes = {
  event: EventNode,
  artist: ArtistNode,
  exhibitor: ExhibitorNode,
  media: MediaNode,
  group: GroupNode,
}

function isInsideGroup(node: Node, group: Node): boolean {
  const gx = group.position.x
  const gy = group.position.y
  const gw = (group.measured?.width ?? group.width ?? 300) as number
  const gh = (group.measured?.height ?? group.height ?? 200) as number
  const nx = node.position.x
  const ny = node.position.y
  return nx > gx && ny > gy && nx < gx + gw && ny < gy + gh
}

export function CanvasPage() {
  const {
    nodes,
    edges,
    selectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    setNodes,
    fetchCanvas,
  } = useCanvasStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    fetchCanvas()
  }, [fetchCanvas])

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      selectNode(node.id)
    },
    [selectNode]
  )

  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  // Quando un nodo finisce di essere trascinato, controlla se è dentro un gruppo
  const onNodeDragStop: NodeMouseHandler = useCallback(
    (_event, draggedNode) => {
      if (draggedNode.type === 'group') return

      const groups = nodes.filter((n) => n.type === 'group')
      let newParentId: string | undefined = undefined

      for (const group of groups) {
        if (isInsideGroup(draggedNode, group)) {
          newParentId = group.id
          break
        }
      }

      const currentParentId = draggedNode.parentId

      // Nessun cambiamento
      if (currentParentId === newParentId) return

      setNodes(
        nodes.map((n) => {
          if (n.id !== draggedNode.id) return n

          if (newParentId) {
            // Entra in un gruppo: converti posizione in relativa al parent
            const parent = nodes.find((g) => g.id === newParentId)!
            return {
              ...n,
              parentId: newParentId,
              extent: 'parent' as const,
              position: {
                x: n.position.x - parent.position.x,
                y: n.position.y - parent.position.y,
              },
            }
          } else {
            // Esce dal gruppo: converti posizione in assoluta
            const oldParent = nodes.find((g) => g.id === currentParentId)
            const absX = n.position.x + (oldParent?.position.x ?? 0)
            const absY = n.position.y + (oldParent?.position.y ?? 0)
            const { parentId, extent, ...rest } = n as any
            return {
              ...rest,
              position: { x: absX, y: absY },
            }
          }
        })
      )
    },
    [nodes, setNodes]
  )

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isAuthenticated ? onNodesChange : undefined}
        onEdgesChange={isAuthenticated ? onEdgesChange : undefined}
        onConnect={isAuthenticated ? onConnect : undefined}
        onNodeClick={onNodeClick}
        onNodeDragStop={isAuthenticated ? onNodeDragStop : undefined}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        nodesDraggable={isAuthenticated}
        nodesConnectable={isAuthenticated}
        elementsSelectable
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        deleteKeyCode={isAuthenticated ? 'Delete' : null}
        className="bg-beige"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#2C3E6B20"
        />
        <Controls
          className="!bg-crema !border-navy/10 !shadow-md [&>button]:!bg-crema [&>button]:!border-navy/10 [&>button]:!text-navy hover:[&>button]:!bg-beige-dark"
          position="bottom-left"
        />
        <MiniMap
          className="!bg-crema !border-navy/10"
          nodeColor={(n) => {
            switch (n.type) {
              case 'event': return '#2C3E6B'
              case 'artist': return '#6B3FA0'
              case 'exhibitor': return '#8B2252'
              case 'media': return '#4A7C8F'
              case 'group': return '#2C3E6B40'
              default: return '#ccc'
            }
          }}
          maskColor="rgba(245, 240, 232, 0.7)"
          position="bottom-right"
        />
        <CanvasToolbar />
      </ReactFlow>

      {selectedNodeId && <NodeDetailPanel />}
    </div>
  )
}
