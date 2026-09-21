import { useState, type DragEvent } from 'react'
import type { ImageItem } from '../editor/types'
import { useI18n } from '../i18n/I18nProvider'

interface ImageListProps {
  images: ImageItem[]
  onMove: (from: number, to: number) => void
  onRemove: (id: string) => void
  onClear: () => void
  onAnchor: () => void
  canAnchor: boolean
  isAnchoring: boolean
  disabled: boolean
}

export function ImageList({
  images,
  onMove,
  onRemove,
  onClear,
  onAnchor,
  canAnchor,
  isAnchoring,
  disabled,
}: ImageListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const { t, formatNumber } = useI18n()

  const handleDrop = (event: DragEvent, targetIndex: number) => {
    event.preventDefault()
    if (dragIndex !== null) onMove(dragIndex, targetIndex)
    setDragIndex(null)
  }

  return (
    <section className="panel-section image-section" aria-labelledby="images-heading">
      <div className="section-heading-row">
        <div>
          <span className="section-kicker">{t('images.kicker')}</span>
          <span className="title-with-count">
            <h2 id="images-heading">{t('images.title')}</h2>
            <span className="image-count">{formatNumber(images.length)}</span>
          </span>
        </div>
        <button className="text-button" type="button" onClick={onClear} disabled={disabled}>
          {t('images.clear')}
        </button>
      </div>

      <div className="image-list">
        {images.map((image, index) => {
          const displayName = image.kind === 'anchor'
            ? t('anchor.name', { number: image.anchorNumber ?? 1 })
            : image.name
          return (
            <article
            className={`image-row${dragIndex === index ? ' is-dragging' : ''}`}
            key={image.id}
            draggable={!disabled}
            onDragStart={(event) => {
              if (disabled) return
              setDragIndex(index)
              event.dataTransfer.effectAllowed = 'move'
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, index)}
            onDragEnd={() => setDragIndex(null)}
          >
            <span className="drag-handle" aria-hidden="true">
              <svg viewBox="0 0 16 20"><path d="M5 5h.01M11 5h.01M5 10h.01M11 10h.01M5 15h.01M11 15h.01" /></svg>
            </span>
            <img src={image.previewUrl} alt="" />
            <div className="image-meta">
              <span className="image-name-line">
                <strong title={displayName}>{displayName}</strong>
                {image.kind === 'anchor' && <small>{t('images.anchoredBadge')}</small>}
              </span>
              <span>{formatNumber(image.width)} × {formatNumber(image.height)}</span>
            </div>
            <div className="row-actions">
              <button
                type="button"
                aria-label={t('images.moveUp', { name: displayName })}
                title={t('images.moveUpTitle')}
                disabled={disabled || index === 0}
                onClick={() => onMove(index, index - 1)}
              >
                <ArrowIcon direction="up" />
              </button>
              <button
                type="button"
                aria-label={t('images.moveDown', { name: displayName })}
                title={t('images.moveDownTitle')}
                disabled={disabled || index === images.length - 1}
                onClick={() => onMove(index, index + 1)}
              >
                <ArrowIcon direction="down" />
              </button>
              <button
                type="button"
                aria-label={t('images.remove', { name: displayName })}
                title={t('images.removeTitle')}
                disabled={disabled}
                onClick={() => onRemove(image.id)}
              >
                <TrashIcon />
              </button>
            </div>
            </article>
          )
        })}
      </div>

      <div className="anchor-action">
        <p>{t('anchor.description')}</p>
        <button
          className="button button-anchor"
          type="button"
          onClick={onAnchor}
          disabled={!canAnchor || disabled}
        >
          <AnchorIcon />
          {isAnchoring ? t('anchor.anchoring') : t('anchor.action')}
        </button>
      </div>
    </section>
  )
}

function AnchorIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3v11M6.5 7h7M5 13.5C6.1 16 7.8 17 10 17s3.9-1 5-3.5M4 13.5h3M13 13.5h3" />
      <circle cx="10" cy="3" r="1.5" />
    </svg>
  )
}

function ArrowIcon({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg className={direction === 'down' ? 'rotate-icon' : ''} viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5.5 12.5 4.5-5 4.5 5" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4.5 6h11M8 3.5h4M6.5 6l.6 10h5.8l.6-10M8.5 9v4.5M11.5 9v4.5" />
    </svg>
  )
}
