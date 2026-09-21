import type { ImageItem, StitchLayout, StitchSettings } from '../editor/types'

export function calculateLayout(
  images: Pick<ImageItem, 'id' | 'width' | 'height'>[],
  settings: Pick<StitchSettings, 'direction' | 'gap' | 'padding' | 'outputSize'>,
): StitchLayout {
  if (images.length === 0) return { width: 0, height: 0, items: [] }

  const outputSize = Math.max(1, Math.round(settings.outputSize))
  const gap = Math.max(0, Math.round(settings.gap))
  const padding = Math.max(0, Math.round(settings.padding))
  let cursor = padding

  if (settings.direction === 'vertical') {
    const items = images.map((image) => {
      const height = Math.max(1, Math.round((outputSize * image.height) / image.width))
      const item = { id: image.id, x: padding, y: cursor, width: outputSize, height }
      cursor += height + gap
      return item
    })
    return {
      width: outputSize + padding * 2,
      height: cursor - gap + padding,
      items,
    }
  }

  const items = images.map((image) => {
    const width = Math.max(1, Math.round((outputSize * image.width) / image.height))
    const item = { id: image.id, x: cursor, y: padding, width, height: outputSize }
    cursor += width + gap
    return item
  })
  return {
    width: cursor - gap + padding,
    height: outputSize + padding * 2,
    items,
  }
}
