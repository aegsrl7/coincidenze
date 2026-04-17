import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigationType, useSearchParams } from 'react-router-dom'
import { Ticket, Calendar, Utensils, Info, Users, ChevronDown } from 'lucide-react'
import { PublicFooter } from '@/components/PublicFooter'
import { useEdizione1Store } from '@/stores/edizione1Store'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import type { Event, Artist, MenuItem } from '@/types'
import { ProgrammaTab, ArtistiTab, MenuTab, InfoTab } from './Edizione1Page'

type TabId = 'programma' | 'artisti' | 'menu' | 'info'

const TABS: { id: TabId; label: string; icon: typeof Calendar }[] = [
  { id: 'programma', label: 'Programma', icon: Calendar },
  { id: 'artisti', label: 'Artisti', icon: Users },
  { id: 'menu', label: 'Menù', icon: Utensils },
  { id: 'info', label: 'Info', icon: Info },
]

function isAllDay(event: Event): boolean {
  if (!event.start_time || !event.end_time) return false
  const start = parseInt(event.start_time.split(':')[0], 10)
  const end = parseInt(event.end_time.split(':')[0], 10)
  return end - start >= 8
}

export function EdizioneV2Page() {
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
    const key = `edizione1v2:scroll:${activeTab}`
    if (navType === 'POP') {
      const saved = Number(sessionStorage.getItem(key) || 0)
      if (saved > 0) {
        const attempts = [60, 180, 360, 600, 1000]
        attempts.forEach((ms) =>
          window.setTimeout(() => {
            if (Math.abs(window.scrollY - saved) > 4) window.scrollTo(0, saved)
          }, ms)
        )
      }
    } else {
      window.scrollTo(0, 0)
    }
  }, [activeTab, navType])

  const scheduledEvents = events.filter((e) => !isAllDay(e)).sort((a, b) => a.start_time.localeCompare(b.start_time))
  const allDayEvents = events.filter(isAllDay)

  return (
    <div className="min-h-screen bg-beige">
      {/* HERO full-bleed, gradiente brand */}
      <section
        className="relative min-h-[88vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1f2a4a 0%, #2C3E6B 35%, #6B3FA0 70%, #8B2252 100%)',
        }}
      >
        {/* texture sottile di puntini, richiama "casualità" */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative z-10 max-w-3xl">
          <img
            src="/logo-coincidenze-bianco.png"
            alt="COINCIDENZE"
            className="w-full max-w-[380px] sm:max-w-[520px] mx-auto mb-10"
          />

          <p className="font-display italic text-white/95 text-3xl sm:text-5xl leading-tight">
            raffinate casualità,<br />occhi attenti
          </p>

          <div className="mt-10 flex flex-col items-center gap-1 text-white/75 text-sm sm:text-base">
            <p className="tracking-wider uppercase text-xs">Edizione 1</p>
            <p>Sabato 25 aprile 2026</p>
            <p className="text-white/60">Marsam Locanda · Bene Vagienna</p>
          </div>

          <Link
            to="/accrediti"
            className="inline-flex items-center gap-2 mt-10 bg-crema text-navy px-6 py-3 rounded-full text-sm font-medium hover:bg-white transition-colors shadow-lg"
          >
            <Ticket className="h-4 w-4" />
            Accreditati gratuitamente
          </Link>
          <p className="text-xs text-white/50 mt-3">Ingresso libero previo accredito online</p>
        </div>

        {/* indicator "scroll giù" */}
        <button
          onClick={() => window.scrollTo({ top: window.innerHeight * 0.88, behavior: 'smooth' })}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 hover:text-white/80 transition-colors"
          aria-label="Scorri giù"
        >
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </button>
      </section>

      {/* INTRO editoriale */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
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
        <div className="max-w-[900px] mx-auto px-4 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
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
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-12">
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
