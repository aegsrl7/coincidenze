// Dati pubblici dell'edizione corrente, per preparare grafiche e testi.
// Script esterno (non inline) perché la CSP del sito accetta solo script-src 'self'.
const API = 'https://api.coincidenze.org/api';

const CATEGORY_LABELS = {
  scrittura: 'Scrittura', teatro: 'Teatro', fotografia: 'Fotografia',
  pittura: 'Pittura', scultura: 'Scultura', grafica: 'Grafica',
  musica: 'Musica', video: 'Proiezioni Video', 'video-ai': 'Video AI',
  vino: 'Vino', cucina: 'Cucina', 'auto-epoca': "Auto d'Epoca",
  libri: 'Libri', espositori: 'Espositori'
};

const CATEGORY_COLORS = {
  scrittura: '#6B3FA0', teatro: '#8B2252', fotografia: '#2C3E6B',
  pittura: '#B8860B', scultura: '#5F6B4E', grafica: '#C4697C',
  musica: '#D4A017', video: '#4A7C8F', 'video-ai': '#00ACC1',
  vino: '#722F37', cucina: '#8B4513', 'auto-epoca': '#4A4A4A',
  libri: '#2C6B4F', espositori: '#A0522D'
};

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  const s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function loadData() {
  try {
    const [edition, artists, events] = await Promise.all([
      fetch(`${API}/editions/current`).then(r => r.json()),
      fetch(`${API}/artists`).then(r => r.json()),
      fetch(`${API}/events`).then(r => r.json())
    ]);
    const dateLabel = edition.hero_subtitle || formatDate(edition.event_date);
    document.getElementById('meta').textContent = `${edition.name} · ${dateLabel} · ${edition.hero_location}`;

    // Sort artists by category then name
    artists.sort((a, b) => {
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return a.name.localeCompare(b.name);
    });

    // Sort events by start_time
    events.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    // Parse artist_ids (stored as JSON string)
    events.forEach(e => {
      if (typeof e.artist_ids === 'string') {
        try { e.artist_ids = JSON.parse(e.artist_ids); } catch { e.artist_ids = []; }
      }
      if (!Array.isArray(e.artist_ids)) e.artist_ids = [];
    });

    const artistMap = {};
    artists.forEach(a => { artistMap[a.id] = a; });

    render(artists, events, artistMap);
  } catch (err) {
    document.getElementById('content').innerHTML =
      `<p class="loading">Errore nel caricamento: ${err.message}</p>`;
  }
}

