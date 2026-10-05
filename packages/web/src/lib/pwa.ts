/**
 * App installabile e notifiche push (stesso impianto di Cadenza). Il manifest e il service worker
 * si attivano solo nell'area riservata: il sito pubblico non propone l'installazione ai visitatori.
 * Su iPhone le notifiche esistono solo con l'app aggiunta alla schermata Home (iOS 16.4+).
 */
import { api } from '@/lib/api'

// Evento di Chrome/Android che permette il pulsante "Installa" (su iPhone non esiste: si fa da Condividi)
let installPrompt: (Event & { prompt: () => Promise<void> }) | null = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    installPrompt = e as Event & { prompt: () => Promise<void> }
  })
  window.addEventListener('appinstalled', () => { installPrompt = null })
}

export const canPromptInstall = () => installPrompt != null

export async function promptInstall(): Promise<void> {
  const p = installPrompt
  if (!p) return
  await p.prompt()
  installPrompt = null
}

function ensureHeadTag(selector: string, create: () => HTMLElement) {
  if (!document.head.querySelector(selector)) document.head.appendChild(create())
}

function meta(name: string, content: string) {
  const m = document.createElement('meta')
  m.name = name
  m.content = content
  return m
}

let enabled = false

/** Attiva la modalità app (manifest, meta per iPhone, service worker). Idempotente. */
export function enableAppMode(): void {
  if (enabled || typeof document === 'undefined') return
  enabled = true
  ensureHeadTag('link[rel="manifest"]', () => {
    const l = document.createElement('link')
    l.rel = 'manifest'
    l.href = '/manifest.webmanifest'
    return l
  })
  ensureHeadTag('meta[name="theme-color"]', () => meta('theme-color', '#F5F0E8'))
  ensureHeadTag('meta[name="apple-mobile-web-app-capable"]', () => meta('apple-mobile-web-app-capable', 'yes'))
  ensureHeadTag('meta[name="mobile-web-app-capable"]', () => meta('mobile-web-app-capable', 'yes'))
  ensureHeadTag('meta[name="apple-mobile-web-app-title"]', () => meta('apple-mobile-web-app-title', 'COINCIDENZE'))
  ensureHeadTag('meta[name="apple-mobile-web-app-status-bar-style"]', () => meta('apple-mobile-web-app-status-bar-style', 'default'))
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('service worker', e))
  }
}

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true)

export const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

export const isAndroid = () => typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)

export const permissionState = (): NotificationPermission | 'unsupported' =>
  typeof Notification === 'undefined' ? 'unsupported' : Notification.permission

function keyBytes(b64url: string): Uint8Array {
  const pad = '='.repeat((4 - (b64url.length % 4)) % 4)
  const raw = atob((b64url + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (ch) => ch.charCodeAt(0))
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

/** true se questo dispositivo è abbonato e il server lo conosce per l'utente loggato */
export async function pushActive(): Promise<boolean> {
  const sub = await currentSubscription().catch(() => null)
  if (!sub) return false
  return (await api.getPushStatus(sub.endpoint)).active
}

/** Dal tocco su "Attiva": permesso, abbonamento con la chiave VAPID, registrazione sul server */
export async function enablePush(): Promise<void> {
  const { key } = await api.getPushKey()
  if (!key) throw new Error('Le notifiche sul telefono non sono ancora configurate')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Permesso non concesso: le notifiche restano spente')
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) as BufferSource }))
  const j = sub.toJSON()
  await api.subscribePush({ endpoint: j.endpoint, keys: j.keys, ua: navigator.userAgent })
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription()
  if (!sub) return
  await api.unsubscribePush(sub.endpoint).catch(() => {})
  await sub.unsubscribe()
}
