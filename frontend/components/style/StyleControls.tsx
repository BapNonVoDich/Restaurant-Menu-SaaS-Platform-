'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'

export function StyleSection({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string
  description?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border border-border rounded-lg">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-background-muted/60"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h4 className="text-sm font-semibold text-text">{title}</h4>
          {description ? <p className="text-xs text-text-muted mt-0.5">{description}</p> : null}
        </div>
        <span className="text-text-muted text-sm">{open ? '−' : '+'}</span>
      </button>
      {open ? <div className="px-3 pb-3 pt-1 space-y-3">{children}</div> : null}
    </section>
  )
}

export function StyleToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
      <div className="inline-flex rounded-md border border-border overflow-hidden">
        {options.map((option) => {
          const active = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              className={`px-3 py-1.5 text-xs transition ${
                active ? 'bg-primary text-white' : 'bg-background text-text hover:bg-background-muted'
              }`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function normalizeValue(value: number, min?: number, max?: number) {
  if (min != null && value < min) return min
  if (max != null && value > max) return max
  return value
}

export type CssUnit = 'px' | 'rem' | '%'

export function parseCssNumberWithUnit(
  raw: string | undefined,
  fallbackValue: number,
  fallbackUnit: CssUnit = 'px'
): { value: number; unit: CssUnit; parsed: boolean } {
  if (!raw || !raw.trim()) {
    return { value: fallbackValue, unit: fallbackUnit, parsed: false }
  }
  const v = raw.trim().toLowerCase()
  const matched = v.match(/^(-?\d+(?:\.\d+)?)(px|rem|%)$/)
  if (!matched) {
    return { value: fallbackValue, unit: fallbackUnit, parsed: false }
  }
  const n = Number(matched[1])
  if (Number.isNaN(n)) {
    return { value: fallbackValue, unit: fallbackUnit, parsed: false }
  }
  return { value: n, unit: matched[2] as CssUnit, parsed: true }
}

export function StyleNumberStepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  suffix?: string
}) {
  const displayValue = useMemo(() => normalizeValue(value, min, max), [value, min, max])
  const decDisabled = min != null && displayValue <= min
  const incDisabled = max != null && displayValue >= max

  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={decDisabled}
          className="h-9 w-9 rounded border border-border text-text disabled:opacity-40 hover:bg-background-muted"
          onClick={() => onChange(normalizeValue(displayValue - step, min, max))}
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={(e) => {
            const next = Number(e.target.value)
            if (Number.isNaN(next)) return
            onChange(normalizeValue(next, min, max))
          }}
          className="input-field text-sm w-20 text-center"
        />
        <button
          type="button"
          disabled={incDisabled}
          className="h-9 w-9 rounded border border-border text-text disabled:opacity-40 hover:bg-background-muted"
          onClick={() => onChange(normalizeValue(displayValue + step, min, max))}
        >
          +
        </button>
        {suffix ? <span className="text-xs text-text-muted">{suffix}</span> : null}
      </div>
    </div>
  )
}

export function StyleUnitStepper({
  label,
  rawValue,
  fallbackValue,
  fallbackUnit = 'px',
  min,
  max,
  step = 1,
  onChange,
  allowClear = true,
}: {
  label: string
  rawValue?: string
  fallbackValue: number
  fallbackUnit?: CssUnit
  min?: number
  max?: number
  step?: number
  onChange: (nextRaw: string | undefined) => void
  allowClear?: boolean
}) {
  const parsed = useMemo(
    () => parseCssNumberWithUnit(rawValue, fallbackValue, fallbackUnit),
    [rawValue, fallbackValue, fallbackUnit]
  )
  const [unit, setUnit] = useState<CssUnit>(parsed.unit)
  useEffect(() => {
    setUnit(parsed.unit)
  }, [parsed.unit])
  const normalizedValue = normalizeValue(parsed.value, min, max)

  const emit = (num: number, u: CssUnit = unit) => {
    const next = normalizeValue(num, min, max)
    onChange(`${next}${u}`)
  }

  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-9 w-9 rounded border border-border text-text disabled:opacity-40 hover:bg-background-muted"
          disabled={min != null && normalizedValue <= min}
          onClick={() => emit(normalizedValue - step)}
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={normalizedValue}
          onChange={(e) => {
            const next = Number(e.target.value)
            if (Number.isNaN(next)) return
            emit(next)
          }}
          className="input-field text-sm w-24 text-center"
        />
        <button
          type="button"
          className="h-9 w-9 rounded border border-border text-text disabled:opacity-40 hover:bg-background-muted"
          disabled={max != null && normalizedValue >= max}
          onClick={() => emit(normalizedValue + step)}
        >
          +
        </button>
        <select
          value={unit}
          className="h-9 rounded border border-border px-2 text-sm bg-background"
          onChange={(e) => {
            const u = e.target.value as CssUnit
            setUnit(u)
            emit(normalizedValue, u)
          }}
        >
          <option value="px">px</option>
          <option value="rem">rem</option>
          <option value="%">%</option>
        </select>
        {allowClear ? (
          <button
            type="button"
            className="h-9 px-2 rounded border border-border text-xs text-text-muted hover:bg-background-muted"
            onClick={() => onChange(undefined)}
          >
            Clear
          </button>
        ) : null}
      </div>
      {!parsed.parsed && rawValue ? (
        <p className="text-xs text-amber-600 mt-1">
          Giá trị gốc không theo dạng số+đơn vị, đang dùng fallback để chỉnh.
        </p>
      ) : null}
    </div>
  )
}

