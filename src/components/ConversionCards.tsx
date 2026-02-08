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
  if (ruleId === 'energy-to-time-household') {
    // factor is s/Wh. consumption_W = 3600/factor. Display as kW.
    return { label: 'household draw', editValue: 3600 / factor / 1000, unit: 'kW' }
  }
  return { label: 'factor', editValue: factor, unit: '' }
}

function editValueToFactor(ruleId: string, editValue: number): number {
  if (ruleId === 'energy-to-money-electricity') return editValue / 1000
  if (ruleId === 'energy-to-distance-tesla') return 1000 / editValue
  if (ruleId === 'energy-to-mass-aluminum') return 1 / (editValue * 1000)
  if (ruleId === 'energy-to-time-household') return 3600 / (editValue * 1000)
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

/**
 * Build the factor display element for a conversion step.
 * Returns the inline-editable factor with reset button, or null if no step.
 */
function FactorInline({ step, factorOverrides, onFactorChange }: {
  step: { rule: { id: string; factor: number } }
  factorOverrides?: Record<string, number>
  onFactorChange?: (ruleId: string, newFactor: number | undefined) => void
}) {
  const currentFactor = factorOverrides?.[step.rule.id] ?? step.rule.factor
  const { editValue, unit } = formatFactorForDisplay(step.rule.id, currentFactor)
  const isOverridden = factorOverrides?.[step.rule.id] !== undefined

  return (
    <>
      <TangleNumber
        value={editValue}
        onChange={(v) => {
          const raw = editValueToFactor(step.rule.id, v)
          onFactorChange?.(step.rule.id, raw)
        }}
        suffix={unit}
      />
      {isOverridden && onFactorChange && (
        <button
          className="card-reset"
          onClick={() => onFactorChange(step.rule.id, undefined)}
          title="Reset to default"
        >
          reset
        </button>
      )}
    </>
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

        // Build dropdown options with value hints — always show native value, not computed duration
        const options = sentence.alternatives.map(alt => {
          const altUnit = getUnit(alt.entry.unitId)
          return {
            id: alt.entry.id,
            label: alt.entry.name,
            hint: `${formatNumber(alt.entry.value)} ${altUnit.symbol}`,
            emoji: alt.entry.emoji,
          }
        })

        const countStr = formatNumber(sentence.count)
        const isDurationBased = sentence.durationHours !== undefined
        const step = sentence.steps[0]
        const ruleId = step?.rule.id
        // Is this a reverse conversion? (input dimension matches the rule's toDimension)
        const isReverse = step ? step.rule.toDimension === inputUnit.dimension : false

        // Shared elements
        const inputEl = (
          <TangleNumber value={inputNumber} onChange={onInputNumberChange} suffix={inputUnit.symbol} />
        )
        const countEl = <span className="card-count">{countStr}</span>
        const selectEl = (
          <InlineSelect
            value={sentence.outputEntry.id}
            options={options}
            onChange={(id) => onEntryChange(sentence.conversionId, id)}
          />
        )
        const factorEl = step ? (
          <FactorInline step={step} factorOverrides={factorOverrides} onFactorChange={onFactorChange} />
        ) : null

        // Build the sentence based on conversion type
        let sentenceContent: React.ReactNode

        if (isDurationBased && inputUnit.dimension === 'energy') {
          // Energy input, power output via duration
          sentenceContent = (
            <p className="card-sentence">
              {inputEl}
              {' is the equivalent of running '}
              {selectEl}
              {' for '}
              <span className="card-count">{formatDuration(sentence.durationHours!)}</span>
            </p>
          )
        } else if (isDurationBased && inputUnit.dimension === 'power') {
          // Power input, energy output via duration
          sentenceContent = (
            <p className="card-sentence">
              {inputEl}
              {' running for '}
              <span className="card-count">{formatDuration(sentence.durationHours!)}</span>
              {' is the equivalent of '}
              {selectEl}
            </p>
          )
        } else if (ruleId === 'energy-to-money-electricity' && !isReverse) {
          // Energy → Money
          sentenceContent = (
            <p className="card-sentence">
              {'at '}{factorEl}{', '}{inputEl}{' costs the equivalent of '}{countEl}{' '}{selectEl}
            </p>
          )
        } else if (ruleId === 'energy-to-money-electricity' && isReverse) {
          // Money → Energy
          sentenceContent = (
            <p className="card-sentence">
              {'at '}{factorEl}{', '}{inputEl}{' buys enough electricity for '}{countEl}{' '}{selectEl}
            </p>
          )
        } else if (ruleId === 'energy-to-distance-tesla' && !isReverse) {
          // Energy → Distance
          sentenceContent = (
            <p className="card-sentence">
              {'a Tesla Model 3 at '}{factorEl}{' could drive '}{countEl}{' '}{selectEl}{' on '}{inputEl}
            </p>
          )
        } else if (ruleId === 'energy-to-distance-tesla' && isReverse) {
          // Distance → Energy
          sentenceContent = (
            <p className="card-sentence">
              {'driving '}{inputEl}{' in a Tesla Model 3 at '}{factorEl}{' uses '}{countEl}{' '}{selectEl}
            </p>
          )
        } else if (ruleId === 'energy-to-mass-aluminum' && !isReverse) {
          // Energy → Mass
          sentenceContent = (
            <p className="card-sentence">
              {inputEl}{' could smelt '}{countEl}{' '}{selectEl}{' of aluminum at '}{factorEl}
            </p>
          )
        } else if (ruleId === 'energy-to-mass-aluminum' && isReverse) {
          // Mass → Energy
          sentenceContent = (
            <p className="card-sentence">
              {'smelting '}{inputEl}{' of aluminum at '}{factorEl}{' requires '}{countEl}{' '}{selectEl}
            </p>
          )
        } else if (ruleId === 'energy-to-time-household' && !isReverse) {
          // Energy → Time
          sentenceContent = (
            <p className="card-sentence">
              {'at '}{factorEl}{' average household draw, '}{inputEl}{' could power a home for '}{countEl}{' '}{selectEl}
            </p>
          )
        } else if (ruleId === 'energy-to-time-household' && isReverse) {
          // Time → Energy
          sentenceContent = (
            <p className="card-sentence">
              {'at '}{factorEl}{' average household draw, '}{inputEl}{' of electricity is '}{countEl}{' '}{selectEl}
            </p>
          )
        } else if (step && factorEl) {
          // Generic hop with factor (fallback)
          sentenceContent = (
            <p className="card-sentence">
              {inputEl}{' is '}{countEl}{' '}{selectEl}{' (at '}{factorEl}{')'}
            </p>
          )
        } else {
          // Direct comparison (same dimension)
          sentenceContent = (
            <p className="card-sentence">
              {inputEl}{' is '}{countEl}{' '}{selectEl}
            </p>
          )
        }

        return (
          <div className="conversion-card" key={sentence.conversionId}>
            <div className="card-dimension-tag">
              {dimEmoji} {sentence.conversionName}
            </div>
            {sentenceContent}
          </div>
        )
      })}
    </div>
  )
}
