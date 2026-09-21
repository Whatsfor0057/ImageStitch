import type { StitchLayout, StitchSettings } from '../editor/types'
import { AppError } from '../editor/errors'

interface RenderOptions {
  canvas: HTMLCanvasElement
  layout: StitchLayout
  settings: StitchSettings
  getSource: (id: string) => CanvasImageSource | undefined
  scale?: number
}

export function renderLayout({ canvas, layout, settings, getSource, scale = 1 }: RenderOptions) {
  const width = Math.max(1, Math.round(layout.width * scale))
  const height = Math.max(1, Math.round(layout.height * scale))
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { alpha: true })
  if (!context) throw new AppError('canvas-unavailable')

  context.clearRect(0, 0, width, height)
  const shouldFill = settings.format === 'jpeg' || !settings.transparent
  if (shouldFill) {
    context.fillStyle = settings.background
    context.fillRect(0, 0, width, height)
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  for (const item of layout.items) {
    const source = getSource(item.id)
    if (!source) continue
    context.drawImage(
      source,
      Math.round(item.x * scale),
      Math.round(item.y * scale),
      Math.round(item.width * scale),
      Math.round(item.height * scale),
    )
  }
}
