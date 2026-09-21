import { useI18n } from '../i18n/I18nProvider'
import type { Locale } from '../i18n/types'

const languageNames: Record<Locale, string> = {
  'zh-CN': '简体中文',
  en: 'English',
  ru: 'Русский',
  ja: '日本語',
}

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n()

  return (
    <label className="language-selector">
      <GlobeIcon />
      <span className="visually-hidden">{t('language.label')}</span>
      <select
        value={locale}
        aria-label={t('language.label')}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {(Object.entries(languageNames) as [Locale, string][]).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <ChevronIcon />
    </label>
  )
}

function GlobeIcon() {
  return (
    <svg className="language-icon" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path d="M3.5 10h13M10 3c2 2 3 4.3 3 7s-1 5-3 7c-2-2-3-4.3-3-7s1-5 3-7Z" />
    </svg>
  )
}

function ChevronIcon() {
  return <svg className="language-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m5 6.5 3 3 3-3" /></svg>
}
