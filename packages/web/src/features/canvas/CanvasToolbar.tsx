import { useState } from 'react'
import {
  Calendar,
  User,
  Store,
  Music,
  Square,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCanvasStore } from '@/stores/canvasStore'
import { useAuthStore } from '@/stores/authStore'
import { useEventsStore } from '@/stores/eventsStore'
import { useArtistsStore } from '@/stores/artistsStore'
import { useMediaStore } from '@/stores/mediaStore'
import { useReactFlow } from '@xyflow/react'
import {
  EntityPickerDialog,
  type PickerEntityType,
  type EntityPickerResult,
} from './EntityPickerDialog'
import type { Exhibitor } from '@/types'

interface CanvasToolbarProps {
  exhibitors: Exhibitor[]
}

export function CanvasToolbar({ exhibitors }: CanvasToolbarProps) {
  const { addNode, saveCanvas, saving, saveStatus } = useCanvasStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const events = useEventsStore((s) => s.events)
  const artists = useArtistsStore((s) => s.artists)
  const mediaItems = useMediaStore((s) => s.items)
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  const [pickerType, setPickerType] = useState<PickerEntityType | null>(null)

  const createNode = (type: string, label: string, entityId?: string, extraData?: Record<string, unknown>) => {
    const id = `${type}-${Date.now()}`
    addNode({
      id,
      type,
      position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
      data: { label, ...(entityId ? { entityId } : {}), ...extraData },
      ...(type === 'group' ? { style: { width: 300, height: 200 }, zIndex: -1 } : {}),
    })
  }

  const handleEntitySelect = (type: PickerEntityType, result: EntityPickerResult) => {
    createNode(type, result.label, result.entityId, result.data)
  }

  const handleCreateEmpty = (type: PickerEntityType) => {
    const labels: Record<PickerEntityType, string> = {
      event: 'Nuovo Evento',
      artist: 'Nuovo Artista',
      exhibitor: 'Nuovo Espositore',
      media: 'Nuovo Media',
    }
    createNode(type, labels[type])
  }

  return (
    <>
      <div className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-lg border border-navy/10 bg-crema/95 p-1.5 shadow-md backdrop-blur-sm">
        {isAuthenticated && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPickerType('event')}
              title="Aggiungi evento"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Evento</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPickerType('artist')}
              title="Aggiungi artista"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Artista</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPickerType('exhibitor')}
              title="Aggiungi espositore"
            >
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Espositore</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPickerType('media')}
              title="Aggiungi media"
            >
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Media</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => createNode('group', 'Area')}
              title="Aggiungi area"
            >
              <Square className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Area</span>
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />
          </>
        )}

        <Button variant="ghost" size="icon" onClick={() => zoomIn()} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => zoomOut()} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => fitView()} title="Adatta alla vista">
          <Maximize2 className="h-4 w-4" />
        </Button>

        {isAuthenticated && (
          <>
            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button
              variant={saveStatus === 'success' ? 'outline' : saveStatus === 'error' ? 'destructive' : 'default'}
              size="sm"
              onClick={saveCanvas}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saveStatus === 'success' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : saveStatus === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline text-xs">
                {saving ? 'Salvataggio...' : saveStatus === 'success' ? 'Salvato!' : saveStatus === 'error' ? 'Errore!' : 'Salva'}
              </span>
            </Button>
          </>
        )}
      </div>

      {pickerType && (
        <EntityPickerDialog
          open={!!pickerType}
          onOpenChange={(open) => { if (!open) setPickerType(null) }}
          entityType={pickerType}
          events={events}
          artists={artists}
          exhibitors={exhibitors}
          mediaItems={mediaItems}
          onSelect={(result) => handleEntitySelect(pickerType, result)}
          onCreateEmpty={() => handleCreateEmpty(pickerType)}
        />
      )}
    </>
  )
}
