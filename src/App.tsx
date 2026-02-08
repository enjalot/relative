import { useState, useMemo } from 'react'
import { InputPanel } from './components/InputPanel'
import { OutputSelector } from './components/OutputSelector'
import { FormulaDisplay } from './components/FormulaDisplay'
import { EmojiGrid } from './components/EmojiGrid'
import { ConversionExplorer } from './components/ConversionExplorer'
import { buildFormula } from './engine/converter'
import { useUrlState } from './hooks/useUrlState'
import './App.css'

type Tab = 'converter' | 'explorer'

/**
 * Main application component.
 *
 * State is synced to/from URL search params so users can share links.
 * The formula is recomputed on every state change.
 */
function App() {
  const [activeTab, setActiveTab] = useState<Tab>('converter')

  const {
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
  } = useUrlState({ inputValue: 1, inputUnitId: 'GW' })

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

      <nav className="app-tabs">
        <button
          className={`tab-btn ${activeTab === 'converter' ? 'active' : ''}`}
          onClick={() => setActiveTab('converter')}
        >
          Converter
        </button>
        <button
          className={`tab-btn ${activeTab === 'explorer' ? 'active' : ''}`}
          onClick={() => setActiveTab('explorer')}
        >
          Explore quantities
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'converter' && (
          <>
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
          </>
        )}

        {activeTab === 'explorer' && <ConversionExplorer />}
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
