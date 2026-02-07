import { useMemo } from 'react'
import { getReachableQuantities } from '../engine/converter'

/**
 * Combobox for selecting which output quantity to visualize.
 * Groups quantities by conversion path (direct vs. via a rule).
 */

interface OutputSelectorProps {
  inputUnitId: string
  selectedEntryId: string | undefined
  selectedConversionId: string | undefined
  onSelect: (entryId: string, conversionId: string) => void
}

export function OutputSelector({
  inputUnitId,
  selectedEntryId,
  selectedConversionId,
  onSelect,
}: OutputSelectorProps) {
  const reachable = useMemo(
    () => getReachableQuantities(inputUnitId),
    [inputUnitId],
  )

  // Group by conversion
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; entries: typeof reachable }>()
    for (const r of reachable) {
      const key = r.conversionId
      if (!map.has(key)) map.set(key, { name: r.conversionName, entries: [] })
      map.get(key)!.entries.push(r)
    }
    return Array.from(map.entries())
  }, [reachable])

  const currentValue = selectedEntryId && selectedConversionId
    ? `${selectedConversionId}::${selectedEntryId}`
    : ''

  return (
    <div className="output-selector">
      <label className="input-label">Compare to:</label>
      <select
        className="input-unit"
        value={currentValue}
        onChange={e => {
          if (!e.target.value) {
            onSelect('', '')
            return
          }
          const [convId, entryId] = e.target.value.split('::')
          onSelect(entryId, convId)
        }}
      >
        <option value="">Auto (best fit)</option>
        {groups.map(([convId, group]) => (
          <optgroup key={convId} label={group.name}>
            {group.entries.map(r => (
              <option key={`${convId}::${r.entry.id}`} value={`${convId}::${r.entry.id}`}>
                {r.entry.emoji} {r.entry.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
