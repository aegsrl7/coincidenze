import { useRef, useState } from 'react'
import { Upload, X, Loader2, ClipboardPaste } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { api } from '@/lib/api'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  placeholder?: string
  label?: string
  disabled?: boolean
}

export function ImageUpload({ value, onChange, placeholder, label, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const { url } = await api.uploadFile(file)
      onChange(url)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) await uploadFile(file)
        return
      }
    }
  }

  const isImage = value && /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(value)

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-medium text-ink-muted">{label}</label>}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={placeholder || 'URL, carica o incolla immagine'}
          disabled={disabled || uploading}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          title="Carica file"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => onChange('')}
            title="Rimuovi"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,audio/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {isImage && value && (
        <img
          src={value}
          alt="Preview"
          className="h-24 w-auto rounded-md border border-navy/10 object-cover"
        />
      )}
    </div>
  )
}
