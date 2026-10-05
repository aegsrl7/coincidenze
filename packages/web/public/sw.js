// Service worker di COINCIDENZE (stesso impianto di Cadenza): serve a installare l'app e a ricevere
// le notifiche push. Niente cache e niente gestione delle richieste: l'app si carica sempre dalla rete,
// così un deploy arriva subito e sul telefono non resta mai una versione vecchia.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch { d = { body: e.data ? e.data.text() : '' } }
  const opts = {
    body: d.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: d.url || '/admin' },
  }
  if (d.tag) opts.tag = d.tag
  e.waitUntil(self.registration.showNotification(d.title || 'COINCIDENZE', opts))
})

// Tocco sulla notifica: porta in primo piano l'app sulla pagina giusta, altrimenti la apre
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = (e.notification.data && e.notification.data.url) || '/admin'
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) {
      if ('focus' in c) return c.focus().then((w) => (w && 'navigate' in w ? w.navigate(url) : w))
    }
    return self.clients.openWindow(url)
  }))
})
