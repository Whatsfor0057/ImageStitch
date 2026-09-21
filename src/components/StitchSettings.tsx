import type { ExportFormat, StitchDirection, StitchSettings as Settings } from '../editor/types'
import { useI18n } from '../i18n/I18nProvider'

interface StitchSettingsProps {
  settings: Settings
  disabled: boolean
  onDirection: (value: StitchDirection) => void
  onNumber: (key: 'gap' | 'padding' | 'outputSize' | 'quality', value: number) => void
  onBackground: (value: string) => void
  onTransparent: (value: boolean) => void
  onFormat: (value: ExportFormat) => void
}

export function StitchSettings({
  settings,
  disabled,
  onDirection,
  onNumber,
  onBackground,
  onTransparent,
  onFormat,
}: StitchSettingsProps) {
  const { t } = useI18n()

  return (
    <section className="panel-section settings-section" aria-labelledby="settings-heading">
      <div className="section-heading-row">
        <div>
          <span className="section-kicker">{t('settings.kicker')}</span>
          <h2 id="settings-heading">{t('settings.title')}</h2>
        </div>
      </div>

      <div className="segmented-control" aria-label={t('settings.direction')}>
        <button
          className={settings.direction === 'vertical' ? 'is-active' : ''}
          type="button"
          disabled={disabled}
          onClick={() => onDirection('vertical')}
        >
          <VerticalIcon />
          {t('settings.vertical')}
        </button>
        <button
          className={settings.direction === 'horizontal' ? 'is-active' : ''}
          type="button"
          disabled={disabled}
          onClick={() => onDirection('horizontal')}
        >
          <HorizontalIcon />
          {t('settings.horizontal')}
        </button>
      </div>

      <div className="field-grid">
        <NumberField
          label={settings.direction === 'vertical' ? t('settings.outputWidth') : t('settings.outputHeight')}
          value={settings.outputSize}
          min={1}
          max={12000}
          suffix="px"
          disabled={disabled}
          onChange={(value) => onNumber('outputSize', value)}
        />
        <NumberField
          label={t('settings.gap')}
          value={settings.gap}
          min={0}
          max={1000}
          suffix="px"
          disabled={disabled}
          onChange={(value) => onNumber('gap', value)}
        />
        <NumberField
          label={t('settings.padding')}
          value={settings.padding}
          min={0}
          max={2000}
          suffix="px"
          disabled={disabled}
          onChange={(value) => onNumber('padding', value)}
        />
        <label className="field color-field">
          <span>{t('settings.background')}</span>
          <span className="color-input-wrap">
            <input
              type="color"
              value={settings.background}
              onChange={(event) => onBackground(event.target.value)}
              disabled={disabled || settings.transparent}
            />
            <output>{settings.background.toUpperCase()}</output>
          </span>
        </label>
      </div>

      <label className={`switch-row${settings.format === 'jpeg' ? ' is-disabled' : ''}`}>
        <span>
          <strong>{t('settings.transparent')}</strong>
          <small>{t('settings.transparentHint')}</small>
        </span>
        <input
          type="checkbox"
          checked={settings.transparent}
          disabled={disabled || settings.format === 'jpeg'}
          onChange={(event) => onTransparent(event.target.checked)}
        />
        <span className="switch-control" aria-hidden="true" />
      </label>

      <div className="export-options">
        <span className="field-label">{t('settings.format')}</span>
        <div className="format-options">
          <label>
            <input
              type="radio"
              name="format"
              value="png"
              checked={settings.format === 'png'}
              disabled={disabled}
              onChange={() => onFormat('png')}
            />
            <span>PNG</span>
          </label>
          <label>
            <input
              type="radio"
              name="format"
              value="jpeg"
              checked={settings.format === 'jpeg'}
              disabled={disabled}
              onChange={() => onFormat('jpeg')}
            />
            <span>JPEG</span>
          </label>
        </div>
      </div>

      {settings.format === 'jpeg' && (
        <label className="range-field">
          <span>
            <span>{t('settings.jpegQuality')}</span>
            <output>{Math.round(settings.quality * 100)}%</output>
          </span>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.01"
            value={settings.quality}
            disabled={disabled}
            onChange={(event) => onNumber('quality', Number(event.target.value))}
          />
        </label>
      )}
    </section>
  )
}

interface NumberFieldProps {
  label: string
  value: number
  min: number
  max: number
  suffix: string
  disabled: boolean
  onChange: (value: number) => void
}

function NumberField({ label, value, min, max, suffix, disabled, onChange }: NumberFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="number-input-wrap">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)))
          }}
        />
        <span>{suffix}</span>
      </span>
    </label>
  )
}

function VerticalIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="2.5" width="10" height="6" /><rect x="5" y="11.5" width="10" height="6" /></svg>
}

function HorizontalIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="5" width="6" height="10" /><rect x="11.5" y="5" width="6" height="10" /></svg>
}
