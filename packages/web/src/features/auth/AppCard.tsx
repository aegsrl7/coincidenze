import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import {
  canPromptInstall, promptInstall, enablePush, disablePush, pushActive,
  pushSupported, permissionState, isStandalone, isIOS, isAndroid,
} from '@/lib/pwa'

type State = 'loading' | 'unsupported' | 'unconfigured' | 'denied' | 'off' | 'on'

/** Cosa riceve l'utente, in base ai permessi del suo ruolo (stessi controlli del server). */
function topicsFor(permissions: string[]): string[] {
  const t: string[] = []
  if (permissions.includes('accrediti.view')) t.push('i nuovi accrediti')
  if (permissions.includes('spuntino.view')) t.push('le prenotazioni dello spuntino')
  if (permissions.includes('editoriale.view')) t.push('alle 18 i post da pubblicare in giornata')
  return t
}

function joinIt(items: string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
}

/** App sul telefono: installazione e notifiche push su questo dispositivo. */
export function AppCard() {
  const permissions = useAuthStore((s) => s.permissions)
  const [state, setState] = useState<State>('loading')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [installable, setInstallable] = useState(canPromptInstall())
  const standalone = isStandalone()
  const topics = topicsFor(permissions)

  const refresh = async () => {
    if (!pushSupported()) return setState('unsupported')
    if (permissionState() === 'denied') return setState('denied')
    try {
      const { key } = await api.getPushKey()
      if (!key) return setState('unconfigured')
      setState((await pushActive()) ? 'on' : 'off')
    } catch {
      setState('off')
    }
  }

  useEffect(() => { refresh() }, [])
  // L'evento di installazione di Chrome può arrivare dopo il caricamento
  useEffect(() => {
    const t = setInterval(() => setInstallable(canPromptInstall()), 1500)
    return () => clearInterval(t)
  }, [])

  const run = async (task: () => Promise<void>, ok: string) => {
    setBusy(true)
    setMessage('')
    try {
      await task()
      setMessage(ok)
      await refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Operazione non riuscita')
    } finally {
      setBusy(false)
    }
  }

  const test = () => run(async () => {
    const r = await api.testPush()
    if (!r.sent) throw new Error(r.failed ? 'Il servizio push non ha accettato la notifica: disattiva e riattiva' : 'Nessun dispositivo attivo')
  }, 'Notifica di prova inviata')

  const howTo = isIOS()
    ? <p className="text-sm text-ink-muted">Su iPhone le notifiche arrivano solo con l'app installata: in Safari tocca <strong>Condividi</strong>, poi <strong>Aggiungi alla schermata Home</strong>, e apri COINCIDENZE dall'icona.</p>
    : isAndroid()
      ? <p className="text-sm text-ink-muted">Per averla come app: in Chrome apri il menu <strong>⋮</strong> e tocca <strong>Installa app</strong> (o <strong>Aggiungi a schermata Home</strong>).</p>
      : <p className="text-sm text-ink-muted">Sul computer puoi installarla dall'icona di installazione nella barra degli indirizzi di Chrome. Sul telefono apri questa pagina e segui le istruzioni.</p>

  if (state === 'loading') return null

  return (
    <section className="bg-white/60 rounded-xl border border-navy/10 p-5 space-y-3">
      <h2 className="font-display text-lg font-semibold text-navy flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-viola" />
        App e notifiche
      </h2>

      {standalone
        ? <p className="text-sm text-ink-light">Stai usando COINCIDENZE come app.</p>
        : howTo}

      {state === 'on' && (
        <>
          <p className="text-sm text-ink-light">
            <strong className="text-navy">Notifiche attive su questo dispositivo.</strong>{' '}
            {topics.length ? `Ti avvisiamo di ${joinIt(topics)}, anche con l'app chiusa.` : 'Il tuo ruolo per ora non riceve notifiche.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={test}>Prova</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(disablePush, 'Notifiche spente su questo dispositivo')}>Disattiva</Button>
          </div>
        </>
      )}

      {state === 'off' && (
        <>
          <p className="text-sm text-ink-light">
            {topics.length
              ? `Ricevi sul telefono ${joinIt(topics)}, anche con l'app chiusa.`
              : 'Il tuo ruolo per ora non riceve notifiche, ma puoi attivarle per quando ne arriveranno.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => run(enablePush, 'Notifiche attivate')}>Attiva le notifiche</Button>
            {!standalone && installable && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => run(promptInstall, 'Segui le istruzioni del browser')}>
                Installa l'app
              </Button>
            )}
          </div>
        </>
      )}

      {state === 'denied' && (
        <p className="text-sm text-ink-muted">Le notifiche sono bloccate per questo sito nelle impostazioni del telefono: riattivale da lì, poi torna qui.</p>
      )}
      {state === 'unsupported' && !(isIOS() && !standalone) && (
        <p className="text-sm text-ink-muted">Questo browser non supporta le notifiche.</p>
      )}
      {state === 'unconfigured' && (
        <p className="text-sm text-ink-muted">Le notifiche sul telefono non sono ancora configurate.</p>
      )}

      {message && <p className="text-sm text-viola">{message}</p>}
    </section>
  )
}
