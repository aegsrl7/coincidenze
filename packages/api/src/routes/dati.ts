import { Hono } from 'hono'
import type { Env } from '../index'

const CATEGORY_LABELS: Record<string, string> = {
  scrittura: 'Scrittura', teatro: 'Teatro', fotografia: 'Fotografia',
  pittura: 'Pittura', scultura: 'Scultura', grafica: 'Grafica',
  musica: 'Musica', video: 'Proiezioni Video', 'video-ai': 'Video AI',
  vino: 'Vino', cucina: 'Cucina', 'auto-epoca': "Auto d'Epoca",
  libri: 'Libri', espositori: 'Espositori'
}

const CATEGORY_COLORS: Record<string, string> = {
  scrittura: '#6B3FA0', teatro: '#8B2252', fotografia: '#2C3E6B',
  pittura: '#B8860B', scultura: '#5F6B4E', grafica: '#C4697C',
  musica: '#D4A017', video: '#4A7C8F', 'video-ai': '#00ACC1',
  vino: '#722F37', cucina: '#8B4513', 'auto-epoca': '#4A4A4A',
  libri: '#2C6B4F', espositori: '#A0522D'
}

function esc(str: string | null | undefined): string {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const datiRoutes = new Hono<Env>()

datiRoutes.get('/', async (c) => {
  const db = c.env.DB

  const [artistsRes, eventsRes] = await Promise.all([
    db.prepare('SELECT * FROM artists ORDER BY category, name').all(),
    db.prepare('SELECT * FROM events ORDER BY start_time').all()
  ])

  const artists = artistsRes.results as any[]
  const events = eventsRes.results as any[]

  // Parse artist_ids
  events.forEach(e => {
    if (typeof e.artist_ids === 'string') {
      try { e.artist_ids = JSON.parse(e.artist_ids) } catch { e.artist_ids = [] }
    }
    if (!Array.isArray(e.artist_ids)) e.artist_ids = []
  })

  const artistMap: Record<string, any> = {}
  artists.forEach(a => { artistMap[a.id] = a })

  // Group artists by category
  const artistsByCategory: Record<string, any[]> = {}
  artists.forEach(a => {
    const cat = a.category || 'altro'
    if (!artistsByCategory[cat]) artistsByCategory[cat] = []
    artistsByCategory[cat].push(a)
  })

  // Count per category
  const catCounts: Record<string, number> = {}
  artists.forEach(a => {
    const cat = a.category || 'altro'
    catCounts[cat] = (catCounts[cat] || 0) + 1
  })

  let html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>COINCIDENZE — Dati Evento</title>
<style>
:root { --bg:#F5F0E8; --navy:#2C3E6B; --viola:#6B3FA0; --bordeaux:#8B2252; --ink:#1a1a1a; --ink-muted:#6b6b6b; }
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,'Times New Roman',serif;background:var(--bg);color:var(--ink);line-height:1.6;padding:2rem;max-width:1000px;margin:0 auto}
h1{font-size:2.5rem;color:var(--navy)}
h2{font-size:1.5rem;color:var(--navy);margin:2.5rem 0 1rem;border-bottom:2px solid var(--navy);padding-bottom:.3rem}
.subtitle{font-style:italic;color:var(--viola);margin-bottom:.3rem}
.meta{color:var(--ink-muted);font-size:.9rem;margin-bottom:2rem}
table{border-collapse:collapse;width:100%;margin-top:.5rem}
th,td{text-align:left;padding:.4rem .8rem;border-bottom:1px solid #d4cfc7;font-size:.9rem}
th{font-weight:600;color:var(--navy)}
hr{border:none;border-top:1px solid #d4cfc7;margin:3rem 0}
.cat-header{font-size:1rem;font-weight:600;letter-spacing:.05em;color:white;padding:.3rem .8rem;border-radius:4px;margin:1.5rem 0 .6rem}
.block{background:white;border-radius:8px;padding:.8rem 1rem;margin-bottom:.6rem;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.block-header{font-size:1rem;margin-bottom:.4rem}
.row{display:flex;gap:.8rem;padding:.15rem 0;font-size:.85rem;line-height:1.5}
.label{flex-shrink:0;width:90px;font-weight:600;color:var(--ink-muted)}
.value{flex:1;color:var(--ink)}
.badge{display:inline-block;padding:.1rem .45rem;border-radius:9999px;font-size:.7rem;font-weight:500;color:white;vertical-align:middle}
</style>
</head>
<body>
<h1>COINCIDENZE</h1>
<p class="subtitle">raffinate casualit&agrave;, occhi attenti</p>
<p class="meta">Edizione 1 — Sabato 25 aprile 2026 — Marsam Locanda, Bene Vagienna</p>
`

  // Riepilogo
  html += '<h2>Riepilogo</h2>'
  html += '<table>'
  html += '<tr><th>Dato</th><th>Valore</th></tr>'
  html += `<tr><td>Artisti totali</td><td>${artists.length}</td></tr>`
  html += `<tr><td>Eventi in programma</td><td>${events.length}</td></tr>`
  html += `<tr><td>Categorie attive</td><td>${Object.keys(catCounts).length}</td></tr>`
  for (const [cat, count] of Object.entries(catCounts)) {
    const label = CATEGORY_LABELS[cat] || cat
    html += `<tr><td style="padding-left:1.5rem">&mdash; ${label}</td><td>${count} artisti</td></tr>`
  }
  html += '</table>'

  // Artisti
  html += '<h2>Artisti</h2>'
  for (const [cat, list] of Object.entries(artistsByCategory)) {
    const label = CATEGORY_LABELS[cat] || cat
    const color = CATEGORY_COLORS[cat] || '#666'
    html += `<div class="cat-header" style="background:${color}">${label} (${list.length})</div>`
    for (const a of list) {
      html += '<div class="block">'
      html += `<div class="block-header" style="border-left:4px solid ${color};padding-left:.8rem"><strong>${esc(a.name)}</strong> <span class="badge" style="background:${color}">${label}</span></div>`
      if (a.bio) html += `<div class="row"><span class="label">Bio</span><span class="value">${esc(a.bio)}</span></div>`
      if (a.website) html += `<div class="row"><span class="label">Sito</span><span class="value">${esc(a.website)}</span></div>`
      if (a.image_url) html += `<div class="row"><span class="label">Immagine</span><span class="value">${esc(a.image_url)}</span></div>`
      if (a.notes) html += `<div class="row"><span class="label">Note</span><span class="value" style="font-style:italic">${esc(a.notes)}</span></div>`
      html += '</div>'
    }
  }

  // Programma
  html += '<hr>'
  html += '<h2>Programma — 25 aprile 2026</h2>'
  for (const ev of events) {
    const cat = ev.category || ''
    const label = CATEGORY_LABELS[cat] || cat
    const color = CATEGORY_COLORS[cat] || '#666'
    const artistNames = (ev.artist_ids as string[])
      .map((id: string) => artistMap[id]?.name)
      .filter(Boolean)
      .join(', ')

    html += '<div class="block">'
    html += `<div class="block-header" style="border-left:4px solid ${color};padding-left:.8rem"><strong>${esc(ev.title)}</strong> <span class="badge" style="background:${color}">${label}</span></div>`
    if (ev.start_time) {
      let orario = ev.start_time
      if (ev.end_time) orario += ' — ' + ev.end_time
      html += `<div class="row"><span class="label">Orario</span><span class="value">${esc(orario)}</span></div>`
    }
    if (ev.location) html += `<div class="row"><span class="label">Luogo</span><span class="value">${esc(ev.location)}</span></div>`
    if (artistNames) html += `<div class="row"><span class="label">Artisti</span><span class="value">${esc(artistNames)}</span></div>`
    if (ev.description) html += `<div class="row"><span class="label">Descrizione</span><span class="value">${esc(ev.description)}</span></div>`
    if (ev.notes) html += `<div class="row"><span class="label">Note</span><span class="value" style="font-style:italic">${esc(ev.notes)}</span></div>`
    html += '</div>'
  }

  html += '</body></html>'

  return c.html(html)
})
