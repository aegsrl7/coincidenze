import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigationType, useSearchParams } from 'react-router-dom'
import {
  Clock, MapPin, Pencil, X, Check, Loader2, ChevronRight, Users,
  Ticket, Calendar, Utensils, Info, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PublicFooter } from '@/components/PublicFooter'
import { useEdizione1Store } from '@/stores/edizione1Store'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type Event,
  type Artist,
  type EventCategory,
  type MenuItem,
} from '@/types'

type TabId = 'programma' | 'artisti' | 'menu' | 'info'

const TABS: { id: TabId; label: string; icon: typeof Calendar }[] = [
  { id: 'programma', label: 'Programma', icon: Calendar },
  { id: 'artisti', label: 'Artisti', icon: Users },
  { id: 'menu', label: 'Menù', icon: Utensils },
  { id: 'info', label: 'Info', icon: Info },
]

const INFO_SECTIONS = [
  { key: 'info_address', label: 'Dove siamo' },
  { key: 'info_how_to_get_there', label: 'Come arrivare' },
  { key: 'info_schedule', label: 'Orari evento' },
  { key: 'info_contacts', label: 'Contatti' },
] as const

function isAllDay(event: Event): boolean {
  if (!event.start_time || !event.end_time) return false
  const start = parseInt(event.start_time.split(':')[0], 10)
  const end = parseInt(event.end_time.split(':')[0], 10)
  return end - start >= 8
}

function categoryColor(cat: EventCategory): string {
  return CATEGORY_COLORS[cat] || '#2C3E6B'
}

function categoryLabel(cat: EventCategory): string {
  return CATEGORY_LABELS[cat] || cat
}

