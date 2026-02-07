import { useState, useMemo, useCallback } from 'react'
import { InputPanel } from './components/InputPanel'
import { OutputSelector } from './components/OutputSelector'
import { FormulaDisplay } from './components/FormulaDisplay'
import { EmojiGrid } from './components/EmojiGrid'
import { buildFormula } from './engine/converter'
import './App.css'

/**
 * Main application component.
 *
 * State:
 * - inputValue / inputUnitId: what the user typed
 * - targetEntryId / targetConversionId: optional output selection
 * - factorOverrides: user-adjusted conversion factors (rule ID → custom factor)
 *
 * The formula is recomputed on every state change.
 */
function App() {
  const [inputValue, setInputValue] = useState<number>(1)
  const [inputUnitId, setInputUnitId] = useState<string>('GW')
  const [targetEntryId, setTargetEntryId] = useState<string | undefined>()
  const [targetConversionId, setTargetConversionId] = useState<string | undefined>()
  const [factorOverrides, setFactorOverrides] = useState<Record<string, number>>({})

  const formula = useMemo(
    () => buildFormula(inputValue, inputUnitId, targetEntryId, targetConversionId, factorOverrides),
    [inputValue, inputUnitId, targetEntryId, targetConversionId, factorOverrides],
  )

  const handleFactorChange = useCallback((ruleId: string, newFactor: number) => {
    setFactorOverrides(prev => {
      const next = { ...prev }
      // If the user resets to the default, remove the override
      // (we can't easily check here, but FormulaDisplay sends the default to reset)
      next[ruleId] = newFactor
      return next
    })
  }, [])

  const formulaKey = formula
    ? `${formula.outputEntry.id}-${formula.emojiCount}-${formula.emojiScale}`
    : 'none'

  return (
    <div className="app">
      <header className="app-header">
        <h1>&#9889; Relative</h1>
        <p className="app-subtitle">Understand quantities by comparison</p>
      </header>

      <main className="app-main">
        <div className="controls">
          <InputPanel
            value={inputValue}
            unitId={inputUnitId}
            onValueChange={setInputValue}
            onUnitChange={id => {
              setInputUnitId(id)
              setTargetEntryId(undefined)
              setTargetConversionId(undefined)
              setFactorOverrides({})
            }}
          />
          <OutputSelector
            inputUnitId={inputUnitId}
            selectedEntryId={targetEntryId}
            selectedConversionId={targetConversionId}
            onSelect={(entryId, convId) => {
              setTargetEntryId(entryId || undefined)
              setTargetConversionId(convId || undefined)
            }}
          />
        </div>

        {formula ? (
          <div className="visualization">
            <FormulaDisplay
              formula={formula}
              onFactorChange={handleFactorChange}
              factorOverrides={factorOverrides}
            />
            <EmojiGrid
              emoji={formula.outputEntry.emoji}
              count={formula.emojiCount}
              formulaKey={formulaKey}
            />
          </div>
        ) : (
          <div className="no-result">
            <p>Enter a quantity above to see it visualized.</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Values are estimates. See each item's description for assumptions.
        </p>
      </footer>
    </div>
  )
}

export default App
