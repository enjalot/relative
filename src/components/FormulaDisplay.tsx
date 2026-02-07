import type { FormulaResult } from '../types'
import { formatNumber } from '../engine/converter'

/**
 * Displays the conversion formula and legend.
 *
 * Shows:
 * - The equation: INPUT = COUNT × OUTPUT
 * - Conversion steps (if any hops)
 * - Legend: what one emoji represents
 */

interface FormulaDisplayProps {
  formula: FormulaResult
}

export function FormulaDisplay({ formula }: FormulaDisplayProps) {
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
          {steps.map((step, i) => (
            <div key={i} className="formula-step">
              via {step.rule.name}
            </div>
          ))}
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
