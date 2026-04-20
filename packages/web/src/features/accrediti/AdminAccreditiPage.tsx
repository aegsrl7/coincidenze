import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, CheckCircle2, Clock, Download, Trash2, ExternalLink, Loader2, RefreshCw, Mail, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { api } from '@/lib/api'
import type { Accreditation } from '@/types'

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z')
  return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toCsv(rows: Accreditation[]): string {
  const header = [
    'ticket_code', 'name', 'surname', 'email', 'phone', 'cap', 'birth_date',
    'consent_privacy', 'consent_newsletter', 'consent_photo',
    'created_at', 'checked_in_at',
  ]
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push([
      r.ticket_code, r.name, r.surname, r.email, r.phone, r.cap, r.birth_date,
      r.consent_privacy, r.consent_newsletter, r.consent_photo,
      r.created_at, r.checked_in_at ?? '',
    ].map(escape).join(','))
  }
  return lines.join('\n')
}

export function AdminAccreditiPage() {
  const [items, setItems] = useState<Accreditation[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Accreditation | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.listAccreditations()
      setItems(data as Accreditation[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((a) =>
      [a.name, a.surname, a.email, a.phone, a.ticket_code]
        .some((f) => f?.toLowerCase().includes(q))
    )
  }, [items, query])

  const totalCheckedIn = items.filter((a) => a.checked_in_at).length

  const handleExport = () => {
    const csv = toCsv(items)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `accrediti-coincidenze-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCheckIn = async (code: string) => {
    await api.checkInAccreditation(code)
    await load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteAccreditation(deleteTarget.id)
      setItems((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="font-display text-2xl font-semibold text-navy">Accrediti</h1>
        <div className="flex items-center gap-2 text-sm text-ink-light">
          <span className="font-medium text-navy">{items.length}</span>
          <span>iscritti</span>
          <span className="text-navy/30">·</span>
          <span className="font-medium text-green-700">{totalCheckedIn}</span>
          <span>check-in</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Ricarica
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={items.length === 0}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
        <Input
          placeholder="Cerca per nome, email, telefono, codice…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && items.length === 0 ? (
        <div className="py-20 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-navy/50 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-navy/15 bg-white/30">
          <p className="text-sm text-ink-muted italic">
            {items.length === 0 ? 'Nessun accredito registrato.' : 'Nessun risultato per la ricerca.'}
          </p>
        </div>
      ) : (
        <div className="bg-white/60 rounded-lg border border-navy/8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy/5 text-ink-light">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Nome</th>
                  <th className="text-left px-3 py-2 font-medium">Email</th>
                  <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Telefono</th>
                  <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Iscrizione</th>
                  <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Consensi</th>
                  <th className="text-left px-3 py-2 font-medium">Stato</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-t border-navy/5 hover:bg-navy/3">
                    <td className="px-3 py-2 font-medium text-navy whitespace-nowrap">
                      {a.name} {a.surname}
                    </td>
                    <td className="px-3 py-2 text-ink-light max-w-[180px] sm:max-w-none truncate">{a.email}</td>
                    <td className="px-3 py-2 text-ink-light hidden md:table-cell">{a.phone || '—'}</td>
                    <td className="px-3 py-2 text-ink-muted hidden sm:table-cell whitespace-nowrap">
                      {fmtDateTime(a.created_at)}
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          title={a.consent_newsletter ? 'Vuole ricevere la newsletter' : 'Niente newsletter'}
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${a.consent_newsletter ? 'bg-viola/15 text-viola' : 'bg-navy/5 text-ink-muted/50'}`}
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </span>
                        <span
                          title={a.consent_photo ? 'Acconsente ad apparire in foto/video' : 'Non vuole apparire in foto/video'}
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${a.consent_photo ? 'bg-viola/15 text-viola' : 'bg-navy/5 text-ink-muted/50'}`}
                        >
                          <Camera className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {a.checked_in_at ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Checked-in</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">In attesa</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        {!a.checked_in_at && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleCheckIn(a.ticket_code)}
                            title="Check-in"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline ml-1">Check-in</span>
                          </Button>
                        )}
                        <Link
                          to={`/biglietto/${a.ticket_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-navy/5 text-ink-muted hover:text-navy"
                          title="Apri biglietto"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-bordeaux/10 text-ink-muted hover:text-bordeaux"
                          title="Elimina"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Elimina accredito"
        message={deleteTarget ? `Vuoi eliminare l'accredito di ${deleteTarget.name} ${deleteTarget.surname}? L'operazione è irreversibile.` : ''}
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
