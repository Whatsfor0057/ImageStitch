import { describe, expect, it } from 'vitest'
import { calculateLayout } from './layout'

const images = [
  { id: 'wide', width: 1200, height: 600 },
  { id: 'tall', width: 600, height: 1200 },
]

describe('calculateLayout', () => {
  it('stacks images vertically while preserving aspect ratio', () => {
    const layout = calculateLayout(images, {
      direction: 'vertical',
      outputSize: 600,
      gap: 10,
      padding: 20,
    })
    expect(layout).toEqual({
      width: 640,
      height: 1550,
      items: [
        { id: 'wide', x: 20, y: 20, width: 600, height: 300 },
        { id: 'tall', x: 20, y: 330, width: 600, height: 1200 },
      ],
    })
  })

  it('places images horizontally while preserving aspect ratio', () => {
    const layout = calculateLayout(images, {
      direction: 'horizontal',
      outputSize: 400,
      gap: 8,
      padding: 16,
    })
    expect(layout.width).toBe(1040)
    expect(layout.height).toBe(432)
    expect(layout.items[1]).toEqual({ id: 'tall', x: 824, y: 16, width: 200, height: 400 })
  })
})
