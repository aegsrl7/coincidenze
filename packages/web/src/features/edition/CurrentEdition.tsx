import { useCallback } from 'react'
import { Link, useNavigationType, useSearchParams } from 'react-router-dom'
import { ChevronDown, Ticket, UtensilsCrossed } from 'lucide-react'
import { PublicFooter } from '@/components/PublicFooter'
import { useEditionDataStore } from '@/stores/editionStore'
import type { Edition } from '@/types'
import { useEditionData } from './useEditionData'
import { useScrollMemory } from './useScrollMemory'
import {
  EMPTY_GALLERY, EMPTY_CONTENT,
  Ornament, SectionHeader, TabNav, ProgrammaTab, ArtistiTab, GalleriaTab, EditableIntro,
  isAllDay, isPast, formatItalianDate,
  type TabId,
} from './parts'

/**
 * Edizione corrente (is_current=1): hero foto pieno schermo + CTA accrediti/spuntino
 * (se i flag sono aperti). Se l'evento è passato, mostra "Edizione N conclusa".
 */
export function CurrentEdition({ edition, isAuthenticated }: { edition: Edition; isAuthenticated: boolean }) {
  const updateContent = useEditionDataStore((s) => s.updateContent)
  const gallery = useEditionDataStore((s) => s.galleries[edition.slug] || EMPTY_GALLERY)
  const content = useEditionDataStore((s) => s.contents[edition.slug] || EMPTY_CONTENT)

  const { events, artists } = useEditionData(edition.slug)

  const [searchParams, setSearchParams] = useSearchParams()
  const navType = useNavigationType()

  const past = isPast(edition.event_date)
  const hasGallery = gallery.length > 0
  const showGalleria = past || hasGallery
  const tabFromUrl = searchParams.get('tab')
  const activeTab: TabId = (
    tabFromUrl === 'artisti' ? 'artisti'
    : (tabFromUrl === 'galleria' && showGalleria) ? 'galleria'
    : 'programma'
  )
  const setActiveTab = useCallback(
    (t: TabId) => setSearchParams({ tab: t }, { replace: true }),
    [setSearchParams]
  )

  useScrollMemory(`edizione:${edition.slug}:scroll:${activeTab}`, navType, activeTab)

  const scheduledEvents = events.filter((e) => !isAllDay(e)).sort((a, b) => a.start_time.localeCompare(b.start_time))
  const allDayEvents = events.filter(isAllDay)
  const heroImage = edition.hero_image_url || '/foto-header.jpeg'

  return (
    <div className="min-h-screen bg-beige">
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden bg-navy">
        <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url('${heroImage}')` }} aria-hidden="true" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,28,52,0.78) 0%, rgba(44,62,107,0.80) 45%, rgba(107,63,160,0.78) 100%)',
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
            <p className="tracking-wider uppercase text-xs">{edition.name}</p>
            <p>{edition.hero_subtitle || formatItalianDate(edition.event_date)}</p>
            <p className="text-white/65">{edition.hero_location}</p>
          </div>

          {past ? (
            <>
              <div className="inline-block mt-10 bg-white/10 backdrop-blur-sm border border-white/25 text-white px-5 py-3 rounded-lg text-sm font-medium">
                {edition.name} conclusa
              </div>
              <p className="text-xs text-white/65 mt-3 max-w-md mx-auto leading-relaxed">
                Ci rivediamo per la prossima edizione — torna a trovarci fra qualche mese.
              </p>
            </>
          ) : edition.accrediti_open === 1 ? (
            <>
              <Link
                to="/accrediti"
                className="inline-flex items-center gap-2 mt-10 bg-crema text-navy px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white transition-colors shadow-lg"
              >
                <Ticket className="h-4 w-4" />
                Accreditati gratuitamente
              </Link>
              <p className="text-xs text-white/55 mt-3">Ingresso libero previo accredito online</p>
            </>
          ) : (
            <div className="inline-block mt-10 bg-white/10 backdrop-blur-sm border border-white/25 text-white px-5 py-3 rounded-lg text-sm font-medium">
              Gli accrediti apriranno presto
            </div>
          )}

          {!past && edition.spuntino_open === 1 && (
            <>
              <Link
                to="/spuntino"
                className="inline-flex items-center gap-2 mt-5 bg-transparent border border-white/35 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <UtensilsCrossed className="h-4 w-4" />
                Prenota lo spuntino delle 18
              </Link>
              <p className="text-xs text-white/55 mt-3">Sei piatti in sequenza · 25€ · posti limitati</p>
            </>
          )}
        </div>

        <button
          onClick={() => window.scrollTo({ top: window.innerHeight * 0.88, behavior: 'smooth' })}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 hover:text-white/80 transition-colors"
          aria-label="Scorri giù"
        >
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </button>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-4xl sm:text-5xl font-semibold text-navy mb-6">
          Una corte delle meraviglie
        </h2>
        <EditableIntro
          slug={edition.slug}
          value={content['intro'] || ''}
          isAdmin={isAuthenticated}
          onSave={(v) => updateContent(edition.slug, 'intro', v)}
        />
        <p className="text-sm text-ink-muted italic mt-10">
          {events.length > 0 && `${events.length} eventi`}
          {events.length > 0 && artists.length > 0 && ' · '}
          {artists.length > 0 && `${artists.length} protagonisti`}
          {(events.length > 0 || artists.length > 0) && ' · una giornata'}
        </p>
      </section>

      <Ornament />

      <TabNav
        tabs={
          showGalleria
            ? [
                { id: 'programma', label: 'Programma' },
                { id: 'artisti', label: 'Artisti' },
                { id: 'galleria', label: 'Galleria' },
              ]
            : [
                { id: 'programma', label: 'Programma' },
                { id: 'artisti', label: 'Artisti' },
              ]
        }
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {activeTab === 'programma' && (
          <>
            <SectionHeader title="Programma" subtitle={`Tutto quello che succede ${formatItalianDate(edition.event_date)}.`} />
            <ProgrammaTab scheduledEvents={scheduledEvents} allDayEvents={allDayEvents} />
          </>
        )}
        {activeTab === 'artisti' && (
          <>
            <SectionHeader title="Protagonisti" subtitle="Le persone che questa giornata la fanno." />
            <ArtistiTab artists={artists} />
          </>
        )}
        {activeTab === 'galleria' && showGalleria && (
          <>
            <SectionHeader title="Galleria" subtitle="Foto e video dalla giornata." />
            <GalleriaTab edition={edition} isAuthenticated={isAuthenticated} />
          </>
        )}
      </div>

      <PublicFooter />
    </div>
  )
}
