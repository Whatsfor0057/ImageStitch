export type StitchDirection = 'vertical' | 'horizontal'
export type ExportFormat = 'png' | 'jpeg'
export type ImageItemKind = 'image' | 'anchor'

export interface ImageItem {
  id: string
  name: string
  kind: ImageItemKind
  anchorNumber?: number
  width: number
  height: number
  bytes: number
  previewUrl: string
}

export interface StitchSettings {
  direction: StitchDirection
  gap: number
  padding: number
  background: string
  transparent: boolean
  outputSize: number
  format: ExportFormat
  quality: number
}

export interface LayoutItem {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export interface StitchLayout {
  width: number
  height: number
  items: LayoutItem[]
}
