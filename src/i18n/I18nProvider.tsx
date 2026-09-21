import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { en } from './messages/en'
import { ja } from './messages/ja'
import { ru } from './messages/ru'
import { zhCN } from './messages/zh-CN'
import type { Locale, MessageDictionary, MessageKey, MessageValues, Translate } from './types'

const LOCALE_STORAGE_KEY = 'imagestitch.locale'
const supportedLocales: Locale[] = ['zh-CN', 'en', 'ru', 'ja']
const dictionaries: Record<Locale, MessageDictionary> = { 'zh-CN': zhCN, en, ru, ja }

interface LocaleStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export function readStoredLocale(storage: LocaleStorage | undefined): Locale | null {
  try {
    const saved = storage?.getItem(LOCALE_STORAGE_KEY)
    return saved && supportedLocales.includes(saved as Locale) ? saved as Locale : null
  } catch {
    return null
  }
}

export function writeStoredLocale(storage: LocaleStorage | undefined, locale: Locale) {
  try {
    storage?.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Language switching should keep working when browser storage is unavailable.
  }
}

function getBrowserStorage(): LocaleStorage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translate
  formatNumber: (value: number) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function detectLocale(): Locale {
  const saved = readStoredLocale(getBrowserStorage())
  if (saved) return saved

  for (const language of navigator.languages) {
    const normalized = language.toLowerCase()
    if (normalized.startsWith('zh')) return 'zh-CN'
    if (normalized.startsWith('ja')) return 'ja'
    if (normalized.startsWith('ru')) return 'ru'
    if (normalized.startsWith('en')) return 'en'
  }
  return 'zh-CN'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>(detectLocale)

  const setLocale = useCallback((nextLocale: Locale) => {
    writeStoredLocale(getBrowserStorage(), nextLocale)
    updateLocale(nextLocale)
  }, [])

  const t = useCallback<Translate>(
    (key: MessageKey, values?: MessageValues) => {
      const template = dictionaries[locale][key] ?? zhCN[key]
      if (!values) return template
      return template.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`))
    },
    [locale],
  )

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale])
  const formatNumber = useCallback((value: number) => numberFormatter.format(value), [numberFormatter])

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = t('meta.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'))
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', t('meta.title'))
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', t('meta.description'))
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', t('meta.title'))
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', t('meta.description'))
  }, [locale, t])

  const value = useMemo(
    () => ({ locale, setLocale, t, formatNumber }),
    [locale, setLocale, t, formatNumber],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within I18nProvider')
  return context
}
