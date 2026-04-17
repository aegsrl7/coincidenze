import { useEffect, useRef } from 'react'
import { X, Trash2, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ui/image-upload'
import { useCanvasStore } from '@/stores/canvasStore'
import { useAuthStore } from '@/stores/authStore'
import { useEventsStore } from '@/stores/eventsStore'
import { useArtistsStore } from '@/stores/artistsStore'
import { useMediaStore } from '@/stores/mediaStore'
import { api } from '@/lib/api'
import { CATEGORY_LABELS, type EventCategory } from '@/types'

export function NodeDetailPanel() {
  const { nodes, selectedNodeId, selectNode, removeNode, setNodes } = useCanvasStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const updateEvent = useEventsStore((s) => s.updateEvent)
  const updateArtist = useArtistsStore((s) => s.updateArtist)
  const updateMedia = useMediaStore((s) => s.updateMedia)
  const node = nodes.find((n) => n.id === selectedNodeId)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const entityId = node?.data?.entityId as string | undefined

  // Sync Node → Entity (debounced 1s)
  const syncKey = entityId && node ? JSON.stringify({
    label: node.data?.label,
    category: node.data?.category,
    startTime: node.data?.startTime,
    endTime: node.data?.endTime,
    location: node.data?.location,
    bio: node.data?.bio,
    imageUrl: node.data?.imageUrl,
    mediaType: node.data?.mediaType,
    url: node.data?.url,
    thumbnailUrl: node.data?.thumbnailUrl,
    description: node.data?.description,
  }) : null

  useEffect(() => {
    if (!entityId || !node || !syncKey) return

    clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => {
      const d = node.data as Record<string, unknown>
      switch (node.type) {
        case 'event':
          updateEvent(entityId, {
            title: d.label,
            category: d.category,
            startTime: d.startTime,
            endTime: d.endTime,
            location: d.location,
          } as any).catch(() => {})
          break
        case 'artist':
          updateArtist(entityId, {
            name: d.label,
            category: d.category,
            bio: d.bio,
            imageUrl: d.imageUrl,
          } as any).catch(() => {})
          break
        case 'media':
          updateMedia(entityId, {
            title: d.label,
            type: d.mediaType,
            url: d.url,
            thumbnailUrl: d.thumbnailUrl,
          } as any).catch(() => {})
          break
        case 'exhibitor':
          api.updateExhibitor(entityId, {
            name: d.label as string,
            category: d.category as EventCategory,
            description: d.description as string,
          }).catch(() => {})
          break
      }
    }, 1000)

    return () => clearTimeout(syncTimeoutRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey])

  if (!node) return null

  const updateNodeData = (key: string, value: string) => {
    setNodes(
      nodes.map((n) =>
        n.id === node.id
          ? { ...n, data: { ...n.data, [key]: value } }
          : n
      )
    )
  }

  return (
    <div className="absolute right-0 top-0 z-10 h-full w-72 border-l border-navy/10 bg-crema shadow-lg overflow-y-auto">
      <div className="flex items-center justify-between border-b border-navy/10 p-4">
        <h3 className="font-display text-sm font-semibold text-navy">
          Dettagli Nodo
        </h3>
        <Button variant="ghost" size="icon" onClick={() => selectNode(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <label className="text-xs font-medium text-ink-muted">Tipo</label>
          <p className="text-sm capitalize text-navy">{node.type}</p>
        </div>

        {entityId && (
          <div className="flex items-center gap-1.5 rounded-md bg-violet/10 px-2.5 py-1.5 text-xs text-violet">
            <Link2 className="h-3.5 w-3.5" />
            <span>Collegato — modifiche sincronizzate</span>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-ink-muted">Etichetta</label>
          <Input
            value={(node.data?.label as string) || ''}
            onChange={(e) => updateNodeData('label', e.target.value)}
            disabled={!isAuthenticated}
          />
        </div>

        {(node.type === 'event' || node.type === 'artist' || node.type === 'exhibitor') && (
          <div>
            <label className="text-xs font-medium text-ink-muted">Categoria</label>
            <select
              className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm disabled:opacity-60"
              value={(node.data?.category as string) || ''}
              onChange={(e) => updateNodeData('category', e.target.value)}
              disabled={!isAuthenticated}
            >
              <option value="">-- Seleziona --</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {node.type === 'event' && (
          <>
            <div>
              <label className="text-xs font-medium text-ink-muted">Orario Inizio</label>
              <Input
                type="time"
                value={(node.data?.startTime as string) || ''}
                onChange={(e) => updateNodeData('startTime', e.target.value)}
                disabled={!isAuthenticated}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Orario Fine</label>
              <Input
                type="time"
                value={(node.data?.endTime as string) || ''}
                onChange={(e) => updateNodeData('endTime', e.target.value)}
                disabled={!isAuthenticated}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Luogo</label>
              <Input
                value={(node.data?.location as string) || ''}
                onChange={(e) => updateNodeData('location', e.target.value)}
                disabled={!isAuthenticated}
              />
            </div>
          </>
        )}

        {node.type === 'media' && (
          <>
            <div>
              <label className="text-xs font-medium text-ink-muted">Tipo</label>
              <select
                className="mt-1 w-full rounded-md border border-navy/20 bg-crema px-3 py-2 text-sm disabled:opacity-60"
                value={(node.data?.mediaType as string) || ''}
                onChange={(e) => updateNodeData('mediaType', e.target.value)}
                disabled={!isAuthenticated}
              >
                <option value="">-- Seleziona --</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="image">Immagine</option>
              </select>
            </div>
            <ImageUpload
              label="URL / File"
              value={(node.data?.url as string) || ''}
              onChange={(url) => updateNodeData('url', url)}
              placeholder="Carica file o inserisci URL"
              disabled={!isAuthenticated}
            />
            {(node.data?.mediaType as string) !== 'image' && (
              <ImageUpload
                label="Thumbnail"
                value={(node.data?.thumbnailUrl as string) || ''}
                onChange={(url) => updateNodeData('thumbnailUrl', url)}
                placeholder="Carica o inserisci URL"
                disabled={!isAuthenticated}
              />
            )}
          </>
        )}

        {node.type === 'group' && (
          <div>
            <label className="text-xs font-medium text-ink-muted">Colore</label>
            <Input
              type="color"
              value={(node.data?.color as string) || '#2C3E6B'}
              onChange={(e) => updateNodeData('color', e.target.value)}
              disabled={!isAuthenticated}
            />
          </div>
        )}

        {isAuthenticated && (
          <div className="pt-4 border-t border-navy/10">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                removeNode(node.id)
                selectNode(null)
              }}
            >
              <Trash2 className="h-4 w-4" />
              Elimina Nodo
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
