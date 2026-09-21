import { AppError } from '../editor/errors'
import type { MessageKey, Translate } from './types'

const errorMessageKeys: Record<AppError['code'], MessageKey> = {
  'unsupported-type': 'error.unsupportedType',
  'file-too-large': 'error.fileTooLarge',
  'decode-failed': 'error.decodeFailed',
  'canvas-unavailable': 'error.canvasUnavailable',
  'encode-failed': 'error.encodeFailed',
}

export function translateError(error: unknown, t: Translate, fallback: MessageKey) {
  if (error instanceof AppError) return t(errorMessageKeys[error.code], error.values)
  return t(fallback)
}
