import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Loader2, Check, X, Trash2, Pencil, Star, Lock, Unlock, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useEditionsStore } from '@/stores/editionsStore'
import { api } from '@/lib/api'
import type { Edition } from '@/types'

export function AdminEdizioniPage() {
  const editions = useEditionsStore((s) => s.editions)
  const fetchEditions = useEditionsStore((s) => s.fetch)
  const refresh = useEditionsStore((s) => s.refresh)

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Edition | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Edition | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => { fetchEditions() }, [fetchEditions])

  const handleSetCurrent = async (ed: Edition) => {
    if (ed.is_current === 1) return
    setBusyId(ed.id)
    try {
      await api.setCurrentEdition(ed.id)
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  const handleToggle = async (ed: Edition, field: 'accrediti_open' | 'spuntino_open') => {
    setBusyId(ed.id)
    try {
      await api.updateEdition(ed.id, { [field]: ed[field] === 1 ? 0 : 1 })
      await refresh()
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteEdition(deleteTarget.id)
      await refresh()
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Edizioni</h1>
          <p className="text-sm text-ink-muted">Gestisci tutte le edizioni dell'evento, da qui crei la prossima senza toccare il codice.</p>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Nuova edizione
          </Button>
        </div>
      </div>

      {editions.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-navy/15 bg-white/30">
          <p className="text-sm text-ink-muted italic">Nessuna edizione configurata. Aggiungine una.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {editions.map((ed) => (
            <EditionCard
              key={ed.id}
              edition={ed}
              busy={busyId === ed.id}
              onSetCurrent={() => handleSetCurrent(ed)}
              onToggle={(f) => handleToggle(ed, f)}
              onEdit={() => setEditing(ed)}
              onDelete={() => setDeleteTarget(ed)}
            />
          ))}
        </div>
      )}

      {(creating || editing) && (
        <EditionFormDialog
          edition={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={async () => { setCreating(false); setEditing(null); await refresh() }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Elimina edizione"
        message={deleteTarget ? `Eliminare ${deleteTarget.name}? Galleria e contenuti vengono cancellati. Eventi/accrediti restano nel DB ma senza link.` : ''}
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}

function EditionCard({
  edition, busy, onSetCurrent, onToggle, onEdit, onDelete,
}: {
  edition: Edition
  busy: boolean
  onSetCurrent: () => void
  onToggle: (field: 'accrediti_open' | 'spuntino_open') => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-white/60 rounded-xl border border-navy/10 p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="font-display text-lg font-semibold text-navy">{edition.name}</h3>
            <span className="text-sm text-ink-muted">{edition.year}</span>
            {edition.is_current === 1 && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-viola bg-viola/10 px-2 py-0.5 rounded-full">
                <Star className="h-3 w-3" />
                Corrente
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted mt-0.5 font-mono">/{edition.slug}</p>
          <p className="text-sm text-ink-light mt-1">{edition.event_date} · {edition.hero_location}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            <FlagToggle
              label="Accrediti"
              open={edition.accrediti_open === 1}
              onClick={() => onToggle('accrediti_open')}
              disabled={busy}
            />
            <FlagToggle
              label="Spuntino"
              open={edition.spuntino_open === 1}
              onClick={() => onToggle('spuntino_open')}
              disabled={busy}
            />
            <a
              href={`/${edition.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-navy/15 text-navy hover:bg-navy/5 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Apri pubblico
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          {edition.is_current !== 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSetCurrent}
              disabled={busy}
              className="text-viola border-viola/30 hover:bg-viola/10"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
              Rendi corrente
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Modifica
          </Button>
          {edition.is_current !== 1 && (
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-bordeaux hover:text-bordeaux hover:bg-bordeaux/10">
              <Trash2 className="h-3.5 w-3.5" />
              Elimina
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function FlagToggle({ label, open, onClick, disabled }: { label: string; open: boolean; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors disabled:opacity-50 ${
        open
          ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
          : 'bg-bordeaux/10 border-bordeaux/30 text-bordeaux hover:bg-bordeaux/20'
      }`}
      title={open ? `${label} aperti — clicca per chiudere` : `${label} chiusi — clicca per aprire`}
    >
      {open ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {label}: {open ? 'aperti' : 'chiusi'}
    </button>
  )
}

function EditionFormDialog({
  edition, onClose, onSaved,
}: {
  edition: Edition | null
  onClose: () => void
  onSaved: () => Promise<void> | void
}) {
  const isEdit = !!edition
  const [slug, setSlug] = useState(edition?.slug || '')
  const [name, setName] = useState(edition?.name || '')
  const [year, setYear] = useState<number>(edition?.year || new Date().getFullYear() + 1)
  const [eventDate, setEventDate] = useState(edition?.event_date || '')
  const [heroSubtitle, setHeroSubtitle] = useState(edition?.hero_subtitle || '')
  const [heroLocation, setHeroLocation] = useState(edition?.hero_location || 'Marsam Locanda · Bene Vagienna')
  const [heroImage, setHeroImage] = useState(edition?.hero_image_url || '')
  const [intro, setIntro] = useState(edition?.intro || '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Auto-genera slug e nome dall'anno se nuovo
  useEffect(() => {
    if (isEdit) return
    if (!slug) {
      // calcola il prossimo numero in base all'anno (best effort: edizione = year - 2025)
      const num = Math.max(0, year - 2025)
      setSlug(`edizione-${num}`)
    }
    if (!name) setName(`Edizione ${Math.max(0, year - 2025)}`)
    if (!eventDate) setEventDate(`${year}-04-25`)
    if (!heroSubtitle) setHeroSubtitle('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const { url } = await api.uploadFile(file)
      setHeroImage(url)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        slug,
        name,
        year,
        event_date: eventDate,
        hero_subtitle: heroSubtitle,
        hero_location: heroLocation,
        hero_image_url: heroImage,
        intro,
      }
      if (isEdit && edition) {
        await api.updateEdition(edition.id, payload)
      } else {
        await api.createEdition(payload)
      }
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore salvataggio')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 flex items-center justify-center p-4">
      <div className="bg-crema rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-navy">
              {isEdit ? `Modifica ${edition?.name}` : 'Nuova edizione'}
            </h2>
            <button type="button" onClick={onClose} className="text-ink-muted hover:text-navy p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-navy uppercase tracking-wider">Anno</label>
              <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10) || 0)} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-navy uppercase tracking-wider">Data evento</label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-navy uppercase tracking-wider">Slug URL</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="edizione-2" required />
            <p className="text-[11px] text-ink-muted mt-1">URL pubblico: <span className="font-mono">/{slug || 'edizione-?'}</span></p>
          </div>

          <div>
            <label className="text-xs font-semibold text-navy uppercase tracking-wider">Nome visualizzato</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Edizione 2" required />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy uppercase tracking-wider">Sottotitolo hero</label>
            <Input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Es. Sabato 24 aprile 2027 (lascia vuoto per usare data evento)" />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy uppercase tracking-wider">Location</label>
            <Input value={heroLocation} onChange={(e) => setHeroLocation(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy uppercase tracking-wider">Immagine hero</label>
            {heroImage ? (
              <div className="mt-1 flex items-center gap-3">
                <img src={heroImage} alt="hero" className="h-16 w-28 object-cover rounded border border-navy/10" />
                <Button type="button" size="sm" variant="ghost" onClick={() => setHeroImage('')}>
                  <X className="h-3.5 w-3.5" /> Rimuovi
                </Button>
              </div>
            ) : (
              <label className="mt-1 inline-flex items-center gap-2 cursor-pointer text-sm text-ink-light hover:text-navy">
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
                {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                {uploadingImage ? 'Caricamento...' : 'Carica foto (vuoto = default)'}
              </label>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-navy uppercase tracking-wider">Intro</label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={4}
              placeholder="Testo introduttivo / retrospettivo dell'edizione..."
              className="w-full rounded-md border border-navy/20 bg-white p-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-viola/40 resize-y"
            />
          </div>

          {error && <p className="text-sm text-bordeaux">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Annulla</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isEdit ? 'Salva' : 'Crea edizione'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
