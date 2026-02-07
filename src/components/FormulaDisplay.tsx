import type { FormulaResult } from '../types'
import { formatNumber } from '../engine/converter'

/**
 * Displays the conversion formula and legend.
 *
 * Shows:
 * - The equation: INPUT = COUNT × OUTPUT
 * - Conversion steps (if any hops) with editable conversion factors
 * - Legend: what one emoji represents
 */

interface FormulaDisplayProps {
  formula: FormulaResult
  factorOverrides?: Record<string, number>
  onFactorChange?: (ruleId: string, newFactor: number | undefined) => void
}

/** Format the factor for display in a human-friendly way */
function formatFactorLabel(ruleId: string, factor: number): { label: string; editValue: number; unit: string } {
  // Present certain conversions in more intuitive units
  if (ruleId === 'energy-to-money-electricity') {
    // factor is $/Wh, display as $/kWh
    return { label: 'Electricity price', editValue: factor * 1000, unit: '$/kWh' }
  }
  if (ruleId === 'energy-to-distance-tesla') {
    // factor is m/Wh, display as Wh/km
    return { label: 'EV efficiency', editValue: 1000 / factor, unit: 'Wh/km' }
  }
  if (ruleId === 'energy-to-mass-aluminum') {
    // factor is kg/Wh, display as kWh/kg
    return { label: 'Energy per kg', editValue: 1 / (factor * 1000), unit: 'kWh/kg' }
  }
  // For power-to-energy rules, show the time multiplier
  if (ruleId === 'power-to-energy-per-hour') {
    return { label: 'Hours', editValue: factor, unit: 'hours' }
  }
  if (ruleId === 'power-to-energy-per-day') {
    return { label: 'Hours', editValue: factor, unit: 'hours' }
  }
  if (ruleId === 'power-to-energy-per-year') {
    return { label: 'Hours', editValue: factor, unit: 'hours' }
  }
  return { label: 'Conversion factor', editValue: factor, unit: '' }
}

/** Convert edited value back to the raw factor */
function editValueToFactor(ruleId: string, editValue: number): number {
  if (ruleId === 'energy-to-money-electricity') {
    return editValue / 1000 // $/kWh → $/Wh
  }
  if (ruleId === 'energy-to-distance-tesla') {
    return 1000 / editValue // Wh/km → m/Wh
  }
  if (ruleId === 'energy-to-mass-aluminum') {
    return 1 / (editValue * 1000) // kWh/kg → kg/Wh
  }
  return editValue
}

export function FormulaDisplay({ formula, factorOverrides, onFactorChange }: FormulaDisplayProps) {
  const {
    inputNumber,
    inputUnit,
    steps,
    outputEntry,
    emojiCount,
    emojiScale,
    emojiLabel,
    outputUnit,
  } = formula

  // Format the input side
  const inputStr = `${formatNumber(inputNumber)} ${inputUnit.symbol}`

  // Format the output side
  const outputCount = emojiCount * emojiScale
  const outputValueTotal = outputCount * outputEntry.value
  const bestOutputStr = `${formatNumber(outputValueTotal)} ${outputUnit.symbol}`

  return (
    <div className="formula-display">
      <div className="formula-equation">
        <span className="formula-input">{inputStr}</span>
        <span className="formula-equals">=</span>
        <span className="formula-output">
          {formatNumber(outputCount)} × {outputEntry.emoji} {outputEntry.name}
        </span>
      </div>

      {steps.length > 0 && (
        <div className="formula-steps">
          {steps.map((step, i) => {
            const currentFactor = factorOverrides?.[step.rule.id] ?? step.rule.factor
            const { label, editValue, unit } = formatFactorLabel(step.rule.id, currentFactor)
            const isOverridden = factorOverrides?.[step.rule.id] !== undefined

            return (
              <div key={i} className="formula-step">
                <span className="step-label">via {step.rule.name}</span>
                {onFactorChange && (
                  <div className="step-factor-editor">
                    <label className="factor-label">{label}:</label>
                    <input
                      type="number"
                      className="factor-input"
                      value={editValue || ''}
                      step="any"
                      onChange={e => {
                        const val = parseFloat(e.target.value)
                        if (!isNaN(val) && val > 0) {
                          const rawFactor = editValueToFactor(step.rule.id, val)
                          onFactorChange(step.rule.id, rawFactor)
                        }
                      }}
                    />
                    <span className="factor-unit">{unit}</span>
                    {isOverridden && (
                      <button
                        className="factor-reset"
                        title="Reset to default"
                        onClick={() => onFactorChange(step.rule.id, undefined)}
                      >
                        ↺
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="formula-breakdown">
        <span className="formula-total">
          = {bestOutputStr}
        </span>
      </div>

      <div className="formula-legend">
        <div className="legend-item">
          <span className="legend-emoji">{outputEntry.emoji}</span>
          <span className="legend-text">{emojiLabel}</span>
        </div>
        <div className="legend-count">
          Showing <strong>{formatNumber(emojiCount)}</strong> emoji below
          {emojiScale > 1 && (
            <span> (each representing {formatNumber(emojiScale)} {outputEntry.name}s)</span>
          )}
        </div>
      </div>

      <div className="formula-description">
        <em>{outputEntry.description}</em>
      </div>
    </div>
  )
}
