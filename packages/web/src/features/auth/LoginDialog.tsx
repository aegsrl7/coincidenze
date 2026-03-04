import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/authStore'

interface LoginDialogProps {
  open: boolean
  onClose: () => void
}

export function LoginDialog({ open, onClose }: LoginDialogProps) {
  const { login } = useAuthStore()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const success = await login(password)
    setLoading(false)

    if (success) {
      setPassword('')
      onClose()
    } else {
      setError('Password errata')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-navy">
            <Lock className="h-5 w-5" />
            Accesso Admin
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="mt-1.5 text-sm text-bordeaux">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading || !password}>
              {loading ? 'Accesso...' : 'Accedi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
