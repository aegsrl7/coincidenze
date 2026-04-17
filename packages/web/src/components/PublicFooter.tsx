import { Instagram, Mail, MapPin, Calendar } from 'lucide-react'

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-navy/10 bg-crema/60">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col items-center text-center gap-4">
          <img
            src="/logo-coincidenze.png"
            alt="COINCIDENZE"
            className="w-full max-w-[220px] opacity-90"
          />
          <p className="text-lg text-viola italic">Edizione 1</p>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-ink-light">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-navy/60" />
              Sabato 25 aprile 2026
            </span>
            <span className="hidden sm:inline text-navy/30">|</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-navy/60" />
              Marsam Locanda, Bene Vagienna
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <a
              href="https://www.instagram.com/coincidenze.arte/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-navy transition-colors"
              title="Instagram @coincidenze.arte"
            >
              <Instagram className="h-4 w-4" />
              @coincidenze.arte
            </a>
            <a
              href="mailto:info@coincidenze.org"
              className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-navy transition-colors"
            >
              <Mail className="h-4 w-4" />
              info@coincidenze.org
            </a>
          </div>

          <p className="text-xs text-ink-muted mt-4">
            &copy; {new Date().getFullYear()} COINCIDENZE &middot; raffinate casualità, occhi attenti
          </p>
        </div>
      </div>
    </footer>
  )
}
