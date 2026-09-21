import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useI18n } from '../i18n/I18nProvider'

interface UploadAreaProps {
  onFiles: (files: File[]) => void
  compact?: boolean
  disabled?: boolean
}

export function UploadArea({ onFiles, compact = false, disabled = false }: UploadAreaProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const receiveFiles = (files: FileList | null) => {
    if (!files?.length) return
    onFiles(Array.from(files))
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    receiveFiles(event.target.files)
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    if (!disabled) receiveFiles(event.dataTransfer.files)
  }

  if (compact) {
    return (
      <>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <PlusIcon />
          {t('upload.add')}
        </button>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleChange}
        />
      </>
    )
  }

  return (
    <button
      type="button"
      className={`upload-area${dragging ? ' is-dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => {
        event.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      disabled={disabled}
    >
      <span className="upload-mark" aria-hidden="true">
        <ImageIcon />
      </span>
      <span className="upload-title">{t('upload.title')}</span>
      <span className="upload-description">{t('upload.description')}</span>
      <span className="upload-formats">{t('upload.formats')}</span>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleChange}
        tabIndex={-1}
      />
    </button>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4v12M4 10h12" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="5" y="6" width="22" height="20" rx="2" />
      <circle cx="12" cy="13" r="2.2" />
      <path d="m7 23 6.5-6.5 4 4 2.5-2.5 5 5" />
    </svg>
  )
}
