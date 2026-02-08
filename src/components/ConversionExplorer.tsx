import { useState, useRef, useEffect, useMemo } from 'react'
import * as d3 from 'd3'
import { quantities } from '../data/quantities'
import { units, getUnit } from '../data/units'
import type { Dimension, QuantityEntry } from '../types'

/**
 * Dimension metadata: human-readable label, description, and base unit info.
 */
const dimensionMeta: Record<string, { label: string; baseUnit: string; description: string }> = {
  power: {
    label: 'Power',
    baseUnit: 'W',
    description: 'Power is the rate of energy use — how fast energy flows. Measured in watts (W). A single watt is tiny (an LED indicator), while a gigawatt powers a city.',
  },
  energy: {
    label: 'Energy',
    baseUnit: 'Wh',
    description: 'Energy is the total amount of work done or stored. Measured in watt-hours (Wh). A phone charge is ~15 Wh; a Tesla battery holds 60,000 times more.',
  },
  distance: {
    label: 'Distance',
    baseUnit: 'm',
    description: 'Distances you can reach by converting energy into travel (e.g. via EV efficiency). From a city block to the Moon.',
  },
  money: {
    label: 'Money',
    baseUnit: '$',
    description: 'Dollar amounts from everyday purchases to national budgets. Spans over 12 orders of magnitude.',
  },
}

/** Which dimensions to show, in order */
const dimensionOrder: Dimension[] = ['power', 'energy', 'distance', 'money']

/** Get all quantities for a dimension, sorted by base value ascending */
function getQuantitiesForDimension(dim: string): (QuantityEntry & { baseValue: number })[] {
  const unitsMap = new Map(units.map(u => [u.id, u]))
  return quantities
    .filter(q => {
      const u = unitsMap.get(q.unitId)
      return u && u.dimension === dim
    })
    .map(q => {
      const u = getUnit(q.unitId)
      return { ...q, baseValue: q.value * u.toBase }
    })
    .sort((a, b) => a.baseValue - b.baseValue)
}

/** Format a number: no decimals if whole, otherwise 1 decimal. Unit touches number. */
function formatNum(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(1)
}

function formatValue(v: number, unitSymbol: string): string {
  if (v >= 1e12) return `${formatNum(v / 1e12)}T${unitSymbol}`
  if (v >= 1e9) return `${formatNum(v / 1e9)}G${unitSymbol}`
  if (v >= 1e6) return `${formatNum(v / 1e6)}M${unitSymbol}`
  if (v >= 1e3) return `${formatNum(v / 1e3)}k${unitSymbol}`
  if (v >= 1) return `${formatNum(v)}${unitSymbol}`
  if (v >= 0.001) return `${formatNum(v * 1000)}m${unitSymbol}`
  return `${v.toExponential(1)}${unitSymbol}`
}

interface BarChartProps {
  items: (QuantityEntry & { baseValue: number })[]
  baseUnitSymbol: string
  scaleType: 'linear' | 'log'
}

