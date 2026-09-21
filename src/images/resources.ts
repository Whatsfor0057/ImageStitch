import type { ImageItem } from '../editor/types'
import { decodeImage } from './load'

interface Resource {
  source: CanvasImageSource
  previewUrl: string
  disposeSource: () => void
  bytes: number
  pixels: number
}

export class ImageResourceStore {
  private resources = new Map<string, Resource>()

  async add(file: File): Promise<ImageItem> {
    return this.addFile(file, 'image')
  }

  async addAnchor(blob: Blob, anchorNumber: number): Promise<ImageItem> {
    const file = new File([blob], `anchor-${anchorNumber}.png`, { type: 'image/png' })
    return this.addFile(file, 'anchor', anchorNumber)
  }

  private async addFile(
    file: File,
    kind: ImageItem['kind'],
    anchorNumber?: number,
  ): Promise<ImageItem> {
    const decoded = await decodeImage(file)
    const id = crypto.randomUUID()
    const previewUrl = URL.createObjectURL(file)
    this.resources.set(id, {
      source: decoded.source,
      previewUrl,
      disposeSource: decoded.dispose,
      bytes: file.size,
      pixels: decoded.width * decoded.height,
    })
    return {
      id,
      name: file.name,
      kind,
      anchorNumber,
      width: decoded.width,
      height: decoded.height,
      bytes: file.size,
      previewUrl,
    }
  }

  getSource = (id: string) => this.resources.get(id)?.source

  getUsage() {
    let bytes = 0
    let pixels = 0
    for (const resource of this.resources.values()) {
      bytes += resource.bytes
      pixels += resource.pixels
    }
    return { bytes, pixels }
  }

  remove(id: string) {
    const resource = this.resources.get(id)
    if (!resource) return
    resource.disposeSource()
    URL.revokeObjectURL(resource.previewUrl)
    this.resources.delete(id)
  }

  clear() {
    for (const id of this.resources.keys()) this.remove(id)
  }

  prune(keepIds: Set<string>) {
    for (const id of this.resources.keys()) {
      if (!keepIds.has(id)) this.remove(id)
    }
  }
}
