import { useEffect, useRef, useState } from 'react'
import { LIMITS } from '../config/limits'
import type { StitchLayout, StitchSettings } from '../editor/types'
import { renderLayout } from '../engine/render'
import { translateError } from '../i18n/errors'
import { useI18n } from '../i18n/I18nProvider'

interface PreviewProps {
  layout: StitchLayout
  settings: StitchSettings
  getSource: (id: string) => CanvasImageSource | undefined
}

export function Preview({ layout, settings, getSource }: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [renderError, setRenderError] = useState('')
  const { t, formatNumber } = useI18n()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !layout.width || !layout.height) return
    const edgeScale = LIMITS.maxPreviewEdge / Math.max(layout.width, layout.height)
    const pixelScale = Math.sqrt(LIMITS.maxPreviewPixels / (layout.width * layout.height))
    const scale = Math.min(1, edgeScale, pixelScale)
    try {
      renderLayout({ canvas, layout, settings, getSource, scale })
      setRenderError('')
    } catch (error) {
      setRenderError(translateError(error, t, 'error.previewFailed'))
    }
  }, [layout, settings, getSource, t])

  return (
    <section className={`preview-stage${settings.transparent ? ' has-transparency' : ''}`}>
      <div className="preview-toolbar">
        <div>
          <span className="live-dot" />
          {t('preview.live')}
        </div>
        <output>{formatNumber(layout.width)} × {formatNumber(layout.height)} px</output>
      </div>
      <div className="canvas-viewport">
        <canvas
          ref={canvasRef}
          aria-label={t('preview.canvasLabel')}
          aria-hidden={Boolean(renderError)}
          className={renderError ? 'is-hidden' : ''}
        />
        {renderError && <p className="preview-error" role="alert">{renderError}</p>}
      </div>
    </section>
  )
}
