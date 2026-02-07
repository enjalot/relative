import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Reads initial state from URL search params.
 * Returns decoded values (or undefined if not present).
 */
function readUrlState() {
  const params = new URLSearchParams(window.location.search)
  const v = params.get('v')
  const u = params.get('u')
  const e = params.get('e')
  const c = params.get('c')
  const f = params.get('f')

  return {
    inputValue: v !== null ? parseFloat(v) : undefined,
    inputUnitId: u ?? undefined,
    targetEntryId: e ?? undefined,
    targetConversionId: c ?? undefined,
    factorOverrides: f ? parseFactorOverrides(f) : undefined,
  }
}

function parseFactorOverrides(encoded: string): Record<string, number> {
  const result: Record<string, number> = {}
  for (const pair of encoded.split(',')) {
    const [key, val] = pair.split(':')
    if (key && val) {
      const num = parseFloat(val)
      if (!isNaN(num)) result[key] = num
    }
  }
  return result
}

function encodeFactorOverrides(overrides: Record<string, number>): string {
  const entries = Object.entries(overrides)
  if (entries.length === 0) return ''
  return entries.map(([k, v]) => `${k}:${v}`).join(',')
}

interface UrlState {
  inputValue: number
  inputUnitId: string
  targetEntryId: string | undefined
  targetConversionId: string | undefined
  factorOverrides: Record<string, number>
}

/**
 * Hook that syncs app state to/from URL search params.
 * Reads initial state from URL on mount, writes state changes to URL.
 */
export function useUrlState(defaults: { inputValue: number; inputUnitId: string }) {
  const initial = readUrlState()

  const [inputValue, setInputValue] = useState<number>(initial.inputValue ?? defaults.inputValue)
  const [inputUnitId, setInputUnitId] = useState<string>(initial.inputUnitId ?? defaults.inputUnitId)
  const [targetEntryId, setTargetEntryId] = useState<string | undefined>(initial.targetEntryId)
  const [targetConversionId, setTargetConversionId] = useState<string | undefined>(initial.targetConversionId)
  const [factorOverrides, setFactorOverrides] = useState<Record<string, number>>(initial.factorOverrides ?? {})

  // Debounced URL update to avoid thrashing during rapid input
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const syncToUrl = useCallback((state: UrlState) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('v', String(state.inputValue))
      params.set('u', state.inputUnitId)
      if (state.targetEntryId) params.set('e', state.targetEntryId)
      if (state.targetConversionId) params.set('c', state.targetConversionId)
      const fStr = encodeFactorOverrides(state.factorOverrides)
      if (fStr) params.set('f', fStr)

      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState(null, '', newUrl)
    }, 300)
  }, [])

  // Sync to URL whenever state changes
  useEffect(() => {
    syncToUrl({ inputValue, inputUnitId, targetEntryId, targetConversionId, factorOverrides })
  }, [inputValue, inputUnitId, targetEntryId, targetConversionId, factorOverrides, syncToUrl])

  const handleFactorChange = useCallback((ruleId: string, newFactor: number | undefined) => {
    setFactorOverrides(prev => {
      const next = { ...prev }
      if (newFactor === undefined) {
        delete next[ruleId]
      } else {
        next[ruleId] = newFactor
      }
      return next
    })
  }, [])

  return {
    inputValue,
    setInputValue,
    inputUnitId,
    setInputUnitId,
    targetEntryId,
    setTargetEntryId,
    targetConversionId,
    setTargetConversionId,
    factorOverrides,
    handleFactorChange,
  }
}
