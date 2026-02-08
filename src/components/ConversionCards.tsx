import { useState, useRef, useEffect } from 'react'
import type { ConversionSentence } from '../engine/converter'
import { formatNumber, formatDuration } from '../engine/converter'
import { getUnit } from '../data/units'

interface ConversionCardsProps {
  sentences: ConversionSentence[]
  inputNumber: number
  inputUnitId: string
  onInputNumberChange: (n: number) => void
  onEntryChange: (conversionId: string, entryId: string) => void
  factorOverrides?: Record<string, number>
  onFactorChange?: (ruleId: string, newFactor: number | undefined) => void
}

/** Format the factor for display in a human-friendly way */
function formatFactorForDisplay(ruleId: string, factor: number): { editValue: number; unit: string; label: string } {
  if (ruleId === 'energy-to-money-electricity') {
    return { label: 'electricity price', editValue: factor * 1000, unit: '$/kWh' }
  }
  if (ruleId === 'energy-to-distance-tesla') {
    return { label: 'EV efficiency', editValue: 1000 / factor, unit: 'Wh/km' }
  }
  if (ruleId === 'energy-to-mass-aluminum') {
    return { label: 'energy per kg', editValue: 1 / (factor * 1000), unit: 'kWh/kg' }
  }
  if (ruleId === 'power-energy-duration') {
    return { label: 'duration', editValue: factor, unit: 'hours' }
  }
  return { label: 'factor', editValue: factor, unit: '' }
}

function editValueToFactor(ruleId: string, editValue: number): number {
  if (ruleId === 'energy-to-money-electricity') return editValue / 1000
  if (ruleId === 'energy-to-distance-tesla') return 1000 / editValue
  if (ruleId === 'energy-to-mass-aluminum') return 1 / (editValue * 1000)
  return editValue
}

/** Dimension emoji indicators */
const dimensionEmoji: Record<string, string> = {
  power: '\u26A1',
  energy: '\uD83D\uDD0B',
  distance: '\uD83D\uDCCF',
  mass: '\u2696\uFE0F',
  money: '\uD83D\uDCB5',
  time: '\u23F0',
}

/** Inline editable number that shows as dotted-underline text, becomes input on click */
function TangleNumber({ value, onChange, suffix }: {
  value: number
  onChange: (v: number) => void
  suffix?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  if (editing) {
    return (
      <span className="tangle-input-wrap">
        <input
          ref={inputRef}
          type="number"
          className="tangle-input"
          value={draft}
          step="any"
          min={0}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => {
            const v = parseFloat(draft)
            if (!isNaN(v) && v > 0) onChange(v)
            setEditing(false)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const v = parseFloat(draft)
              if (!isNaN(v) && v > 0) onChange(v)
              setEditing(false)
            }
            if (e.key === 'Escape') setEditing(false)
          }}
        />
        {suffix && <span className="tangle-suffix">{suffix}</span>}
      </span>
    )
  }

  return (
    <span
      className="tangle-number"
      onClick={() => {
        setDraft(String(value))
        setEditing(true)
      }}
      title="Click to edit"
    >
      {formatNumber(value)}{suffix ? ` ${suffix}` : ''}
    </span>
  )
}

/** Inline dropdown that blends with text — subtle bottom border, faded arrow */
function InlineSelect({ value, options, onChange }: {
  value: string
  options: Array<{ id: string; label: string; hint: string; emoji: string }>
  onChange: (id: string) => void
}) {
  return (
    <span className="inline-select-wrap">
      <select
        className="inline-select"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>
            {opt.emoji} {opt.label} ({opt.hint})
          </option>
        ))}
      </select>
    </span>
  )
}

export function ConversionCards({
  sentences,
  inputNumber,
  inputUnitId,
  onInputNumberChange,
  onEntryChange,
  factorOverrides,
  onFactorChange,
}: ConversionCardsProps) {
  const inputUnit = getUnit(inputUnitId)

  return (
    <div className="conversion-cards">
      {sentences.map((sentence) => {
        const dimEmoji = dimensionEmoji[sentence.outputDimension] || ''

        // Build dropdown options with value hints
        const options = sentence.alternatives.map(alt => {
          const altUnit = getUnit(alt.entry.unitId)
          const hint = alt.durationHours !== undefined
            ? formatDuration(alt.durationHours)
            : `${formatNumber(alt.entry.value)} ${altUnit.symbol}`
          return {
            id: alt.entry.id,
            label: alt.entry.name,
            hint,
            emoji: alt.entry.emoji,
          }
        })

        // Format the count nicely
        const countStr = formatNumber(sentence.count)
        const isDurationBased = sentence.durationHours !== undefined

        // Build the conversion step info if there is one (not for duration-based)
        const step = sentence.steps[0]
        const stepInfo = (!isDurationBased && step) ? (() => {
          const currentFactor = factorOverrides?.[step.rule.id] ?? step.rule.factor
          const { editValue, unit, label } = formatFactorForDisplay(step.rule.id, currentFactor)
          const isOverridden = factorOverrides?.[step.rule.id] !== undefined
          return { currentFactor, editValue, unit, label, isOverridden, ruleId: step.rule.id }
        })() : null

        return (
          <div className="conversion-card" key={sentence.conversionId}>
            <div className="card-dimension-tag">
              {dimEmoji} {sentence.conversionName}
            </div>
            {isDurationBased && inputUnit.dimension === 'energy' ? (
              <p className="card-sentence">
                <TangleNumber
                  value={inputNumber}
                  onChange={onInputNumberChange}
                  suffix={inputUnit.symbol}
                />
                {' is the equivalent of running '}
                <InlineSelect
                  value={sentence.outputEntry.id}
                  options={options}
                  onChange={(id) => onEntryChange(sentence.conversionId, id)}
                />
                {' for '}
                <span className="card-count">{formatDuration(sentence.durationHours!)}</span>
              </p>
            ) : isDurationBased && inputUnit.dimension === 'power' ? (
              <p className="card-sentence">
                <TangleNumber
                  value={inputNumber}
                  onChange={onInputNumberChange}
                  suffix={inputUnit.symbol}
                />
                {' running for '}
                <span className="card-count">{formatDuration(sentence.durationHours!)}</span>
                {' is the equivalent of '}
                <InlineSelect
                  value={sentence.outputEntry.id}
                  options={options}
                  onChange={(id) => onEntryChange(sentence.conversionId, id)}
                />
              </p>
            ) : (
              <p className="card-sentence">
                <TangleNumber
                  value={inputNumber}
                  onChange={onInputNumberChange}
                  suffix={inputUnit.symbol}
                />
                {' is '}
                <span className="card-count">{countStr}</span>
                {' '}
                <InlineSelect
                  value={sentence.outputEntry.id}
                  options={options}
                  onChange={(id) => onEntryChange(sentence.conversionId, id)}
                />
              </p>
            )}
            {stepInfo && onFactorChange && (
              <p className="card-step">
                assuming{' '}
                <TangleNumber
                  value={stepInfo.editValue}
                  onChange={(v) => {
                    const raw = editValueToFactor(stepInfo.ruleId, v)
                    onFactorChange(stepInfo.ruleId, raw)
                  }}
                  suffix={stepInfo.unit}
                />
                {stepInfo.isOverridden && (
                  <button
                    className="card-reset"
                    onClick={() => onFactorChange(stepInfo.ruleId, undefined)}
                    title="Reset to default"
                  >
                    reset
                  </button>
                )}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
