import { useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Trash2, Search, Download, Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { api } from '@/lib/api'
import type { SpuntinoBooking } from '@/types'

function fmtDateTime(iso: string | null): string {
  if (!iso) return '\u2014'
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z')
  return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toCsv(rows: SpuntinoBooking[]): string {
  const header = ['name', 'surname', 'email', 'phone', 'seats', 'notes', 'created_at']
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push([r.name, r.surname, r.email, r.phone, r.seats, r.notes, r.created_at].map(escape).join(','))
  }
  return lines.join('\n')
}

export function AdminSpuntinoPage() {
  const [items, setItems] = useState<SpuntinoBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<SpuntinoBooking | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState<boolean | null>(null)
  const [togglingStatus, setTogglingStatus] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [data, status] = await Promise.all([
        api.listSpuntinoBookings(),
        api.getSpuntinoStatus(),
      ])
      setItems(data as SpuntinoBooking[])
      setOpen(status.open)
    } finally {
      setLoading(false)
    }
  }

  const toggleOpen = async () => {
    if (open === null) return
    setTogglingStatus(true)
    try {
      const res = await api.setSpuntinoStatus(!open)
      setOpen(res.open)
    } finally {
      setTogglingStatus(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((b) =>
      [b.name, b.surname, b.email, b.phone].some((f) => f?.toLowerCase().includes(q))
    )
  }, [items, query])

  const totalSeats = items.reduce((s, b) => s + b.seats, 0)

  const handleExport = () => {
    const csv = toCsv(items)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spuntino-coincidenze-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteSpuntinoBooking(deleteTarget.id)
      setItems((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="font-display text-2xl font-semibold text-navy">Spuntino delle 18</h1>
        <div className="flex items-center gap-2 text-sm text-ink-light">
          <span className="font-medium text-navy">{items.length}</span>
          <span>prenotazioni</span>
          <span className="text-navy/30">·</span>
          <span className="font-medium text-viola">{totalSeats}</span>
          <span>posti</span>
          {open !== null && (
            <>
              <span className="text-navy/30">·</span>
              <span className={open ? 'text-green-700' : 'text-bordeaux font-medium'}>
                {open ? 'aperto' : 'chiuso'}
              </span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={open ? 'outline' : 'default'}
            size="sm"
            onClick={toggleOpen}
            disabled={togglingStatus || open === null}
            title={open ? 'Chiudi le prenotazioni' : 'Riapri le prenotazioni'}
            className={!open ? 'bg-bordeaux hover:bg-bordeaux/90' : ''}
          >
            {togglingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : open ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
            {open ? 'Chiudi' : 'Riapri'}
          </Button>
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
          placeholder="Cerca per nome, email, telefono…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && items.length === 0 ? (
        <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin text-navy/50 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-navy/15 bg-white/30">
          <p className="text-sm text-ink-muted italic">
            {items.length === 0 ? 'Nessuna prenotazione ancora.' : 'Nessun risultato per la ricerca.'}
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
                  <th className="text-center px-3 py-2 font-medium">Posti</th>
                  <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">Note</th>
                  <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Quando</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-t border-navy/5 hover:bg-navy/3">
                    <td className="px-3 py-2 font-medium text-navy whitespace-nowrap">{b.name} {b.surname}</td>
                    <td className="px-3 py-2 text-ink-light max-w-[180px] sm:max-w-none truncate">{b.email}</td>
                    <td className="px-3 py-2 text-ink-light hidden md:table-cell">{b.phone || '\u2014'}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-viola/10 text-viola text-xs font-semibold">
                        {b.seats}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-ink-light hidden lg:table-cell max-w-[260px] truncate" title={b.notes}>
                      {b.notes || '\u2014'}
                    </td>
                    <td className="px-3 py-2 text-ink-muted hidden sm:table-cell whitespace-nowrap">{fmtDateTime(b.created_at)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setDeleteTarget(b)}
                        className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-bordeaux/10 text-ink-muted hover:text-bordeaux"
                        title="Elimina prenotazione"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
        title="Elimina prenotazione"
        message={deleteTarget ? `Eliminare la prenotazione di ${deleteTarget.name} ${deleteTarget.surname} (${deleteTarget.seats} ${deleteTarget.seats === 1 ? 'posto' : 'posti'})?` : ''}
        confirmLabel="Elimina"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
