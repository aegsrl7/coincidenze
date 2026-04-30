import { useCallback } from 'react'
import { Link, useNavigationType, useSearchParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { PublicFooter } from '@/components/PublicFooter'
import { useEditionsStore } from '@/stores/editionsStore'
import { useEditionDataStore } from '@/stores/editionStore'
import type { Edition } from '@/types'
import { useEditionData } from './useEditionData'
import { useScrollMemory } from './useScrollMemory'
import {
  EMPTY_CONTENT,
  Ornament, TabNav, ProgrammaTab, ArtistiTab, GalleriaTab, EditableIntro,
  isAllDay, isPast, formatItalianDate,
  type TabId,
} from './parts'

/**
 * Edizione non corrente (passata): hero compatto + tab + galleria, niente CTA.
 * Mostra anche un link all'edizione attiva, se diversa.
 */
export function PastEdition({ edition, isAuthenticated }: { edition: Edition; isAuthenticated: boolean }) {
  const updateContent = useEditionDataStore((s) => s.updateContent)
  const content = useEditionDataStore((s) => s.contents[edition.slug] || EMPTY_CONTENT)

  const editions = useEditionsStore((s) => s.editions)
  const upcoming = editions.find((e) => e.is_current === 1 && !isPast(e.event_date)) || null

  const { events, artists } = useEditionData(edition.slug)

  const [searchParams, setSearchParams] = useSearchParams()
  const navType = useNavigationType()

  const tabFromUrl = searchParams.get('tab')
  const activeTab: TabId = tabFromUrl === 'artisti' || tabFromUrl === 'galleria' ? tabFromUrl : 'programma'
  const setActiveTab = useCallback(
    (t: TabId) => setSearchParams({ tab: t }, { replace: true }),
    [setSearchParams]
  )

  useScrollMemory(`edizione:${edition.slug}:scroll:${activeTab}`, navType, activeTab)

  const scheduledEvents = events.filter((e) => !isAllDay(e)).sort((a, b) => a.start_time.localeCompare(b.start_time))
  const allDayEvents = events.filter(isAllDay)

  return (
    <div className="min-h-screen bg-beige">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 pt-10 pb-2">
        <div className="text-center pt-8 sm:pt-12">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">COINCIDENZE</h1>
          <p className="text-lg text-viola italic mt-2">{edition.name}</p>
          <p className="text-sm text-ink-muted mt-3">
            {edition.hero_subtitle || formatItalianDate(edition.event_date)} &middot; {edition.hero_location}
          </p>

          {upcoming && upcoming.id !== edition.id && (
            <Link
              to={`/${upcoming.slug}`}
              className="inline-flex items-center gap-1.5 mt-6 text-xs text-viola hover:text-bordeaux border border-viola/30 hover:border-bordeaux/40 rounded-full px-3 py-1.5 transition-colors"
            >
              Vai a {upcoming.name} <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        <section className="my-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="font-display text-2xl font-semibold text-navy text-center">
              {pastIntroTitle(edition)}
            </h2>
          </div>
          <EditableIntro
            slug={edition.slug}
            value={content['intro'] || ''}
            isAdmin={isAuthenticated}
            onSave={(v) => updateContent(edition.slug, 'intro', v)}
            align="center"
          />
        </section>

        <section className="mb-10">
          <div className="bg-navy/5 rounded-xl px-6 py-5">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-navy font-medium">
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold">{events.length}</span>
                Eventi
              </span>
              <span className="hidden sm:inline text-navy/30">|</span>
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold">{artists.length}</span>
                Protagonisti
              </span>
              <span className="hidden sm:inline text-navy/30">|</span>
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold">1</span>
                Giornata
              </span>
            </div>
          </div>
        </section>
      </div>

      <Ornament />

      <TabNav
        tabs={[
          { id: 'programma', label: 'Programma' },
          { id: 'artisti', label: 'Artisti' },
          { id: 'galleria', label: 'Galleria' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {activeTab === 'programma' && (
          <ProgrammaTab scheduledEvents={scheduledEvents} allDayEvents={allDayEvents} />
        )}
        {activeTab === 'artisti' && <ArtistiTab artists={artists} />}
        {activeTab === 'galleria' && <GalleriaTab edition={edition} isAuthenticated={isAuthenticated} />}
      </div>

      <PublicFooter />
    </div>
  )
}

function pastIntroTitle(edition: Edition): string {
  if (edition.year === 2025) return "L'edizione che ha dato inizio a tutto"
  return 'Una corte delle meraviglie'
}
