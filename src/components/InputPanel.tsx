import { useMemo } from 'react'
import { units } from '../data/units'
import type { Dimension } from '../types'

/**
 * Input panel: number field + unit combobox.
 * Shows power and energy units grouped by dimension.
 */

interface InputPanelProps {
  value: number
  unitId: string
  onValueChange: (value: number) => void
  onUnitChange: (unitId: string) => void
}

/** Which dimensions to show in the input unit selector */
const INPUT_DIMENSIONS: Dimension[] = ['power', 'energy', 'money']

export function InputPanel({ value, unitId, onValueChange, onUnitChange }: InputPanelProps) {
  const groupedUnits = useMemo(() => {
    const groups: Record<string, typeof units> = {}
    for (const u of units) {
      if (INPUT_DIMENSIONS.includes(u.dimension)) {
        if (!groups[u.dimension]) groups[u.dimension] = []
        groups[u.dimension].push(u)
      }
    }
    return groups
  }, [])

  return (
    <div className="input-panel">
      <label className="input-label">How much?</label>
      <div className="input-row">
        <input
          type="number"
          className="input-number"
          value={value || ''}
          onChange={e => {
            const v = parseFloat(e.target.value)
            onValueChange(isNaN(v) ? 0 : v)
          }}
          placeholder="Enter a number..."
          min={0}
          step="any"
        />
        <select
          className="input-unit"
          value={unitId}
          onChange={e => onUnitChange(e.target.value)}
        >
          {Object.entries(groupedUnits).map(([dim, dimUnits]) => (
            <optgroup key={dim} label={dim.charAt(0).toUpperCase() + dim.slice(1)}>
              {dimUnits.map(u => (
                <option key={u.id} value={u.id}>
                  {u.symbol} ({u.name})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  )
}
