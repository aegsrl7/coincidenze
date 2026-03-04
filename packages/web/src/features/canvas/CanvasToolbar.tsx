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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCanvasStore } from '@/stores/canvasStore'
import { useAuthStore } from '@/stores/authStore'
import { useReactFlow } from '@xyflow/react'

export function CanvasToolbar() {
  const { addNode, saveCanvas } = useCanvasStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  const createNode = (type: string, label: string) => {
    const id = `${type}-${Date.now()}`
    addNode({
      id,
      type,
      position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
      data: { label },
      ...(type === 'group' ? { style: { width: 300, height: 200 }, zIndex: -1 } : {}),
    })
  }

  return (
    <div className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-lg border border-navy/10 bg-crema/95 p-1.5 shadow-md backdrop-blur-sm">
      {isAuthenticated && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createNode('event', 'Nuovo Evento')}
            title="Aggiungi evento"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Evento</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createNode('artist', 'Nuovo Artista')}
            title="Aggiungi artista"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Artista</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createNode('exhibitor', 'Nuovo Espositore')}
            title="Aggiungi espositore"
          >
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Espositore</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createNode('media', 'Nuovo Media')}
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

          <Button variant="default" size="sm" onClick={saveCanvas}>
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Salva</span>
          </Button>
        </>
      )}
    </div>
  )
}