function BarChart({ items, baseUnitSymbol, scaleType }: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const emojiCol = 28
  const barLeft = 36
  const barHeight = 18
  const rowHeight = 38
  const margin = { top: 4, right: 60, bottom: 4, left: 0 }

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || items.length === 0) return

    const containerWidth = containerRef.current.clientWidth
    const chartWidth = containerWidth - margin.left - margin.right - barLeft
    const totalHeight = items.length * rowHeight

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg
      .attr('width', containerWidth)
      .attr('height', totalHeight + margin.top + margin.bottom)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Y scale: categorical (one row per item)
    const y = d3.scaleBand()
      .domain(items.map(d => d.id))
      .range([0, totalHeight])
      .padding(0.15)

    // X scale: bar length
    const minVal = d3.min(items, d => d.baseValue) || 1
    const maxVal = d3.max(items, d => d.baseValue) || 1

    const x = scaleType === 'log'
      ? d3.scaleLog()
          .domain([minVal * 0.5, maxVal * 2])
          .range([0, chartWidth])
          .clamp(true)
      : d3.scaleLinear()
          .domain([0, maxVal * 1.1])
          .range([0, chartWidth])

    // Emoji to the left
    g.selectAll('.emoji-label')
      .data(items)
      .enter()
      .append('text')
      .attr('x', emojiCol / 2)
      .attr('y', d => y(d.id)! + y.bandwidth() / 2 + 1)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '14px')
      .text(d => d.emoji)

    // Bars
    g.selectAll('.bar')
      .data(items)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', barLeft)
      .attr('y', d => y(d.id)! + (y.bandwidth() - barHeight) / 2)
      .attr('width', d => Math.max(2, x(d.baseValue)))
      .attr('height', barHeight)
      .attr('rx', 3)
      .attr('fill', '#6366f1')
      .attr('opacity', 0.8)

    // Value labels at end of bars
    g.selectAll('.bar-label')
      .data(items)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => barLeft + Math.max(2, x(d.baseValue)) + 5)
      .attr('y', d => y(d.id)! + (y.bandwidth() - barHeight) / 2 + barHeight / 2)
      .attr('dominant-baseline', 'central')
      .attr('font-size', '9px')
      .attr('fill', '#666')
      .text(d => formatValue(d.baseValue, baseUnitSymbol))

    // Name labels below bars (small, unobtrusive)
    g.selectAll('.name-label')
      .data(items)
      .enter()
      .append('text')
      .attr('x', barLeft)
      .attr('y', d => y(d.id)! + (y.bandwidth() - barHeight) / 2 + barHeight + 9)
      .attr('font-size', '8px')
      .attr('fill', '#aaa')
      .text(d => d.name.length > 30 ? d.name.slice(0, 28) + '…' : d.name)

  }, [items, scaleType, baseUnitSymbol])

  return (
    <div ref={containerRef} className="bar-chart-container">
      <svg ref={svgRef} />
    </div>
  )
}

export function ConversionExplorer() {
  const [scaleType, setScaleType] = useState<'linear' | 'log'>('log')

  const dimensionData = useMemo(() => {
    return dimensionOrder.map(dim => ({
      dimension: dim,
      meta: dimensionMeta[dim],
      items: getQuantitiesForDimension(dim),
    }))
  }, [])

  return (
    <div className="conversion-explorer">
      <div className="explorer-header">
        <div className="explorer-intro">
          <h2>What's in each category?</h2>
          <p>
            Real-world quantities span enormous ranges. A phone charger uses 0.5 watts;
            a city uses a billion. Toggle to <strong>log scale</strong> to see how these
            familiar things spread across orders of magnitude — each grid line is 10x the last.
          </p>
        </div>
        <div className="scale-toggle">
          <button
            className={`toggle-btn ${scaleType === 'linear' ? 'active' : ''}`}
            onClick={() => setScaleType('linear')}
          >
            Linear
          </button>
          <button
            className={`toggle-btn ${scaleType === 'log' ? 'active' : ''}`}
            onClick={() => setScaleType('log')}
          >
            Log (exponential)
          </button>
        </div>
      </div>

      {scaleType === 'linear' && (
        <p className="scale-hint">
          Notice how most bars vanish on a linear scale — the largest values dominate completely.
          This is why exponential/log scale is useful: it reveals the full range.
        </p>
      )}
      {scaleType === 'log' && (
        <p className="scale-hint">
          On a log scale, each step up is 10x larger. Equal-height differences mean equal
          ratios — helping you see the full exponential spread of real-world quantities.
        </p>
      )}

      {dimensionData.map(({ dimension, meta, items }) => (
        <div key={dimension} className="dimension-section">
          <h3>{meta.label}</h3>
          <p className="dimension-description">{meta.description}</p>
          {items.length > 0 ? (
            <BarChart
              items={items}
              baseUnitSymbol={meta.baseUnit}
              scaleType={scaleType}
            />
          ) : (
            <p className="no-items">No items in this category yet.</p>
          )}
        </div>
      ))}
    </div>
  )
}
