import type { StitchLayout, StitchSettings } from '../editor/types'
import { AppError } from '../editor/errors'
import { renderLayout } from './render'

interface ExportOptions {
  layout: StitchLayout
  settings: StitchSettings
  getSource: (id: string) => CanvasImageSource | undefined
}

export async function exportStitch({ layout, settings, getSource }: ExportOptions) {
  const canvas = document.createElement('canvas')
  try {
    renderLayout({ canvas, layout, settings, getSource })
    const mime = settings.format === 'png' ? 'image/png' : 'image/jpeg'
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new AppError('encode-failed'))),
        mime,
        settings.quality,
      )
    })
  } finally {
    canvas.width = 0
    canvas.height = 0
  }
}
