import { create } from 'zustand'
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react'
import { api } from '@/lib/api'

interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  loading: boolean
  selectedNodeId: string | null

  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect

  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  addNode: (node: Node) => void
  removeNode: (id: string) => void
  selectNode: (id: string | null) => void

  fetchCanvas: () => Promise<void>
  saveCanvas: () => Promise<void>
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  loading: false,
  selectedNodeId: null,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  onConnect: (connection) => {
    set({ edges: addEdge(connection, get().edges) })
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] })
  },

  removeNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    })
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  fetchCanvas: async () => {
    set({ loading: true })
    try {
      const [nodesData, edgesData] = await Promise.all([
        api.getCanvasNodes(),
        api.getCanvasEdges(),
      ])

      const nodes: Node[] = nodesData.map((n: any) => ({
        id: n.id,
        type: n.type,
        position: { x: n.position_x, y: n.position_y },
        data: {
          label: n.label,
          entityId: n.entity_id,
          ...JSON.parse(n.data || '{}'),
        },
        ...(n.width ? { width: n.width } : {}),
        ...(n.height ? { height: n.height } : {}),
      }))

      const edges: Edge[] = edgesData.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label || undefined,
      }))

      set({ nodes, edges, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  saveCanvas: async () => {
    const { nodes, edges } = get()
    const nodesPayload = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      entityId: n.data?.entityId || null,
      label: n.data?.label || '',
      positionX: n.position.x,
      positionY: n.position.y,
      width: n.width || null,
      height: n.height || null,
      data: n.data || {},
    }))

    const edgesPayload = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || '',
    }))

    await api.saveCanvas({ nodes: nodesPayload, edges: edgesPayload })
  },
}))
