import { useEffect } from 'react'
import { Instagram, Mail, MapPin, Calendar, Phone, ExternalLink } from 'lucide-react'
import { useEditionsStore } from '@/stores/editionsStore'
import { useEditionDataStore } from '@/stores/editionStore'

const EMPTY_CONTENT: Record<string, string> = {}

const INFO_KEYS = [
  { key: 'info_address', label: 'Dove siamo' },
  { key: 'info_how_to_get_there', label: 'Come arrivare' },
  { key: 'info_schedule', label: 'Orari evento' },
  { key: 'info_contacts', label: 'Contatti' },
] as const

const linkCls = 'text-viola underline underline-offset-2 decoration-viola/40 hover:decoration-viola'

export function PublicFooter() {
  const fetchEditions = useEditionsStore((s) => s.fetch)
  const current = useEditionsStore((s) => s.current)
  const editions = useEditionsStore((s) => s.editions)
  const fetchContent = useEditionDataStore((s) => s.fetchContent)
  const content = useEditionDataStore((s) => (current ? s.contents[current.slug] : null) || EMPTY_CONTENT)

  useEffect(() => { fetchEditions() }, [fetchEditions])
  useEffect(() => {
    if (current) fetchContent(current.slug)
  }, [current, fetchContent])

  const hasInfo = INFO_KEYS.some((k) => content[k.key])
  const dateLine = current?.hero_subtitle || (current ? formatDate(current.event_date) : '')
  const locationLine = current?.hero_location || 'Marsam Locanda, Bene Vagienna'

  return (
    <footer className="mt-16 border-t border-navy/10 bg-crema/60">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col items-center text-center gap-4">
          <img src="/logo-coincidenze.png" alt="COINCIDENZE" className="w-full max-w-[220px] opacity-90" />
          {current && <p className="text-lg text-viola italic">{current.name}</p>}

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-ink-light">
            {dateLine && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-navy/60" />
                {dateLine}
              </span>
            )}
            {dateLine && <span className="hidden sm:inline text-navy/30">|</span>}
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-navy/60" />
              {locationLine}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <a href="https://www.instagram.com/coincidenze.arte/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-navy transition-colors">
              <Instagram className="h-4 w-4" />
              @coincidenze.arte
            </a>
            <a href="mailto:info@coincidenze.org" className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-navy transition-colors">
              <Mail className="h-4 w-4" />
              info@coincidenze.org
            </a>
          </div>
        </div>

        {hasInfo && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            {INFO_KEYS.map((info) => {
              const val = content[info.key]
              if (!val) return null
              return (
                <div key={info.key}>
                  <h4 className="text-xs font-semibold text-navy uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    {iconFor(info.key)}
                    {info.label}
                  </h4>
                  <p className="text-sm text-ink-light leading-relaxed whitespace-pre-line">{linkify(val)}</p>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-8">
          <a
            href="https://www.google.com/maps/search/?api=1&query=Marsam+Locanda+Frazione+Roncaglia+12+Bene+Vagienna"
            target="_blank"
            rel="noopener noreferrer"
            className="block aspect-[16/7] sm:aspect-[16/5] rounded-lg overflow-hidden border border-navy/10 bg-navy/5 group"
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
          <p className="text-xs text-ink-muted text-center mt-1.5">Tocca la mappa per le indicazioni</p>
        </div>

        {editions.length > 1 && (
          <div className="mt-8 pt-6 border-t border-navy/10 text-center">
            <p className="text-[11px] uppercase tracking-wider text-ink-muted mb-2">Edizioni</p>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-sm">
              {editions.map((ed) => (
                <a
                  key={ed.id}
                  href={`/${ed.slug}`}
                  className="text-ink-light hover:text-navy transition-colors inline-flex items-center gap-1"
                >
                  {ed.name}
                  {ed.is_current === 1 && <span className="text-[10px] text-viola">●</span>}
                </a>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-ink-muted mt-8 text-center">
          &copy; {new Date().getFullYear()} COINCIDENZE &middot; raffinate casualità, occhi attenti
        </p>
      </div>
    </footer>
  )
}

function iconFor(key: string) {
  switch (key) {
    case 'info_address': return <MapPin className="h-3.5 w-3.5 text-navy/60" />
    case 'info_contacts': return <Phone className="h-3.5 w-3.5 text-navy/60" />
    case 'info_schedule': return <Calendar className="h-3.5 w-3.5 text-navy/60" />
    case 'info_how_to_get_there': return <ExternalLink className="h-3.5 w-3.5 text-navy/60" />
    default: return null
  }
}

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

// Trasforma email, telefoni italiani, URL e handle @instagram in link cliccabili.
function linkify(text: string): React.ReactNode[] {
  const pattern = /(https?:\/\/[^\s<>)]+)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(\+39\s*3\d{2}[\s-]?\d{3}[\s-]?\d{3,4}|\b3\d{2}\s?\d{3}\s?\d{3,4}\b)|(@[a-zA-Z0-9_.]{1,30})/g
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let k = 0

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
