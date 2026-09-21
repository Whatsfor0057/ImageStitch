import { describe, expect, it } from 'vitest'
import { en } from './messages/en'
import { ja } from './messages/ja'
import { ru } from './messages/ru'
import { zhCN } from './messages/zh-CN'
import { readStoredLocale, writeStoredLocale } from './I18nProvider'

const dictionaries = { en, ru, ja }
const placeholderPattern = /\{\w+\}/g

describe('translation dictionaries', () => {
  it.each(Object.entries(dictionaries))('%s contains the same keys as Chinese', (_, dictionary) => {
    expect(Object.keys(dictionary).sort()).toEqual(Object.keys(zhCN).sort())
  })

  it.each(Object.entries(dictionaries))('%s preserves interpolation placeholders', (_, dictionary) => {
    for (const key of Object.keys(zhCN) as (keyof typeof zhCN)[]) {
      const sourcePlaceholders = zhCN[key].match(placeholderPattern)?.sort() ?? []
      const translatedPlaceholders = dictionary[key].match(placeholderPattern)?.sort() ?? []
      expect(translatedPlaceholders, key).toEqual(sourcePlaceholders)
    }
  })
})

describe('locale storage', () => {
  it('ignores unavailable or invalid browser storage', () => {
    const unavailable = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
    }
    expect(readStoredLocale(unavailable)).toBeNull()
    expect(readStoredLocale({ ...unavailable, getItem: () => 'unknown' })).toBeNull()
    expect(() => writeStoredLocale(unavailable, 'en')).not.toThrow()
  })

  it('reads and writes supported locales', () => {
    let value: string | null = 'ja'
    const storage = {
      getItem: () => value,
      setItem: (_key: string, nextValue: string) => { value = nextValue },
    }
    expect(readStoredLocale(storage)).toBe('ja')
    writeStoredLocale(storage, 'ru')
    expect(value).toBe('ru')
  })
})
