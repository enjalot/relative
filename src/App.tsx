import { useState, useMemo } from 'react'
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
 *
 * The formula is recomputed on every state change.
 */
function App() {
  const [inputValue, setInputValue] = useState<number>(1)
  const [inputUnitId, setInputUnitId] = useState<string>('GW')
  const [targetEntryId, setTargetEntryId] = useState<string | undefined>()
  const [targetConversionId, setTargetConversionId] = useState<string | undefined>()
  const [factorOverrides, setFactorOverrides] = useState<Record<string, number>>({})

  const handleFactorChange = (ruleId: string, newFactor: number | undefined) => {
    setFactorOverrides(prev => {
      const next = { ...prev }
      if (newFactor === undefined) {
        delete next[ruleId]
      } else {
        next[ruleId] = newFactor
      }
      return next
    })
  }

  const formula = useMemo(
    () => buildFormula(inputValue, inputUnitId, targetEntryId, targetConversionId, factorOverrides),
    [inputValue, inputUnitId, targetEntryId, targetConversionId, factorOverrides],
  )

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
              factorOverrides={factorOverrides}
              onFactorChange={handleFactorChange}
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
