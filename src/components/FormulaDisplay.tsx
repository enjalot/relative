import type { FormulaResult } from '../types'
import { formatNumber } from '../engine/converter'

/**
 * Displays the conversion formula and legend.
 *
 * Shows:
 * - The equation: INPUT = COUNT × OUTPUT
 * - Conversion steps with editable factor inputs
 * - Legend: what one emoji represents
 */

interface FormulaDisplayProps {
  formula: FormulaResult
  /** Callback when user adjusts a conversion factor */
  onFactorChange?: (ruleId: string, newFactor: number) => void
  /** Current factor overrides (to show in inputs) */
  factorOverrides?: Record<string, number>
}

export function FormulaDisplay({ formula, onFactorChange, factorOverrides }: FormulaDisplayProps) {
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

  const inputStr = `${formatNumber(inputNumber)} ${inputUnit.symbol}`

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
            const ruleId = step.rule.id
            const defaultFactor = step.rule.factor
            const currentFactor = factorOverrides?.[ruleId] ?? defaultFactor
            const isOverridden = factorOverrides?.[ruleId] !== undefined

            return (
              <div key={i} className="formula-step">
                <span className="step-label">via {step.rule.name}</span>
                <span className="step-factor">
                  <span className="step-factor-label">factor:</span>
                  <input
                    type="number"
                    className="step-factor-input"
                    value={currentFactor}
                    step="any"
                    onChange={e => {
                      const v = parseFloat(e.target.value)
                      if (!isNaN(v) && v > 0 && onFactorChange) {
                        onFactorChange(ruleId, v)
                      }
                    }}
                    title={`Default: ${defaultFactor}\n${step.rule.description}`}
                  />
                  {isOverridden && (
                    <button
                      className="step-factor-reset"
                      onClick={() => onFactorChange?.(ruleId, defaultFactor)}
                      title={`Reset to default (${defaultFactor})`}
                    >
                      ↺
                    </button>
                  )}
                </span>
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
