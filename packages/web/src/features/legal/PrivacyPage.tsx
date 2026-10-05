import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PublicFooter } from '@/components/PublicFooter'
import { useEditionsStore } from '@/stores/editionsStore'

function formatLegalDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function PrivacyPage() {
  const current = useEditionsStore((s) => s.current)
  const fetchEditions = useEditionsStore((s) => s.fetch)
  useEffect(() => { fetchEditions() }, [fetchEditions])

  // Data dell'edizione corrente, es. " (25 aprile 2027)"
  const eventDate = current ? ` (${formatLegalDate(current.event_date)})` : ''

  return (
    <div className="min-h-screen bg-beige">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-navy transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna al sito
        </Link>

        <header className="mb-10">
          <p className="text-xs uppercase tracking-wider text-viola">Informativa</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-navy mt-1">
            Privacy e trattamento dei dati
          </h1>
          <p className="text-sm text-ink-muted mt-2">
            ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR)
          </p>
          <p className="text-xs text-ink-muted mt-1">
            Ultimo aggiornamento: 5 ottobre 2026
          </p>
        </header>

        <article className="prose-style space-y-6 text-sm sm:text-base text-ink-light leading-relaxed">

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-2">1 · Titolare del trattamento</h2>
            <p>
              Il titolare del trattamento dei dati personali raccolti tramite il
              sito <strong>coincidenze.org</strong> è l'organizzazione
              dell'evento <strong>COINCIDENZE</strong>.
            </p>
            <p>
              Per qualsiasi richiesta relativa al trattamento dei dati puoi
              scrivere a{' '}
              <a href="mailto:info@coincidenze.org" className="text-viola underline">
                info@coincidenze.org
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-2">2 · Dati raccolti</h2>
            <p>Attraverso il form di accredito su <code>/accrediti</code> raccogliamo i seguenti dati personali:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Nome e cognome (obbligatori)</li>
              <li>Indirizzo email (obbligatorio)</li>
              <li>Numero di telefono (facoltativo)</li>
              <li>CAP (facoltativo)</li>
              <li>Data di nascita (facoltativa)</li>
              <li>Consensi espressi (privacy, newsletter, riprese foto/video)</li>
            </ul>
            <p className="mt-3">Attraverso il modulo di prenotazione dello spuntino su <code>/spuntino</code> raccogliamo:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Nome e cognome (obbligatori)</li>
              <li>Indirizzo email e numero di telefono (obbligatori)</li>
              <li>Numero di posti e note (facoltative)</li>
              <li>Consenso all'informativa privacy</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-2">3 · Finalità del trattamento</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Gestione dell'accredito e del check-in il giorno dell'evento{eventDate}.</li>
              <li>Invio dell'email di conferma con il biglietto digitale e il codice QR.</li>
              <li>Gestione della prenotazione dello spuntino e invio dell'email di riepilogo.</li>
              <li>Comunicazioni di servizio relative all'evento (es. variazioni di programma).</li>
              <li>
                Se hai prestato il relativo consenso: invio di aggiornamenti
                sulle prossime edizioni di Coincidenze (newsletter facoltativa).
              </li>
              <li>
                Se hai prestato il relativo consenso: utilizzo di riprese
                foto/video effettuate durante l'evento per comunicazioni
                istituzionali e social.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-2">4 · Base giuridica</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Consenso dell'interessato (art. 6.1.a GDPR), per newsletter e riprese foto/video.</li>
              <li>Esecuzione di misure precontrattuali e contrattuali (art. 6.1.b GDPR), per la gestione dell'accredito e della prenotazione.</li>
              <li>Legittimo interesse dell'organizzazione (art. 6.1.f GDPR), per le comunicazioni di servizio.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-2">5 · Destinatari e responsabili del trattamento</h2>
            <p>I dati sono conservati su infrastrutture esterne, con le quali sono stipulati accordi di trattamento ai sensi dell'art. 28 GDPR:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong>Cloudflare, Inc.</strong> (hosting del sito, database D1,
                Email Routing). Privacy policy:{' '}
                <a
                  href="https://www.cloudflare.com/privacypolicy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-viola underline"
                >
                  cloudflare.com/privacypolicy
                </a>.
              </li>
              <li>
                <strong>Resend (Inc.)</strong> (invio delle email di
                conferma). Privacy policy:{' '}
                <a
                  href="https://resend.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-viola underline"
                >
                  resend.com/legal/privacy-policy
                </a>.
              </li>
            </ul>
            <p className="mt-2">
              Le notifiche di nuovi accrediti e prenotazioni (nome, email,
              telefono e CAP oppure note) arrivano anche alla casella email
              dell'organizzazione, gestita con Gmail di Google. Privacy
              policy:{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-viola underline"
              >
                policies.google.com/privacy
              </a>.
            </p>
            <p className="mt-2">
              I dati non sono ceduti né venduti a terzi per finalità di
              marketing di soggetti diversi dall'organizzazione di Coincidenze.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-2">6 · Trasferimenti extra-UE</h2>
            <p>
              Alcuni fornitori (Cloudflare, Resend, Google) possono trattare dati
              anche al di fuori dello Spazio Economico Europeo. I
              trasferimenti avvengono sulla base delle Clausole Contrattuali
              Standard approvate dalla Commissione europea oppure di decisioni
              di adeguatezza, in conformità agli artt. 44-49 GDPR.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-2">7 · Periodo di conservazione</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Dati di accredito (nome, cognome, email, telefono, CAP, data
                di nascita): conservati fino a 30 giorni dopo la data
                dell'evento{eventDate}, salvo obblighi di legge.
              </li>
              <li>
                Dati di prenotazione dello spuntino (nome, cognome, email,
                telefono, note): conservati fino a 30 giorni dopo la data
                dell'evento, salvo obblighi di legge.
              </li>
              <li>
                Copie degli stessi dati nelle email di notifica
                all'organizzazione: cancellate negli stessi tempi.
              </li>
              <li>
                Email per newsletter (se hai prestato consenso): conservate
                fino alla revoca del consenso.
              </li>
              <li>
                Materiale foto/video pubblicato (se hai prestato consenso):
                conservato senza limiti di tempo ai fini di archivio
                dell'evento, salvo richiesta di rimozione.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-2">8 · Diritti dell'interessato</h2>
            <p>In relazione ai dati personali che ti riguardano, hai diritto di:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>accedervi (art. 15 GDPR);</li>
              <li>chiederne la rettifica (art. 16);</li>
              <li>chiederne la cancellazione (art. 17);</li>
              <li>chiederne la limitazione (art. 18);</li>
              <li>riceverli in formato strutturato (portabilità, art. 20);</li>
              <li>opporti al trattamento (art. 21);</li>
              <li>revocare in qualsiasi momento i consensi prestati.</li>
            </ul>
            <p className="mt-2">
              Per esercitare questi diritti puoi scrivere a{' '}
              <a href="mailto:info@coincidenze.org" className="text-viola underline">
                info@coincidenze.org
              </a>.
              Daremo riscontro senza ingiustificato ritardo e comunque entro
              un mese dalla ricezione della richiesta.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-2">9 · Reclamo al Garante</h2>
            <p>
              Hai sempre diritto di presentare un reclamo all'autorità di
              controllo competente. In Italia è il{' '}
              <a
                href="https://www.garanteprivacy.it"
                target="_blank"
                rel="noopener noreferrer"
                className="text-viola underline"
              >
                Garante per la protezione dei dati personali
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-2">10 · Cookie e strumenti di analisi</h2>
            <p>
              Il sito <strong>coincidenze.org</strong> non utilizza cookie di
              profilazione né strumenti di analisi comportamentale di terze
              parti. Vengono usati solo cookie tecnici strettamente necessari
              al funzionamento (es. sessione di accesso all'area
              amministrativa), per cui non è richiesto alcun consenso
              specifico.
            </p>
            <p className="mt-2">
              Per le statistiche di visita usiamo Cloudflare Web Analytics,
              che conta le visite in forma aggregata, senza cookie e senza
              identificare i singoli visitatori.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-navy mb-2">11 · Aggiornamenti all'informativa</h2>
            <p>
              Ci riserviamo di aggiornare questa informativa ogni volta che le
              finalità del trattamento o i fornitori cambieranno. La versione
              vigente è sempre consultabile a questa pagina, con indicazione
              della data di ultimo aggiornamento in alto.
            </p>
          </section>
        </article>
      </div>
      <PublicFooter />
    </div>
  )
}
