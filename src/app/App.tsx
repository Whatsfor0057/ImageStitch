import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { ImageList } from '../components/ImageList'
import { LanguageSelector } from '../components/LanguageSelector'
import { Preview } from '../components/Preview'
import { StitchSettings } from '../components/StitchSettings'
import { UploadArea } from '../components/UploadArea'
import { LIMITS } from '../config/limits'
import { historyReducer, initialHistoryState, type EditorAction } from '../editor/reducer'
import type { ExportFormat, StitchDirection } from '../editor/types'
import { exportStitch } from '../engine/export'
import { calculateLayout } from '../engine/layout'
import { ImageResourceStore } from '../images/resources'
import { translateError } from '../i18n/errors'
import { useI18n } from '../i18n/I18nProvider'

export function App() {
  const { t, formatNumber } = useI18n()
  const [history, dispatchHistory] = useReducer(historyReducer, initialHistoryState)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isAnchoring, setIsAnchoring] = useState(false)
  const [notice, setNotice] = useState('')
  const anchorSequenceRef = useRef(1)
  const storeRef = useRef<ImageResourceStore | null>(null)
  if (!storeRef.current) storeRef.current = new ImageResourceStore()
  const store = storeRef.current
  const state = history.present
  const isBusy = isLoading || isExporting || isAnchoring
  const canUndo = history.past.length > 0

  const applyAction = useCallback((action: EditorAction, mergeKey?: string) => {
    dispatchHistory({ type: 'history/apply', action, mergeKey })
  }, [])

  const undo = useCallback(() => {
    if (!isBusy && canUndo) {
      dispatchHistory({ type: 'history/undo' })
      setNotice('')
    }
  }, [canUndo, isBusy])

  const layout = useMemo(
    () => calculateLayout(state.images, state.settings),
    [state.images, state.settings],
  )

  const outputIssue = useMemo(() => {
    if (!layout.width || !layout.height) return ''
    if (layout.width > LIMITS.maxCanvasEdge || layout.height > LIMITS.maxCanvasEdge) {
      return t('error.outputEdge', { max: formatNumber(LIMITS.maxCanvasEdge) })
    }
    if (layout.width * layout.height > LIMITS.maxOutputPixels) {
      return t('error.outputPixels')
    }
    return ''
  }, [layout, t, formatNumber])

  useEffect(() => {
    const referencedIds = new Set<string>()
    for (const snapshot of [...history.past, history.present]) {
      for (const image of snapshot.images) referencedIds.add(image.id)
    }
    store.prune(referencedIds)
  }, [history.past, history.present, store])

  useEffect(() => () => store.clear(), [store])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z' || event.shiftKey) return
      const target = event.target
      if (target instanceof HTMLElement) {
        const input = target instanceof HTMLInputElement ? target : null
        const nativeInputTypes = new Set(['text', 'number', 'search', 'email', 'url', 'tel', 'password'])
        if (target.isContentEditable || target instanceof HTMLTextAreaElement || (input && nativeInputTypes.has(input.type))) {
          return
        }
      }
      if (!isBusy && canUndo) {
        event.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, isBusy, undo])

  const addFiles = async (files: File[]) => {
    setIsLoading(true)
    setNotice('')
    const loaded = []
    const errors: string[] = []
    const usage = store.getUsage()
    let totalBytes = usage.bytes
    let totalPixels = usage.pixels

    for (const file of files) {
      if (totalBytes + file.size > LIMITS.maxTotalBytes) {
        errors.push(t('error.totalSize', {
          name: file.name,
          max: Math.round(LIMITS.maxTotalBytes / 1024 / 1024),
        }))
        continue
      }
      try {
        const image = await store.add(file)
        const pixels = image.width * image.height
        if (totalPixels + pixels > LIMITS.maxInputPixels) {
          store.remove(image.id)
          errors.push(t('error.totalPixels', { name: file.name }))
          continue
        }
        loaded.push(image)
        totalBytes += image.bytes
        totalPixels += pixels
      } catch (error) {
        errors.push(translateError(error, t, 'error.loadFailed').replace('{name}', file.name))
      }
    }

    if (loaded.length) applyAction({ type: 'images/add', images: loaded })
    if (errors.length) setNotice(errors.join(' '))
    setIsLoading(false)
  }

  const removeImage = (id: string) => {
    applyAction({ type: 'images/remove', id })
  }

  const clearImages = () => {
    applyAction({ type: 'images/clear' })
    setNotice('')
  }

  const handleAnchor = async () => {
    if (state.images.length < 2 || outputIssue || isBusy) return
    setIsAnchoring(true)
    setNotice('')
    let anchorId: string | null = null
    try {
      const blob = await exportStitch({
        layout,
        settings: { ...state.settings, format: 'png' },
        getSource: store.getSource,
      })
      const usage = store.getUsage()
      const anchorPixels = layout.width * layout.height
      if (
        usage.bytes + blob.size > LIMITS.maxTotalBytes
        || usage.pixels + anchorPixels > LIMITS.maxInputPixels
      ) {
        setNotice(t('anchor.capacityError'))
        return
      }

      const anchorNumber = anchorSequenceRef.current
      const anchoredImage = await store.addAnchor(blob, anchorNumber)
      anchorId = anchoredImage.id
      anchorSequenceRef.current += 1
      applyAction({
        type: 'images/anchor',
        image: anchoredImage,
        settings: {
          ...state.settings,
          gap: 0,
          padding: 0,
          outputSize: state.settings.direction === 'vertical' ? layout.width : layout.height,
        },
      })
    } catch (error) {
      if (anchorId) store.remove(anchorId)
      setNotice(translateError(error, t, 'anchor.failed'))
    } finally {
      setIsAnchoring(false)
    }
  }

  const handleExport = async () => {
    if (!state.images.length || outputIssue) return
    setIsExporting(true)
    setNotice('')
    try {
      const blob = await exportStitch({
        layout,
        settings: state.settings,
        getSource: store.getSource,
      })
      const now = new Date()
      const stamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        '-',
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
      ].join('')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `imagestitch-${stamp}.${state.settings.format === 'png' ? 'png' : 'jpg'}`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      setNotice(translateError(error, t, 'error.exportFailed'))
    } finally {
      setIsExporting(false)
    }
  }

  const hasImages = state.images.length > 0

  return (
    <div className="app-shell">
      <Analytics />
      <header className="topbar-shell">
        <div className="topbar">
          <a className="brand" href="/" aria-label={t('app.homeLabel')}>
            <span className="brand-mark"><BrandMark /></span>
            <span>ImageStitch</span>
          </a>
          <div className="topbar-meta"><span />{t('app.localOnly')}</div>
          <div className="topbar-actions">
            <LanguageSelector />
            <button
              className="button button-secondary button-undo"
              type="button"
              onClick={undo}
              disabled={!canUndo || isBusy}
              aria-label={t('undo.label')}
              title={`${t('undo.label')} (Ctrl+Z)`}
            >
              <UndoIcon />
              <span>{t('undo.label')}</span>
            </button>
            {hasImages && (
              <>
                <UploadArea compact onFiles={addFiles} disabled={isBusy} />
                <button
                  className="button button-primary"
                  type="button"
                  onClick={handleExport}
                  disabled={Boolean(outputIssue) || isBusy}
                >
                  <span>{isExporting ? t('export.exporting') : t('export.download')}</span>
                  <span className="button-icon"><DownloadIcon /></span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {!hasImages ? (
        <main className="empty-page">
          <section className="empty-workspace" aria-labelledby="page-title">
            <div className="intro-copy">
              <span className="eyebrow">{t('app.tagline')}</span>
              <h1 id="page-title">{t('app.heroLine1')}<br />{t('app.heroLine2')}</h1>
              <p>{t('app.description')}</p>
            </div>
            <UploadArea onFiles={addFiles} disabled={isBusy} />
            {isLoading && <p className="loading-note">{t('upload.reading')}</p>}
            {notice && <p className="notice" role="alert">{notice}</p>}
          </section>
          <SeoContent />
        </main>
      ) : (
        <main className="editor-workspace">
          <aside className="side-shell asset-shell">
            <div className="side-panel">
              <ImageList
                images={state.images}
                onMove={(from, to) => applyAction({ type: 'images/move', from, to })}
                onRemove={removeImage}
                onClear={clearImages}
                onAnchor={handleAnchor}
                canAnchor={state.images.length >= 2 && !outputIssue}
                isAnchoring={isAnchoring}
                disabled={isBusy}
              />
            </div>
          </aside>
          <aside className="side-shell settings-shell">
            <div className="side-panel">
              <StitchSettings
                settings={state.settings}
                disabled={isBusy}
                onDirection={(value: StitchDirection) => applyAction({ type: 'settings/direction', value })}
                onNumber={(key, value) => applyAction(
                  { type: 'settings/number', key, value },
                  `settings:${key}`,
                )}
                onBackground={(value) => applyAction(
                  { type: 'settings/background', value },
                  'settings:background',
                )}
                onTransparent={(value) => applyAction({ type: 'settings/transparent', value })}
                onFormat={(value: ExportFormat) => applyAction({ type: 'settings/format', value })}
              />
            </div>
          </aside>
          <div className="preview-column">
            <Preview layout={layout} settings={state.settings} getSource={store.getSource} />
            {(notice || outputIssue || isLoading || isAnchoring) && (
              <div className={`status-line${outputIssue ? ' is-error' : ''}`} role="status">
                {isLoading
                  ? t('upload.reading')
                  : isAnchoring
                    ? t('anchor.anchoring')
                    : outputIssue || notice}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  )
}

function SeoContent() {
  const { t } = useI18n()
  return (
    <section className="seo-content" aria-labelledby="seo-title">
      <div className="seo-heading">
        <span className="section-kicker">{t('seo.kicker')}</span>
        <h2 id="seo-title">{t('seo.title')}</h2>
        <p>{t('seo.intro')}</p>
      </div>
      <div className="seo-features">
        <article>
          <span>01</span>
          <h3>{t('seo.layoutTitle')}</h3>
          <p>{t('seo.layoutBody')}</p>
        </article>
        <article>
          <span>02</span>
          <h3>{t('seo.formatTitle')}</h3>
          <p>{t('seo.formatBody')}</p>
        </article>
        <article>
          <span>03</span>
          <h3>{t('seo.privacyTitle')}</h3>
          <p>{t('seo.privacyBody')}</p>
        </article>
      </div>
      <div className="seo-faq">
        <h2>{t('seo.faqTitle')}</h2>
        <details>
          <summary>{t('seo.faqUploadQ')}</summary>
          <p>{t('seo.faqUploadA')}</p>
        </details>
        <details>
          <summary>{t('seo.faqFormatQ')}</summary>
          <p>{t('seo.faqFormatA')}</p>
        </details>
      </div>
    </section>
  )
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m7 6-3 3 3 3" />
      <path d="M5 9h6.5a4 4 0 0 1 0 8H9" />
    </svg>
  )
}

function BrandMark() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <rect x="4" y="3" width="15" height="15" rx="2" />
      <rect x="9" y="10" width="15" height="15" rx="2" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3v9M6.5 9l3.5 3.5L13.5 9M4 16h12" />
    </svg>
  )
}
