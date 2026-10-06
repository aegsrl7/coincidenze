/**
 * Catalogo dei permessi dell'area riservata. È l'unica fonte: l'API lo usa per
 * i controlli e lo espone a /api/roles/catalog per la matrice della pagina Ruoli.
 */
export const PERMISSION_AREAS = [
  { key: 'programma', label: 'Programma', actions: ['view', 'edit', 'delete'] },
  { key: 'artisti', label: 'Artisti', actions: ['view', 'edit', 'delete'] },
  { key: 'media', label: 'Media', actions: ['view', 'edit', 'delete'] },
  { key: 'editoriale', label: 'Piano editoriale', actions: ['view', 'edit', 'delete'] },
  { key: 'accrediti', label: 'Accrediti', actions: ['view', 'checkin', 'delete'] },
  { key: 'spuntino', label: 'Spuntino', actions: ['view', 'edit', 'delete'] },
  { key: 'menu', label: 'Menù', actions: ['edit'] },
  { key: 'categorie', label: 'Categorie', actions: ['edit'] },
  { key: 'team', label: 'Team e task', actions: ['view', 'edit'] },
  { key: 'edizioni', label: 'Edizioni e pagine pubbliche', actions: ['edit'] },
  { key: 'riunioni', label: 'Riunioni', actions: ['view', 'edit'] },
  { key: 'note', label: 'Note interne', actions: ['view'] },
  { key: 'utenti', label: 'Utenti e ruoli', actions: ['manage'] },
] as const

export const ACTION_LABELS: Record<string, string> = {
  view: 'Vede',
  edit: 'Modifica',
  delete: 'Elimina',
  checkin: 'Scanner',
  manage: 'Gestisce',
}

/** Spiegazioni mostrate nella matrice per i permessi meno ovvi. */
export const PERMISSION_HINTS: Record<string, string> = {
  'accrediti.view': 'Lista degli iscritti con email, telefono e consensi',
  'accrediti.checkin': 'Scanner dei biglietti all\'ingresso e annullamento del check-in',
  'spuntino.edit': 'Modifica delle prenotazioni e apertura o chiusura del modulo',
  'menu.edit': 'Voci del menù dell\'edizione',
  'categorie.edit': 'Categorie di artisti e menù',
  'edizioni.edit': 'Impostazioni delle edizioni, apertura accrediti, testi e galleria delle pagine pubbliche',
  'note.view': 'Legge e scrive le note interne di artisti, eventi e media',
  'riunioni.view': 'Verbali, punti chiave e trascrizioni delle riunioni organizzative',
  'utenti.manage': 'Invita utenti, assegna ruoli, modifica i permessi',
}

export const ALL_PERMISSIONS: string[] = PERMISSION_AREAS.flatMap((a) => a.actions.map((x) => `${a.key}.${x}`))

const VALID = new Set(ALL_PERMISSIONS)

/**
 * Tiene solo chiavi valide e aggiunge quelle implicite:
 * elimina implica modifica, e modifica o elimina implicano vede.
 * Lo scanner del check-in non implica la lista degli iscritti.
 */
export function normalizePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const set = new Set(input.filter((p): p is string => typeof p === 'string' && VALID.has(p)))
  for (const area of PERMISSION_AREAS) {
    const has = (a: string) => set.has(`${area.key}.${a}`)
    const actions = area.actions as readonly string[]
    if (actions.includes('edit') && has('delete')) set.add(`${area.key}.edit`)
    if (actions.includes('view') && (has('edit') || has('delete'))) set.add(`${area.key}.view`)
  }
  return ALL_PERMISSIONS.filter((p) => set.has(p))
}

/** Permessi effettivi di un ruolo: quello di sistema (Amministratore) li ha tutti. */
export function rolePermissions(role: { is_system: number; permissions: string }): string[] {
  if (role.is_system === 1) return ALL_PERMISSIONS
  try {
    return normalizePermissions(JSON.parse(role.permissions))
  } catch {
    return []
  }
}
