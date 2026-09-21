import type { ExportFormat, ImageItem, StitchDirection, StitchSettings } from './types'

export interface EditorState {
  images: ImageItem[]
  settings: StitchSettings
}

export type EditorAction =
  | { type: 'images/add'; images: ImageItem[] }
  | { type: 'images/remove'; id: string }
  | { type: 'images/clear' }
  | { type: 'images/move'; from: number; to: number }
  | { type: 'images/anchor'; image: ImageItem; settings: StitchSettings }
  | { type: 'settings/direction'; value: StitchDirection }
  | { type: 'settings/number'; key: 'gap' | 'padding' | 'outputSize' | 'quality'; value: number }
  | { type: 'settings/background'; value: string }
  | { type: 'settings/transparent'; value: boolean }
  | { type: 'settings/format'; value: ExportFormat }

export const initialState: EditorState = {
  images: [],
  settings: {
    direction: 'vertical',
    gap: 0,
    padding: 0,
    background: '#ffffff',
    transparent: false,
    outputSize: 1200,
    format: 'png',
    quality: 0.92,
  },
}

export interface UndoableEditorState {
  past: EditorState[]
  present: EditorState
  lastMergeKey: string | null
  lastMergeTime: number
}

export type HistoryAction =
  | { type: 'history/apply'; action: EditorAction; mergeKey?: string; time?: number }
  | { type: 'history/undo' }

export const HISTORY_LIMIT = 20
const MERGE_WINDOW_MS = 750

export const initialHistoryState: UndoableEditorState = {
  past: [],
  present: initialState,
  lastMergeKey: null,
  lastMergeTime: 0,
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'images/add': {
      const wasEmpty = state.images.length === 0
      const images = [...state.images, ...action.images]
      const naturalSize = Math.max(
        ...images.map((image) =>
          state.settings.direction === 'vertical' ? image.width : image.height,
        ),
      )
      return {
        ...state,
        images,
        settings: wasEmpty
          ? { ...state.settings, outputSize: Math.min(6000, naturalSize) }
          : state.settings,
      }
    }
    case 'images/remove':
      return { ...state, images: state.images.filter((image) => image.id !== action.id) }
    case 'images/clear':
      return { ...state, images: [] }
    case 'images/anchor':
      return { images: [action.image], settings: action.settings }
    case 'images/move': {
      if (action.from === action.to || action.to < 0 || action.to >= state.images.length) return state
      const images = [...state.images]
      const [moved] = images.splice(action.from, 1)
      images.splice(action.to, 0, moved)
      return { ...state, images }
    }
    case 'settings/direction':
      return { ...state, settings: { ...state.settings, direction: action.value } }
    case 'settings/number':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } }
    case 'settings/background':
      return { ...state, settings: { ...state.settings, background: action.value } }
    case 'settings/transparent':
      return { ...state, settings: { ...state.settings, transparent: action.value } }
    case 'settings/format':
      return {
        ...state,
        settings: {
          ...state.settings,
          format: action.value,
          transparent: action.value === 'jpeg' ? false : state.settings.transparent,
        },
      }
    default:
      return state
  }
}

export function historyReducer(state: UndoableEditorState, action: HistoryAction): UndoableEditorState {
  if (action.type === 'history/undo') {
    const previous = state.past.at(-1)
    if (!previous) return state
    return {
      past: state.past.slice(0, -1),
      present: previous,
      lastMergeKey: null,
      lastMergeTime: 0,
    }
  }

  const next = editorReducer(state.present, action.action)
  if (next === state.present) return state

  const time = action.time ?? Date.now()
  const shouldMerge = Boolean(
    action.mergeKey
    && action.mergeKey === state.lastMergeKey
    && time - state.lastMergeTime <= MERGE_WINDOW_MS,
  )
  const past = shouldMerge
    ? state.past
    : [...state.past, state.present].slice(-HISTORY_LIMIT)

  return {
    past,
    present: next,
    lastMergeKey: action.mergeKey ?? null,
    lastMergeTime: action.mergeKey ? time : 0,
  }
}
