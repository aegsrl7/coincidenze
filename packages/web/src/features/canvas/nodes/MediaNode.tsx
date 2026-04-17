import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Music, Video, Image, Play, X } from 'lucide-react'
import ReactPlayer from 'react-player'

interface MediaNodeData {
  label: string
  mediaType?: 'audio' | 'video' | 'image'
  url?: string
  thumbnailUrl?: string
  [key: string]: unknown
}

const mediaIcons = {
  audio: Music,
  video: Video,
  image: Image,
}

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null
}

export const MediaNode = memo(({ data, selected }: NodeProps) => {
  const d = data as MediaNodeData
  const Icon = d.mediaType ? mediaIcons[d.mediaType] : Music
  const [playing, setPlaying] = useState(false)

  const url = d.url || ''
  const isPlayable = ReactPlayer.canPlay(url)
  const ytThumb = url ? getYouTubeThumbnail(url) : null
  const thumbnail = d.thumbnailUrl || (d.mediaType === 'image' && url ? url : null) || ytThumb

  return (
    <div
      className={`rounded-lg border-2 border-navy/20 bg-crema shadow-md transition-shadow ${
        selected ? 'shadow-lg ring-2 ring-navy/30' : ''
      } ${playing ? 'w-[320px]' : 'min-w-[180px] max-w-[240px]'}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-navy !w-1.5 !h-1.5" />

      {/* Player inline */}
      {playing && isPlayable ? (
        <div className="relative">
          <button
            onClick={() => setPlaying(false)}
            className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-white hover:bg-ink/80"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="aspect-video overflow-hidden rounded-t-md">
            <ReactPlayer
              url={url}
              width="100%"
              height="100%"
              controls
              playing
            />
          </div>
        </div>
      ) : (
        /* Thumbnail / placeholder */
        <div
          className="relative h-28 overflow-hidden rounded-t-md bg-beige-dark flex items-center justify-center group cursor-pointer"
          onClick={(e) => {
            if (isPlayable) {
              e.stopPropagation()
              setPlaying(true)
            }
          }}
        >
          {thumbnail ? (
            <img src={thumbnail} alt={d.label} className="h-full w-full object-cover" />
          ) : (
            <Icon className="h-8 w-8 text-navy/20" />
          )}
          {isPlayable && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/0 group-hover:bg-ink/20 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/80 text-white opacity-70 group-hover:opacity-100 transition-opacity">
                <Play className="h-5 w-5 ml-0.5" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-2.5">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0 text-navy/60" />
          <h3 className="text-xs font-medium text-navy truncate">
            {d.label || 'Media'}
          </h3>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-navy !w-1.5 !h-1.5" />
    </div>
  )
})

MediaNode.displayName = 'MediaNode'
