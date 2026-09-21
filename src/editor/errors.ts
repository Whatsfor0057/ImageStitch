export type AppErrorCode =
  | 'unsupported-type'
  | 'file-too-large'
  | 'decode-failed'
  | 'canvas-unavailable'
  | 'encode-failed'

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    public readonly values: Record<string, string | number> = {},
  ) {
    super(code)
    this.name = 'AppError'
  }
}
