import { useRef, useEffect, useMemo, useState } from 'react'
import * as d3 from 'd3'

/**
 * D3-powered SVG emoji grid visualization.
 *
 * Renders a grid of emojis representing the output quantity.
 * Uses D3 for layout calculation and SVG text elements for emojis.
 * The grid fills the available width and grows vertically.
 * Cell size adapts to screen width for mobile.
 */

interface EmojiGridProps {
  emoji: string
  count: number
  /** Unique key to trigger re-render on formula change */
  formulaKey: string
}

/** Padding between cells */
const CELL_PAD = 4

function getCellSize(containerWidth: number): number {
  if (containerWidth <= 380) return 24
  if (containerWidth <= 600) return 28
  return 36
}

export function EmojiGrid({ emoji, count, formulaKey }: EmojiGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [containerWidth, setContainerWidth] = useState(800)

  // Track container width for responsive cell sizing
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateWidth = () => setContainerWidth(container.clientWidth)
    updateWidth()

    const ro = new ResizeObserver(updateWidth)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  const cellSize = getCellSize(containerWidth)
  const pitch = cellSize + CELL_PAD

  // Compute grid dimensions
  const layout = useMemo(() => {
    const cols = Math.max(1, Math.floor(containerWidth / pitch))
    const rows = Math.ceil(count / cols)
    const height = rows * pitch + CELL_PAD
    const width = cols * pitch + CELL_PAD
    return { cols, rows, height, width }
  }, [count, containerWidth, pitch])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const cols = layout.cols
    const svgHeight = layout.height
    const svgWidth = layout.width

    const svgSel = d3.select(svg)
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)

    // Generate data array for D3
    const data = d3.range(count).map(i => ({
      i,
      x: (i % cols) * pitch + pitch / 2,
      y: Math.floor(i / cols) * pitch + pitch / 2,
    }))

    // Bind data
    const texts = svgSel.selectAll<SVGTextElement, typeof data[0]>('text')
      .data(data, d => d.i)

    // Enter
    texts.enter()
      .append('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', `${cellSize * 0.75}px`)
      .text(emoji)
      .attr('opacity', 0)
      .transition()
      .duration(300)
      .delay((_d, i) => Math.min(i * 0.5, 500))
      .attr('opacity', 1)

    // Update
    texts
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('font-size', `${cellSize * 0.75}px`)
      .text(emoji)

    // Exit
    texts.exit().remove()

  }, [emoji, count, formulaKey, layout, pitch, cellSize])

  return (
    <div className="emoji-grid" ref={containerRef}>
      <svg
        ref={svgRef}
        width={layout.width}
        height={layout.height}
        className="emoji-svg"
      />
    </div>
  )
}
