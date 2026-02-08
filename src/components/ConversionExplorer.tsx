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

/** Format a number for display on the axis */
function formatValue(v: number, unitSymbol: string): string {
  if (v >= 1e12) return `${(v / 1e12).toFixed(1)}T ${unitSymbol}`
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}G ${unitSymbol}`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M ${unitSymbol}`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k ${unitSymbol}`
  if (v >= 1) return `${v.toFixed(1)} ${unitSymbol}`
  if (v >= 0.001) return `${(v * 1000).toFixed(1)}m ${unitSymbol}`
  return `${v.toExponential(1)} ${unitSymbol}`
}

interface BarChartProps {
  items: (QuantityEntry & { baseValue: number })[]
  baseUnitSymbol: string
  scaleType: 'linear' | 'log'
}

function BarChart({ items, baseUnitSymbol, scaleType }: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const margin = { top: 20, right: 20, bottom: 80, left: 10 }

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || items.length === 0) return

    const containerWidth = containerRef.current.clientWidth
    const width = containerWidth - margin.left - margin.right
    const barWidth = Math.max(30, Math.min(60, width / items.length - 4))
    const chartWidth = Math.max(width, items.length * (barWidth + 4))
    const height = 260 - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg
      .attr('width', chartWidth + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // X scale: categorical (one bar per item)
    const x = d3.scaleBand()
      .domain(items.map(d => d.id))
      .range([0, chartWidth])
      .padding(0.15)

    // Y scale
    const minVal = d3.min(items, d => d.baseValue) || 1
    const maxVal = d3.max(items, d => d.baseValue) || 1

    const y = scaleType === 'log'
      ? d3.scaleLog()
          .domain([minVal * 0.5, maxVal * 2])
          .range([height, 0])
          .clamp(true)
      : d3.scaleLinear()
          .domain([0, maxVal * 1.1])
          .range([height, 0])

    // Bars
    g.selectAll('.bar')
      .data(items)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.id)!)
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.baseValue))
      .attr('height', d => height - y(d.baseValue))
      .attr('rx', 3)
      .attr('fill', '#6366f1')
      .attr('opacity', 0.8)

    // Value labels above bars
    g.selectAll('.bar-label')
      .data(items)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => x(d.id)! + x.bandwidth() / 2)
      .attr('y', d => y(d.baseValue) - 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#666')
      .text(d => formatValue(d.baseValue, baseUnitSymbol))

    // Emoji labels on x-axis
    g.selectAll('.emoji-label')
      .data(items)
      .enter()
      .append('text')
      .attr('x', d => x(d.id)! + x.bandwidth() / 2)
      .attr('y', height + 22)
      .attr('text-anchor', 'middle')
      .attr('font-size', '18px')
      .text(d => d.emoji)

    // Name labels below emoji (rotated for readability)
    g.selectAll('.name-label')
      .data(items)
      .enter()
      .append('text')
      .attr('transform', d => {
        const xPos = x(d.id)! + x.bandwidth() / 2
        return `translate(${xPos},${height + 40}) rotate(35)`
      })
      .attr('text-anchor', 'start')
      .attr('font-size', '10px')
      .attr('fill', '#888')
      .text(d => d.name.length > 18 ? d.name.slice(0, 16) + '...' : d.name)

  }, [items, scaleType, baseUnitSymbol, margin.top, margin.right, margin.bottom, margin.left])

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