function render(artists, events, artistMap) {
  let html = '';

  // ─── RIEPILOGO ───
  html += '<h2>Riepilogo</h2>';
  const catCounts = {};
  artists.forEach(a => {
    const cat = a.category || 'altro';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });
  html += `<table class="summary-table">`;
  html += `<tr><th>Dato</th><th>Valore</th></tr>`;
  html += `<tr><td>Artisti totali</td><td>${artists.length}</td></tr>`;
  html += `<tr><td>Eventi in programma</td><td>${events.length}</td></tr>`;
  html += `<tr><td>Categorie attive</td><td>${Object.keys(catCounts).length}</td></tr>`;
  for (const [cat, count] of Object.entries(catCounts)) {
    const label = CATEGORY_LABELS[cat] || cat;
    html += `<tr><td style="padding-left:1.5rem">— ${label}</td><td>${count} artisti</td></tr>`;
  }
  html += '</table>';

  // ─── ARTISTI ───
  html += '<h2>Artisti</h2>';

  // Group by category
  const grouped = {};
  artists.forEach(a => {
    const cat = a.category || 'altro';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(a);
  });

  for (const [cat, list] of Object.entries(grouped)) {
    const label = CATEGORY_LABELS[cat] || cat;
    const color = CATEGORY_COLORS[cat] || '#666';
    html += `<div class="category-header" style="background:${color}">${label} (${list.length})</div>`;
    html += '<div class="artist-grid">';
    for (const a of list) {
      html += `<div class="artist-card">`;
      if (a.image_url) {
        html += `<img src="${a.image_url}" alt="${esc(a.name)}" loading="lazy">`;
      } else {
        html += `<div class="no-img">👤</div>`;
      }
      html += `<div class="artist-info">`;
      html += `<h3>${esc(a.name)}</h3>`;
      if (a.bio) html += `<p class="bio">${esc(a.bio)}</p>`;
      if (a.website) html += `<p class="website"><a href="${esc(a.website)}" target="_blank">${esc(a.website)}</a></p>`;
      html += `<span class="badge" style="background:${color}">${label}</span>`;
      html += `</div></div>`;
    }
    html += '</div>';
  }

  // ─── PROGRAMMA ───
  html += '<hr class="separator">';
  html += `<h2>Programma · ${esc(dateLabel)}</h2>`;

  // Group events by category
  const evByCategory = {};
  events.forEach(e => {
    const cat = e.category || 'altro';
    if (!evByCategory[cat]) evByCategory[cat] = [];
    evByCategory[cat].push(e);
  });

  // First show the full timeline
  html += '<h3 style="margin-bottom:0.6rem; color:var(--navy)">Timeline completa</h3>';
  html += '<div class="event-list">';
  for (const ev of events) {
    const color = CATEGORY_COLORS[ev.category] || '#666';
    const label = CATEGORY_LABELS[ev.category] || ev.category;
    const artistNames = (ev.artist_ids || [])
      .map(id => artistMap[id]?.name)
      .filter(Boolean)
      .join(', ');

    html += `<div class="event-card">`;
    html += `<div class="event-stripe" style="background:${color}"></div>`;
    html += `<div class="event-content">`;
    html += `<div class="event-header">`;
    html += `<h3>${esc(ev.title)}</h3>`;
    html += `<span class="badge" style="background:${color}">${label}</span>`;
    html += `</div>`;

    const timeParts = [];
    if (ev.start_time) {
      let t = ev.start_time;
      if (ev.end_time) t += ` — ${ev.end_time}`;
      timeParts.push(`🕐 ${t}`);
    }
    if (ev.location) timeParts.push(`📍 ${esc(ev.location)}`);
    if (timeParts.length) html += `<div class="event-time">${timeParts.join(' &nbsp;|&nbsp; ')}</div>`;

    if (artistNames) html += `<div class="event-artists">👤 ${esc(artistNames)}</div>`;
    if (ev.description) html += `<div class="event-desc">${esc(ev.description)}</div>`;
    html += `</div></div>`;
  }
  html += '</div>';

  // Then by category
  html += '<h3 style="margin:1.5rem 0 0.6rem; color:var(--navy)">Per categoria</h3>';
  for (const [cat, list] of Object.entries(evByCategory)) {
    const label = CATEGORY_LABELS[cat] || cat;
    const color = CATEGORY_COLORS[cat] || '#666';
    html += `<div class="category-header" style="background:${color}">${label} (${list.length} eventi)</div>`;
    html += '<div class="event-list" style="margin-bottom:1rem">';
    for (const ev of list) {
      const artistNames = (ev.artist_ids || [])
        .map(id => artistMap[id]?.name)
        .filter(Boolean)
        .join(', ');

      html += `<div class="event-card">`;
      html += `<div class="event-stripe" style="background:${color}"></div>`;
      html += `<div class="event-content">`;
      html += `<h3>${esc(ev.title)}</h3>`;
      const timeParts = [];
      if (ev.start_time) {
        let t = ev.start_time;
        if (ev.end_time) t += ` — ${ev.end_time}`;
        timeParts.push(`🕐 ${t}`);
      }
      if (ev.location) timeParts.push(`📍 ${esc(ev.location)}`);
      if (timeParts.length) html += `<div class="event-time">${timeParts.join(' &nbsp;|&nbsp; ')}</div>`;
      if (artistNames) html += `<div class="event-artists">👤 ${esc(artistNames)}</div>`;
      if (ev.description) html += `<div class="event-desc">${esc(ev.description)}</div>`;
      html += `</div></div>`;
    }
    html += '</div>';
  }

  // ─── SCHEDE DATI LEGGIBILI (per Claude) ───
  html += '<hr class="separator">';
  html += '<h2>Schede complete (per uso AI)</h2>';
  html += '<p style="font-size:0.85rem;color:var(--ink-muted);margin-bottom:1rem">Tutti i dati dell\'evento in formato leggibile. Dai questa pagina a Claude per creare grafiche.</p>';

  // Info evento
  html += '<div class="data-block">';
  html += '<div class="data-block-title">EVENTO</div>';
  html += '<div class="data-row"><span class="data-label">Nome</span><span class="data-value">COINCIDENZE</span></div>';
  html += '<div class="data-row"><span class="data-label">Sottotitolo</span><span class="data-value">raffinate casualità, occhi attenti</span></div>';
  html += `<div class="data-row"><span class="data-label">Edizione</span><span class="data-value">${esc(edition.name)}</span></div>`;
  html += `<div class="data-row"><span class="data-label">Data</span><span class="data-value">${esc(dateLabel)}</span></div>`;
  html += `<div class="data-row"><span class="data-label">Luogo</span><span class="data-value">${esc(edition.hero_location)}</span></div>`;
  html += '</div>';

  // Schede artisti
  html += '<div class="data-block-title" style="margin-top:1.5rem">ARTISTI (' + artists.length + ')</div>';
  for (const a of artists) {
    const cat = a.category || '';
    const label = CATEGORY_LABELS[cat] || cat;
    const color = CATEGORY_COLORS[cat] || '#666';
    html += '<div class="data-block">';
    html += `<div class="data-block-header" style="border-left:4px solid ${color}; padding-left:0.8rem">`;
    html += `<strong>${esc(a.name)}</strong> <span class="badge" style="background:${color}; vertical-align:middle">${label}</span>`;
    html += '</div>';
    if (a.bio) html += `<div class="data-row"><span class="data-label">Bio</span><span class="data-value">${esc(a.bio)}</span></div>`;
    if (a.website) html += `<div class="data-row"><span class="data-label">Sito</span><span class="data-value"><a href="${esc(a.website)}" target="_blank" style="color:var(--viola)">${esc(a.website)}</a></span></div>`;
    if (a.image_url) html += `<div class="data-row"><span class="data-label">Immagine</span><span class="data-value"><a href="${esc(a.image_url)}" target="_blank" style="color:var(--viola)">Vedi immagine</a></span></div>`;
    html += '</div>';
  }

  // Schede programma
  html += '<div class="data-block-title" style="margin-top:1.5rem">PROGRAMMA (' + events.length + ' eventi)</div>';
  for (const ev of events) {
    const cat = ev.category || '';
    const label = CATEGORY_LABELS[cat] || cat;
    const color = CATEGORY_COLORS[cat] || '#666';
    const artistNames = (ev.artist_ids || []).map(id => artistMap[id]?.name).filter(Boolean).join(', ');

    html += '<div class="data-block">';
    html += `<div class="data-block-header" style="border-left:4px solid ${color}; padding-left:0.8rem">`;
    html += `<strong>${esc(ev.title)}</strong> <span class="badge" style="background:${color}; vertical-align:middle">${label}</span>`;
    html += '</div>';
    if (ev.start_time) {
      let orario = ev.start_time;
      if (ev.end_time) orario += ' — ' + ev.end_time;
      html += `<div class="data-row"><span class="data-label">Orario</span><span class="data-value">${esc(orario)}</span></div>`;
    }
    if (ev.location) html += `<div class="data-row"><span class="data-label">Luogo</span><span class="data-value">${esc(ev.location)}</span></div>`;
    if (artistNames) html += `<div class="data-row"><span class="data-label">Artisti</span><span class="data-value">${esc(artistNames)}</span></div>`;
    if (ev.description) html += `<div class="data-row"><span class="data-label">Descrizione</span><span class="data-value">${esc(ev.description)}</span></div>`;
    html += '</div>';
  }

  // JSON nascosto per copia veloce
  html += '<details style="margin-top:2rem"><summary style="cursor:pointer;font-size:0.85rem;color:var(--ink-muted)">Mostra JSON grezzo</summary>';
  html += '<pre style="background:white;padding:1rem;border-radius:8px;overflow-x:auto;font-size:0.75rem;margin-top:0.5rem;white-space:pre-wrap">';
  const exportData = {
    evento: { nome: 'COINCIDENZE', sottotitolo: 'raffinate casualità, occhi attenti', edizione: edition.name, data: dateLabel, luogo: edition.hero_location },
    artisti: artists.map(a => ({ nome: a.name, categoria: CATEGORY_LABELS[a.category] || a.category, bio: a.bio || null, sito: a.website || null, immagine: a.image_url || null })),
    programma: events.map(e => ({ titolo: e.title, categoria: CATEGORY_LABELS[e.category] || e.category, orario_inizio: e.start_time || null, orario_fine: e.end_time || null, luogo: e.location || null, artisti: (e.artist_ids || []).map(id => artistMap[id]?.name).filter(Boolean), descrizione: e.description || null }))
  };
  html += esc(JSON.stringify(exportData, null, 2));
  html += '</pre></details>';

  document.getElementById('content').innerHTML = html;
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadData();
