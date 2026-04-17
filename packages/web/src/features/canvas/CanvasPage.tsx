import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeMouseHandler,
  type Node,
  useReactFlow,
} from '@xyflow/react'
import { X } from 'lucide-react'
import '@xyflow/react/dist/style.css'
import { useCanvasStore } from '@/stores/canvasStore'
import { useAuthStore } from '@/stores/authStore'
import { useEventsStore } from '@/stores/eventsStore'
import { useArtistsStore } from '@/stores/artistsStore'
import { useMediaStore } from '@/stores/mediaStore'
import { api } from '@/lib/api'
import type { Exhibitor } from '@/types'
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

/** Ordina i nodi: parent (group) prima dei figli */
function sortParentsFirst(nodes: Node[]): Node[] {
  return [...nodes].sort((a, b) => {
    if (a.parentId && !b.parentId) return 1
    if (!a.parentId && b.parentId) return -1
    return 0
  })
}

export function CanvasPage() {
  return (
    <ReactFlowProvider>
      <CanvasPageInner />
    </ReactFlowProvider>
  )
}

function CanvasPageInner() {
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
  const events = useEventsStore((s) => s.events)
  const fetchEvents = useEventsStore((s) => s.fetchEvents)
  const artists = useArtistsStore((s) => s.artists)
  const fetchArtists = useArtistsStore((s) => s.fetchArtists)
  const mediaItems = useMediaStore((s) => s.items)
  const fetchMedia = useMediaStore((s) => s.fetchMedia)
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const initialLoadDone = useRef(false)
  const { getIntersectingNodes, getInternalNode } = useReactFlow()

  useEffect(() => {
    fetchCanvas()
    if (isAuthenticated) {
      fetchEvents()
      fetchArtists()
      fetchMedia()
      api.getExhibitors().then(setExhibitors).catch(() => {})
    }
  }, [fetchCanvas, isAuthenticated, fetchEvents, fetchArtists, fetchMedia])

  // Sync Entity → Node: quando le entità cambiano, aggiorna i nodi collegati
  useEffect(() => {
    if (!initialLoadDone.current) {
      if (events.length || artists.length || mediaItems.length || exhibitors.length) {
        initialLoadDone.current = true
      }
      return
    }

    const currentNodes = useCanvasStore.getState().nodes
    let changed = false
    const updated = currentNodes.map((n) => {
      const entityId = n.data?.entityId as string | undefined
      if (!entityId) return n

      switch (n.type) {
        case 'event': {
          const e = events.find((ev) => ev.id === entityId)
          if (!e) return n
          const newData = { ...n.data, label: e.title, category: e.category, startTime: e.start_time, endTime: e.end_time, location: e.location }
          if (JSON.stringify(n.data) !== JSON.stringify(newData)) { changed = true; return { ...n, data: newData } }
          return n
        }
        case 'artist': {
          const a = artists.find((ar) => ar.id === entityId)
          if (!a) return n
          const newData = { ...n.data, label: a.name, category: a.category, bio: a.bio, imageUrl: a.image_url }
          if (JSON.stringify(n.data) !== JSON.stringify(newData)) { changed = true; return { ...n, data: newData } }
          return n
        }
        case 'exhibitor': {
          const ex = exhibitors.find((e) => e.id === entityId)
          if (!ex) return n
          const newData = { ...n.data, label: ex.name, category: ex.category, description: ex.description }
          if (JSON.stringify(n.data) !== JSON.stringify(newData)) { changed = true; return { ...n, data: newData } }
          return n
        }
        case 'media': {
          const m = mediaItems.find((mi) => mi.id === entityId)
          if (!m) return n
          const newData = { ...n.data, label: m.title, mediaType: m.type, url: m.url, thumbnailUrl: m.thumbnail_url || (m.type === 'image' ? m.url : '') }
          if (JSON.stringify(n.data) !== JSON.stringify(newData)) { changed = true; return { ...n, data: newData } }
          return n
        }
      }
      return n
    })

    if (changed) setNodes(updated)
  }, [events, artists, mediaItems, exhibitors, setNodes])

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (!isAuthenticated) {
        const url = node.data?.url as string
        const mediaType = node.data?.mediaType as string
        if (node.type === 'media' && url && mediaType === 'image') {
          setLightboxUrl(url)
        }
        return
      }
      selectNode(node.id)
    },
    [selectNode, isAuthenticated]
  )

  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  // Drag-into-group: usa getIntersectingNodes e positionAbsolute
  const onNodeDragStop: NodeMouseHandler = useCallback(
    (_event, draggedNode) => {
      if (draggedNode.type === 'group') return

      // Trova gruppi che intersecano il nodo trascinato
      const intersections = getIntersectingNodes(draggedNode)
      const targetGroup = intersections.find((n) => n.type === 'group')
      const newParentId = targetGroup?.id
      const currentParentId = draggedNode.parentId

      if (currentParentId === newParentId) return

      // Posizione assoluta del nodo trascinato
      const draggedInternal = getInternalNode(draggedNode.id)
      const draggedAbsPos = draggedInternal?.internals.positionAbsolute ?? draggedNode.position

      const updatedNodes = nodes.map((n) => {
        if (n.id !== draggedNode.id) return n

        if (newParentId) {
          // Entra in un gruppo: posizione relativa = assoluta nodo - assoluta parent
          const parentInternal = getInternalNode(newParentId)
          const parentAbsPos = parentInternal?.internals.positionAbsolute ?? targetGroup!.position
          return {
            ...n,
            parentId: newParentId,
            extent: 'parent' as const,
            expandParent: true,
            position: {
              x: draggedAbsPos.x - parentAbsPos.x,
              y: draggedAbsPos.y - parentAbsPos.y,
            },
          }
        } else {
          // Esce dal gruppo: usa posizione assoluta
          const { parentId, extent, expandParent, ...rest } = n as any
          return {
            ...rest,
            position: { x: draggedAbsPos.x, y: draggedAbsPos.y },
          }
        }
      })

      // Ordina: parent prima dei figli
      setNodes(sortParentsFirst(updatedNodes))
    },
    [nodes, setNodes, getIntersectingNodes, getInternalNode]
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
        <CanvasToolbar exhibitors={exhibitors} />
      </ReactFlow>

      {isAuthenticated && selectedNodeId && <NodeDetailPanel />}

      {/* Lightbox per utenti non loggati */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-crema/90 text-navy shadow-lg hover:bg-crema transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
