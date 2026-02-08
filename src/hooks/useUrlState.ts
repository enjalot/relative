import { useState, useEffect, useCallback, useRef } from 'react'

function readUrlState() {
  const params = new URLSearchParams(window.location.search)
  const v = params.get('v')
  const u = params.get('u')
  const f = params.get('f')

  return {
    inputValue: v !== null ? parseFloat(v) : undefined,
    inputUnitId: u ?? undefined,
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
  factorOverrides: Record<string, number>
}

export function useUrlState(defaults: { inputValue: number; inputUnitId: string }) {
  const initial = readUrlState()

  const [inputValue, setInputValue] = useState<number>(initial.inputValue ?? defaults.inputValue)
  const [inputUnitId, setInputUnitId] = useState<string>(initial.inputUnitId ?? defaults.inputUnitId)
  const [factorOverrides, setFactorOverrides] = useState<Record<string, number>>(initial.factorOverrides ?? {})

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const syncToUrl = useCallback((state: UrlState) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('v', String(state.inputValue))
      params.set('u', state.inputUnitId)
      const fStr = encodeFactorOverrides(state.factorOverrides)
      if (fStr) params.set('f', fStr)

      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState(null, '', newUrl)
    }, 300)
  }, [])

  useEffect(() => {
    syncToUrl({ inputValue, inputUnitId, factorOverrides })
  }, [inputValue, inputUnitId, factorOverrides, syncToUrl])

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
    factorOverrides,
    handleFactorChange,
  }
}