export function Edizione1Page() {
  const { content, fetchContent, updateContent } = useEdizione1Store()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const checkAuth = useAuthStore((s) => s.checkAuth)

  const [searchParams, setSearchParams] = useSearchParams()
  const navType = useNavigationType()

  const tabFromUrl = searchParams.get('tab')
  const activeTab: TabId = (TABS.find((t) => t.id === tabFromUrl)?.id as TabId) || 'programma'
  const setActiveTab = useCallback(
    (t: TabId) => {
      setSearchParams({ tab: t }, { replace: true })
    },
    [setSearchParams]
  )

  const [events, setEvents] = useState<Event[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [menu, setMenu] = useState<MenuItem[]>([])

  useEffect(() => {
    checkAuth()
    fetchContent()
    api.getEvents().then(setEvents)
    api.getArtists().then(setArtists)
    api.getMenu().then((m) => setMenu(m as MenuItem[]))
  }, [checkAuth, fetchContent])

  useEffect(() => {
    if (navType !== 'POP') return
    const key = `edizione1:scroll:${activeTab}`
    const saved = Number(sessionStorage.getItem(key) || 0)
    if (saved > 0) {
      const attempts = [60, 180, 360, 600, 1000]
      attempts.forEach((ms) =>
        window.setTimeout(() => {
          if (Math.abs(window.scrollY - saved) > 4) window.scrollTo(0, saved)
        }, ms)
      )
    }
  }, [activeTab, navType])

  useEffect(() => {
    const key = `edizione1:scroll:${activeTab}`
    let t: number | undefined
    const save = () => {
      if (t) window.clearTimeout(t)
      t = window.setTimeout(() => sessionStorage.setItem(key, String(window.scrollY)), 80)
    }
    window.addEventListener('scroll', save, { passive: true })
    return () => {
      window.removeEventListener('scroll', save)
      sessionStorage.setItem(key, String(window.scrollY))
    }
  }, [activeTab])

  const scheduledEvents = events.filter((e) => !isAllDay(e)).sort((a, b) => a.start_time.localeCompare(b.start_time))
  const allDayEvents = events.filter(isAllDay)

  return (
    <div className="min-h-screen bg-beige">
      {/* HERO full-bleed, foto di Marsam + overlay navy */}
      <section
        className="relative min-h-[88vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden bg-navy"
      >
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: "url('/foto-header.jpeg')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(31,42,74,0.55) 0%, rgba(44,62,107,0.60) 45%, rgba(107,63,160,0.55) 100%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl">
          <img
            src="/logo-coincidenze-bianco-sottotitolo.png"
            alt="COINCIDENZE — raffinate casualità, occhi attenti"
            className="w-full max-w-[460px] sm:max-w-[620px] mx-auto mb-10"
          />

          <div className="flex flex-col items-center gap-1 text-white/80 text-sm sm:text-base">
            <p className="tracking-wider uppercase text-xs">Edizione 1</p>
            <p>Sabato 25 aprile 2026</p>
            <p className="text-white/65">Marsam Locanda · Bene Vagienna</p>
          </div>

          <Link
            to="/accrediti"
            className="inline-flex items-center gap-2 mt-10 bg-crema text-navy px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white transition-colors shadow-lg"
          >
            <Ticket className="h-4 w-4" />
            Accreditati gratuitamente
          </Link>
          <p className="text-xs text-white/55 mt-3">Ingresso libero previo accredito online</p>
        </div>

        <button
          onClick={() => window.scrollTo({ top: window.innerHeight * 0.88, behavior: 'smooth' })}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 hover:text-white/80 transition-colors"
          aria-label="Scorri giù"
        >
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </button>
      </section>

      {/* INTRO editoriale */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-4xl sm:text-5xl font-semibold text-navy mb-6">
          Una corte delle meraviglie
        </h2>
        {content['intro'] ? (
          <p className="text-base sm:text-lg text-ink-light leading-relaxed whitespace-pre-line">
            {content['intro']}
          </p>
        ) : (
          <p className="text-ink-muted italic">
            Il testo introduttivo sarà disponibile a breve.
          </p>
        )}
        <p className="text-sm text-ink-muted italic mt-10">
          {events.length > 0 && `${events.length} eventi`}
          {events.length > 0 && artists.length > 0 && ' · '}
          {artists.length > 0 && `${artists.length} protagonisti`}
          {(events.length > 0 || artists.length > 0) && ' · una giornata'}
        </p>
      </section>

      <Ornament />

      {/* NAV editoriale */}
      <nav className="sticky top-0 z-30 bg-beige/90 backdrop-blur-sm border-b border-navy/10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((t, i) => {
            const active = activeTab === t.id
            return (
              <div key={t.id} className="flex items-center">
                {i > 0 && <span className="text-navy/20 mx-1 select-none">·</span>}
                <button
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 sm:px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    active ? 'text-navy' : 'text-ink-muted hover:text-navy'
                  }`}
                >
                  <span className="relative">
                    {t.label}
                    {active && (
                      <span className="absolute left-0 right-0 -bottom-1 h-[2px] bg-navy" />
                    )}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </nav>

      {/* TAB content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {activeTab === 'programma' && (
          <>
            <SectionHeader title="Programma" subtitle="Tutto quello che succede il 25 aprile, dalle 10 alle 20." />
            <ProgrammaTab scheduledEvents={scheduledEvents} allDayEvents={allDayEvents} />
          </>
        )}
        {activeTab === 'artisti' && (
          <>
            <SectionHeader title="Protagonisti" subtitle="Le persone che questa giornata la fanno." />
            <ArtistiTab artists={artists} />
          </>
        )}
        {activeTab === 'menu' && (
          <>
            <SectionHeader title="Menù" subtitle="La carta di Marsam, aperta dal mattino alla sera." />
            <MenuTab items={menu} isAdmin={isAuthenticated} />
          </>
        )}
        {activeTab === 'info' && (
          <>
            <SectionHeader title="Informazioni" subtitle="Come arrivare e come trovarci." />
            <InfoTab content={content} isAdmin={isAuthenticated} onSave={updateContent} />
          </>
        )}
      </div>

      <PublicFooter />
    </div>
  )
}

function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 py-4" aria-hidden="true">
      <span className="inline-block h-px w-16 bg-navy/20" />
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-viola/50" />
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-navy/40" />
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-bordeaux/50" />
      <span className="inline-block h-px w-16 bg-navy/20" />
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center mb-8">
      <h2 className="font-display text-3xl sm:text-4xl font-semibold text-navy">{title}</h2>
      <p className="text-sm sm:text-base text-ink-muted italic mt-2">{subtitle}</p>
    </div>
  )
}

// ---- Tabs ----

function ProgrammaTab({
  scheduledEvents,
  allDayEvents,
}: {
  scheduledEvents: Event[]
  allDayEvents: Event[]
}) {
  if (scheduledEvents.length === 0 && allDayEvents.length === 0) {
    return <EmptyState>Il programma completo sarà presto disponibile.</EmptyState>
  }
  return (
    <div className="space-y-2">
      {scheduledEvents.map((event) => (
        <EventRow key={event.id} event={event} />
      ))}
      {allDayEvents.map((event) => (
        <EventRow key={event.id} event={event} allDay />
      ))}
    </div>
  )
}

function EventRow({ event, allDay }: { event: Event; allDay?: boolean }) {
  return (
    <div className="bg-white/60 rounded-lg border border-navy/8 p-3 flex gap-3 items-start">
      <div className="shrink-0 w-16 text-right">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy">
          <Clock className="h-3 w-3 text-ink-muted" />
          {allDay ? 'Tutto il giorno' : event.start_time}
        </span>
      </div>
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: categoryColor(event.category) }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-navy">{event.title}</p>
        {event.location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-ink-muted shrink-0" />
            <p className="text-xs text-ink-muted">{event.location}</p>
          </div>
        )}
        {event.description && (
          <p className="text-xs text-ink-light mt-1">{event.description}</p>
        )}
      </div>
    </div>
  )
}

function ArtistiTab({ artists }: { artists: Artist[] }) {
  if (artists.length === 0) {
    return <EmptyState>La lista degli artisti sarà presto disponibile.</EmptyState>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {artists.map((artist) => (
        <Link
          key={artist.id}
          to={`/artisti/${artist.id}`}
          className="bg-white/60 rounded-lg border border-navy/8 p-3 flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          {artist.image_url ? (
            <img
              src={artist.image_url}
              alt={artist.name}
              className="h-12 w-12 rounded-full object-cover shrink-0"
              loading="lazy"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-full shrink-0 flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: categoryColor(artist.category) }}
            >
              {artist.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy truncate">{artist.name}</p>
            <p className="text-xs text-ink-muted">{categoryLabel(artist.category)}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-muted shrink-0" />
        </Link>
      ))}
    </div>
  )
}

function MenuTab({ items, isAdmin }: { items: MenuItem[]; isAdmin: boolean }) {
  if (items.length === 0) {
    return (
      <EmptyState>
        Il menu sarà presto disponibile.
        {isAdmin && (
          <>
            <br />
            <Link to="/admin/menu" className="text-viola underline text-xs">Aggiungi voci →</Link>
          </>
        )}
      </EmptyState>
    )
  }

  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.category || 'Altro'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([cat, list]) => (
        <section key={cat}>
          <h3 className="font-display text-lg font-semibold text-navy mb-2">{cat}</h3>
          <div className="space-y-1.5">
            {list.map((item) => (
              <div key={item.id} className="bg-white/60 rounded-lg border border-navy/8 p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-ink-light mt-0.5">{item.description}</p>
                  )}
                </div>
                {item.price && (
                  <p className="text-sm font-medium text-navy shrink-0">{item.price}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
      {isAdmin && (
        <Link to="/admin/menu" className="inline-flex items-center text-xs text-viola underline">
          Gestisci menu →
        </Link>
      )}
    </div>
  )
}

function InfoTab({
  content,
  isAdmin,
  onSave,
}: {
  content: Record<string, string>
  isAdmin: boolean
  onSave: (key: string, value: string) => Promise<void>
}) {
  return (
    <div className="space-y-5">
      {INFO_SECTIONS.map((section) => (
        <EditableSection
          key={section.key}
          label={section.label}
          value={content[section.key] || ''}
          isAdmin={isAdmin}
          onSave={(v) => onSave(section.key, v)}
          placeholder={`Aggiungi ${section.label.toLowerCase()}...`}
        />
      ))}
      <a
        href="https://www.google.com/maps/search/?api=1&query=Marsam+Locanda+Frazione+Roncaglia+12+Bene+Vagienna"
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-video rounded-lg overflow-hidden border border-navy/10 bg-navy/5 group"
        title="Apri in Google Maps"
      >
        <iframe
          src="https://www.google.com/maps?q=Marsam+Locanda+Frazione+Roncaglia+12+Bene+Vagienna+CN&output=embed"
          className="w-full h-full pointer-events-none group-hover:pointer-events-auto"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Marsam Locanda — Frazione Roncaglia 12, Bene Vagienna"
        />
      </a>
      <p className="text-xs text-ink-muted text-center mt-1">
        Tocca la mappa per aprire le indicazioni
      </p>
    </div>
  )
}

function EditableSection({
  label,
  value,
  isAdmin,
  onSave,
  placeholder,
}: {
  label: string
  value: string
  isAdmin: boolean
  onSave: (v: string) => Promise<void>
  placeholder: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  const startEdit = () => {
    setDraft(value)
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      await onSave(draft)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-xs font-semibold text-navy uppercase tracking-wider">{label}</h3>
        {isAdmin && !editing && (
          <button onClick={startEdit} className="text-ink-muted hover:text-navy p-0.5" title="Modifica">
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-navy/20 bg-crema p-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-viola/40 resize-y"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Salva
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              Annulla
            </Button>
          </div>
        </div>
      ) : value ? (
        <p className="text-sm text-ink-light leading-relaxed whitespace-pre-line">{linkify(value)}</p>
      ) : (
        <p className="text-sm text-ink-muted italic">{isAdmin ? placeholder : '—'}</p>
      )}
    </div>
  )
}

// Trasforma email, telefoni italiani, URL e handle @instagram in link cliccabili.
function linkify(text: string): React.ReactNode[] {
  const pattern = /(https?:\/\/[^\s<>)]+)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(\+39\s*3\d{2}[\s-]?\d{3}[\s-]?\d{3,4}|\b3\d{2}\s?\d{3}\s?\d{3,4}\b)|(@[a-zA-Z0-9_.]{1,30})/g
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  const linkCls = 'text-viola underline underline-offset-2 decoration-viola/40 hover:decoration-viola'

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const [, url, email, phone, ig] = m
    if (url) {
      out.push(<a key={k++} href={url} target="_blank" rel="noopener noreferrer" className={linkCls}>{url}</a>)
    } else if (email) {
      out.push(<a key={k++} href={`mailto:${email}`} className={linkCls}>{email}</a>)
    } else if (phone) {
      const tel = phone.replace(/\s/g, '')
      out.push(<a key={k++} href={`tel:${tel}`} className={linkCls}>{phone}</a>)
    } else if (ig) {
      const handle = ig.slice(1)
      out.push(<a key={k++} href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer" className={linkCls}>{ig}</a>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-12 text-center rounded-xl border border-dashed border-navy/15 bg-white/30">
      <p className="text-sm text-ink-muted italic">{children}</p>
    </div>
  )
}
