import { useEffect, useState } from 'react'
import { User, Plus, Search, Globe, Filter, QrCode, type LucideProps } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useArtistsStore } from '@/stores/artistsStore'
import { useAuthStore } from '@/stores/authStore'
import { useCategoryMaps } from '@/stores/categoriesStore'
import { type Artist } from '@/types'
import { ArtistFormDialog } from './ArtistFormDialog'

function SocialIcon({ url, className }: { url: string; className?: string }) {
  const cn = className || 'h-5 w-5'
  try {
    const host = new URL(url).hostname.replace('www.', '')
    if (host.includes('instagram'))
      return <svg className={cn} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
    if (host.includes('facebook'))
      return <svg className={cn} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    if (host.includes('youtube'))
      return <svg className={cn} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    if (host.includes('twitter') || host.includes('x.com'))
      return <svg className={cn} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    if (host.includes('tiktok'))
      return <svg className={cn} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
    if (host.includes('spotify'))
      return <svg className={cn} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
    if (host.includes('linkedin'))
      return <svg className={cn} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    if (host.includes('github'))
      return <svg className={cn} viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
  } catch {}
  return <Globe className={cn} />
}

export function ArtistsPage() {
  const { artists, fetchArtists } = useArtistsStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { labels, colors } = useCategoryMaps('artist')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Artist | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchArtists()
  }, [fetchArtists])

  const filtered = artists.filter((a) => {
    const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !categoryFilter || a.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const usedCategories = [...new Set(artists.map((a) => a.category).filter(Boolean))]

  const downloadArtistQR = async (artist: Artist) => {
    const target = `${window.location.origin}/artisti/${artist.id}`
    try {
      // qrcode-generator caricato via CDN (no npm install richiesto)
      const mod: any = await import(/* @vite-ignore */ 'https://esm.sh/qrcode-generator@1.4.4')
      const qrcode = mod.default || mod
      const qr = qrcode(0, 'H') // type=auto, error correction High
      qr.addData(target)
      qr.make()
      const moduleCount = qr.getModuleCount()
      const SIZE = 512
      const MARGIN_MODULES = 4
      const cell = Math.floor(SIZE / (moduleCount + MARGIN_MODULES * 2))
      const offset = Math.floor((SIZE - cell * moduleCount) / 2)
      const canvas = document.createElement('canvas')
      canvas.width = SIZE
      canvas.height = SIZE
      const ctx = canvas.getContext('2d')!
      // Sfondo trasparente: niente fillRect iniziale
      ctx.fillStyle = '#2C3E6B' // navy COINCIDENZE
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(offset + c * cell, offset + r * cell, cell, cell)
          }
        }
      }
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      )
      if (!blob) throw new Error('Canvas toBlob fallita')
      const slug = artist.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `qr-${slug || artist.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      console.error('QR download failed', err)
      alert("Download del QR fallito. Riprova fra qualche secondo.")
    }
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Filtri */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {isAuthenticated && (
          <Button onClick={() => { setEditingItem(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" /> Aggiungi Artista
          </Button>
        )}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Cerca artista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {usedCategories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(null)}
            >
              <Filter className="h-3 w-3" /> Tutti
            </Button>
            {usedCategories.map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                style={categoryFilter === cat ? { backgroundColor: colors[cat] } : {}}
              >
                {labels[cat]}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Griglia */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-ink-muted">
          <User className="mx-auto h-12 w-12 text-navy/20" />
          <p className="mt-4">Nessun artista trovato</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((artist) => {
            const color = artist.category ? colors[artist.category] : '#2C3E6B'

            return (
              <Card
                key={artist.id}
                className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
                onClick={() => { if (isAuthenticated) { setEditingItem(artist); setShowForm(true) } }}
              >
                {/* Avatar / placeholder */}
                <div className="relative aspect-square sm:h-[244px] bg-beige-dark flex items-center justify-center">
                  {artist.image_url ? (
                    <img src={artist.image_url} alt={artist.name} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-navy/20" />
                  )}
                  {isAuthenticated && (
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadArtistQR(artist) }}
                      className="absolute top-2 right-2 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/90 hover:bg-white text-navy shadow"
                      title="Scarica QR 512×512 (sfondo trasparente)"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <CardContent className="p-3">
                  <h3 className="text-sm font-medium text-navy truncate">{artist.name}</h3>
                  {artist.bio && (
                    <p className="text-xs text-ink-muted mt-0.5 truncate">{artist.bio}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    {artist.category && (
                      <Badge className="text-[10px]" style={{ backgroundColor: color }}>
                        {labels[artist.category]}
                      </Badge>
                    )}
                    {artist.website && (
                      <a
                        href={artist.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="ml-auto text-navy/40 hover:text-navy transition-colors"
                      >
                        <SocialIcon url={artist.website} className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {isAuthenticated && showForm && (
        <ArtistFormDialog
          open={showForm}
          onClose={() => { setShowForm(false); setEditingItem(null) }}
          editItem={editingItem}
        />
      )}
    </div>
  )
}
