import { useRef, useEffect, useMemo } from 'react'
import * as d3 from 'd3'

/**
 * D3-powered SVG emoji grid visualization.
 *
 * Renders a grid of emojis representing the output quantity.
 * Uses D3 for layout calculation and SVG text elements for emojis.
 * The grid fills the available width and grows vertically (scrollable).
 */

interface EmojiGridProps {
  emoji: string
  count: number
  /** Unique key to trigger re-render on formula change */
  formulaKey: string
}

/** Size of each emoji cell in pixels */
const CELL_SIZE = 36
/** Padding between cells */
const CELL_PAD = 4
/** Total cell pitch */
const PITCH = CELL_SIZE + CELL_PAD

export function EmojiGrid({ emoji, count, formulaKey }: EmojiGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Compute grid dimensions
  const layout = useMemo(() => {
    // Assume a reasonable width; will be adjusted on mount
    const width = 800
    const cols = Math.max(1, Math.floor(width / PITCH))
    const rows = Math.ceil(count / cols)
    const height = rows * PITCH + CELL_PAD
    return { cols, rows, height, width }
  }, [count])

  useEffect(() => {
    const container = containerRef.current
    const svg = svgRef.current
    if (!container || !svg) return

    const containerWidth = container.clientWidth
    const cols = Math.max(1, Math.floor(containerWidth / PITCH))
    const rows = Math.ceil(count / cols)
    const svgHeight = rows * PITCH + CELL_PAD
    const svgWidth = cols * PITCH + CELL_PAD

    const svgSel = d3.select(svg)
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)

    // Generate data array for D3
    const data = d3.range(count).map(i => ({
      i,
      x: (i % cols) * PITCH + PITCH / 2,
      y: Math.floor(i / cols) * PITCH + PITCH / 2,
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
      .attr('font-size', `${CELL_SIZE * 0.75}px`)
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
      .text(emoji)

    // Exit
    texts.exit().remove()

  }, [emoji, count, formulaKey])

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
