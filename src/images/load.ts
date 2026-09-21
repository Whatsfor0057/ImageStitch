import { LIMITS } from '../config/limits'
import { AppError } from '../editor/errors'

export interface DecodedImage {
  source: CanvasImageSource
  width: number
  height: number
  dispose: () => void
}

export async function decodeImage(file: File): Promise<DecodedImage> {
  if (!LIMITS.acceptedTypes.includes(file.type as (typeof LIMITS.acceptedTypes)[number])) {
    throw new AppError('unsupported-type', { name: file.name })
  }
  if (file.size > LIMITS.maxFileBytes) {
    throw new AppError('file-too-large', {
      name: file.name,
      max: Math.round(LIMITS.maxFileBytes / 1024 / 1024),
    })
  }

  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      }
    } catch {
      // Fall back to HTMLImageElement for browsers with partial ImageBitmap support.
    }
  }

  const objectUrl = URL.createObjectURL(file)
  const image = new Image()
  image.src = objectUrl
  try {
    await image.decode()
  } catch {
    URL.revokeObjectURL(objectUrl)
    throw new AppError('decode-failed', { name: file.name })
  }
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    dispose: () => URL.revokeObjectURL(objectUrl),
  }
}
