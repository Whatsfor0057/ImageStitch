import { describe, expect, it } from 'vitest'
import {
  HISTORY_LIMIT,
  historyReducer,
  initialHistoryState,
  type UndoableEditorState,
} from './reducer'
import type { ImageItem, StitchSettings } from './types'

const image = (id: string, kind: ImageItem['kind'] = 'image'): ImageItem => ({
  id,
  name: `${id}.png`,
  kind,
  anchorNumber: kind === 'anchor' ? 1 : undefined,
  width: 100,
  height: 200,
  bytes: 1000,
  previewUrl: `blob:${id}`,
})

describe('historyReducer', () => {
  it('undoes an anchor back to the original images and settings', () => {
    let state = historyReducer(initialHistoryState, {
      type: 'history/apply',
      action: { type: 'images/add', images: [image('a'), image('b')] },
    })
    const settingsBeforeAnchor = state.present.settings
    const anchoredSettings: StitchSettings = {
      ...state.present.settings,
      gap: 0,
      padding: 0,
      outputSize: 300,
    }
    state = historyReducer(state, {
      type: 'history/apply',
      action: { type: 'images/anchor', image: image('anchor', 'anchor'), settings: anchoredSettings },
    })

    const restored = historyReducer(state, { type: 'history/undo' })
    expect(restored.present.images.map(({ id }) => id)).toEqual(['a', 'b'])
    expect(restored.present.settings).toEqual(settingsBeforeAnchor)
  })

  it('merges rapid changes to the same setting into one undo step', () => {
    let state = historyReducer(initialHistoryState, {
      type: 'history/apply',
      action: { type: 'settings/number', key: 'gap', value: 10 },
      mergeKey: 'settings:gap',
      time: 100,
    })
    state = historyReducer(state, {
      type: 'history/apply',
      action: { type: 'settings/number', key: 'gap', value: 24 },
      mergeKey: 'settings:gap',
      time: 500,
    })

    expect(state.past).toHaveLength(1)
    expect(historyReducer(state, { type: 'history/undo' }).present.settings.gap).toBe(0)
  })

  it('keeps at most twenty undo states', () => {
    let state: UndoableEditorState = initialHistoryState
    for (let index = 0; index < HISTORY_LIMIT + 5; index += 1) {
      state = historyReducer(state, {
        type: 'history/apply',
        action: { type: 'settings/number', key: 'gap', value: index + 1 },
        time: index * 1000,
      })
    }
    expect(state.past).toHaveLength(HISTORY_LIMIT)
  })
})
