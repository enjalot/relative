import { useState, useMemo, useCallback } from 'react'
import { InputPanel } from './components/InputPanel'
import { ConversionCards } from './components/ConversionCards'
import { ConversionExplorer } from './components/ConversionExplorer'
import { buildAllConversions } from './engine/converter'
import { useUrlState } from './hooks/useUrlState'
import './App.css'

type Tab = 'converter' | 'explorer'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('converter')

  const {
    inputValue,
    setInputValue,
    inputUnitId,
    setInputUnitId,
    factorOverrides,
    handleFactorChange,
  } = useUrlState({ inputValue: 1, inputUnitId: 'GW' })

  // Track per-conversion entry overrides (conversionId -> entryId)
  const [entryOverrides, setEntryOverrides] = useState<Record<string, string>>({})

  const handleEntryChange = useCallback((conversionId: string, entryId: string) => {
    setEntryOverrides(prev => ({ ...prev, [conversionId]: entryId }))
  }, [])

  const sentences = useMemo(
    () => buildAllConversions(inputValue, inputUnitId, factorOverrides, entryOverrides),
    [inputValue, inputUnitId, factorOverrides, entryOverrides],
  )

  return (
    <div className="app">
      <header className="app-header">
        <h1>Relative</h1>
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
                  setEntryOverrides({})
                }}
              />
            </div>

            {sentences.length > 0 ? (
              <ConversionCards
                sentences={sentences}
                inputNumber={inputValue}
                inputUnitId={inputUnitId}
                onInputNumberChange={setInputValue}
                onEntryChange={handleEntryChange}
                factorOverrides={factorOverrides}
                onFactorChange={handleFactorChange}
              />
            ) : (
              <div className="no-result">
                <p>Enter a quantity above to see comparisons.</p>
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
