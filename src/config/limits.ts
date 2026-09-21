export const LIMITS = {
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileBytes: 40 * 1024 * 1024,
  maxTotalBytes: 200 * 1024 * 1024,
  maxInputPixels: 120_000_000,
  maxOutputPixels: 80_000_000,
  maxCanvasEdge: 16_000,
  maxOutputSize: 12_000,
  maxPreviewEdge: 1_800,
  maxPreviewPixels: 4_000_000,
} as const
