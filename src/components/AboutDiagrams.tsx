import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { conversionRules } from '../data/conversions'
import { units } from '../data/units'
import { quantities } from '../data/quantities'

/* ============================================
   Shared helpers
   ============================================ */

const DIMENSION_COLORS: Record<string, string> = {
  power: '#e74c3c',
  energy: '#f39c12',
  distance: '#27ae60',
  mass: '#8e44ad',
  money: '#2ecc71',
  time: '#3498db',
}

const DIMENSION_EMOJI: Record<string, string> = {
  power: '\u26A1',
  energy: '\uD83D\uDD0B',
  distance: '\uD83D\uDCCF',
  mass: '\u2696\uFE0F',
  money: '\uD83D\uDCB5',
  time: '\u23F0',
}

const DIMENSION_BASE_UNITS: Record<string, string> = {
  power: 'watts (W)',
  energy: 'watt-hours (Wh)',
  distance: 'meters (m)',
  mass: 'kilograms (kg)',
  money: 'US dollars ($)',
  time: 'seconds (s)',
}

/* ============================================
   Custom node components
   ============================================ */

function DimensionNode({ data }: { data: { label: string; dimension: string; unitCount: number; entryCount: number } }) {
  const color = DIMENSION_COLORS[data.dimension] || '#999'
  const emoji = DIMENSION_EMOJI[data.dimension] || ''
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 8,
        border: `2px solid ${color}`,
        background: `${color}11`,
        minWidth: 140,
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
      <Handle type="target" position={Position.Left} style={{ background: color }} />
      <Handle type="source" position={Position.Right} style={{ background: color }} />
      <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontWeight: 700, fontSize: 14, color }}>{data.label}</div>
      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
        {data.unitCount} units &middot; {data.entryCount} quantities
      </div>
    </div>
  )
}

function AlgorithmStepNode({ data }: { data: { label: string; detail: string; color: string; icon: string } }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        border: `2px solid ${data.color}`,
        background: `${data.color}11`,
        minWidth: 180,
        maxWidth: 220,
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: data.color }} />
      <Handle type="source" position={Position.Bottom} style={{ background: data.color }} />
      <div style={{ fontSize: 18, marginBottom: 2 }}>{data.icon}</div>
      <div style={{ fontWeight: 700, fontSize: 13, color: data.color }}>{data.label}</div>
      <div style={{ fontSize: 11, color: '#555', marginTop: 3, lineHeight: 1.4 }}>{data.detail}</div>
    </div>
  )
}

function DecisionNode({ data }: { data: { label: string; detail: string } }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        border: '2px solid #e67e22',
        background: '#e67e2211',
        minWidth: 180,
        maxWidth: 220,
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transform: 'rotate(0deg)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#e67e22' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#e67e22' }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: '#e67e22' }} />
      <Handle type="source" position={Position.Left} id="left" style={{ background: '#e67e22' }} />
      <div style={{ fontSize: 18, marginBottom: 2 }}>{'\u2753'}</div>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#e67e22' }}>{data.label}</div>
      <div style={{ fontSize: 11, color: '#555', marginTop: 3, lineHeight: 1.4 }}>{data.detail}</div>
    </div>
  )
}

const dimensionNodeTypes: NodeTypes = {
  dimension: DimensionNode,
}

const algorithmNodeTypes: NodeTypes = {
  step: AlgorithmStepNode,
  decision: DecisionNode,
}

/* ============================================
   1. Crossover Diagram
   ============================================ */

function buildCrossoverGraph() {
  // Find which dimensions actually have data
  const activeDimensions = new Set<string>()
  for (const u of units) activeDimensions.add(u.dimension)

  // Count units and entries per dimension
  const unitCounts: Record<string, number> = {}
  const entryCounts: Record<string, number> = {}
  for (const u of units) unitCounts[u.dimension] = (unitCounts[u.dimension] || 0) + 1
  for (const q of quantities) {
    const u = units.find(u => u.id === q.unitId)
    if (u) entryCounts[u.dimension] = (entryCounts[u.dimension] || 0) + 1
  }

  const dimensionLabels: Record<string, string> = {
    power: 'Power',
    energy: 'Energy',
    distance: 'Distance',
    mass: 'Mass',
    money: 'Money',
    time: 'Time',
  }

  // Layout: energy at center, power above, others around
  const positions: Record<string, { x: number; y: number }> = {
    power:    { x: 250, y: 0 },
    energy:   { x: 250, y: 160 },
    distance: { x: 500, y: 300 },
    mass:     { x: 0,   y: 300 },
    money:    { x: 500, y: 100 },
    time:     { x: 0,   y: 100 },
  }

  const nodes: Node[] = []
  for (const dim of activeDimensions) {
    if (!positions[dim]) continue
    nodes.push({
      id: dim,
      type: 'dimension',
      position: positions[dim],
      data: {
        label: dimensionLabels[dim] || dim,
        dimension: dim,
        unitCount: unitCounts[dim] || 0,
        entryCount: entryCounts[dim] || 0,
      },
      draggable: true,
    })
  }

  const edges: Edge[] = []

  // Add conversion rule edges
  for (const rule of conversionRules) {
    const edgeColor = DIMENSION_COLORS[rule.toDimension] || '#999'
    edges.push({
      id: rule.id,
      source: rule.fromDimension,
      target: rule.toDimension,
      label: rule.name,
      animated: true,
      style: { stroke: edgeColor, strokeWidth: 2 },
      labelStyle: { fontSize: 11, fontWeight: 600, fill: '#444' },
      labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
      labelBgPadding: [6, 3] as [number, number],
      markerEnd: rule.bidirectional ? undefined : { type: MarkerType.ArrowClosed, color: edgeColor },
    })

    if (rule.bidirectional) {
      edges.push({
        id: `${rule.id}-reverse`,
        source: rule.toDimension,
        target: rule.fromDimension,
        label: `${rule.name} (reverse)`,
        animated: true,
        style: { stroke: edgeColor, strokeWidth: 2, strokeDasharray: '6 3' },
        labelStyle: { fontSize: 10, fontWeight: 500, fill: '#888' },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
        labelBgPadding: [6, 3] as [number, number],
      })
    }
  }

  // "Direct" self-loop indicator — we'll note this in the description instead

  return { nodes, edges }
}

export function CrossoverDiagram() {
  const { nodes, edges } = useMemo(() => buildCrossoverGraph(), [])

  const onInit = useCallback(() => {}, [])

  return (
    <div className="about-diagram-container">
      <h3>Dimension Crossover Map</h3>
      <p className="about-diagram-desc">
        Each node is a <strong>dimension</strong> (a type of physical quantity). Solid arrows show
        conversion rules that bridge dimensions. Dashed arrows show the reverse direction (all current
        rules are bidirectional). Quantities within the same dimension are always directly comparable.
      </p>
      <p className="about-diagram-desc">
        <strong>Energy</strong> is the central hub &mdash; it connects to distance (via EV driving efficiency),
        mass (via aluminum smelting energy), money (via electricity cost), and power (via running time).
        To add a new crossover, define a <code>ConversionRule</code> in <code>src/data/conversions.ts</code>.
      </p>
      <div style={{ height: 460, border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={dimensionNodeTypes}
          onInit={onInit}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.5}
          maxZoom={1.5}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} color="#f0f0f0" />
        </ReactFlow>
      </div>
    </div>
  )
}

/* ============================================
   2. Algorithm / Display Rules Diagram
   ============================================ */

function buildAlgorithmGraph() {
  const nodes: Node[] = [
    {
      id: 'input',
      type: 'step',
      position: { x: 200, y: 0 },
      data: {
        label: '1. Parse Input',
        detail: 'User enters a number and selects a unit (e.g. "1.5 kW")',
        color: '#3498db',
        icon: '\u270D\uFE0F',
      },
    },
    {
      id: 'to-base',
      type: 'step',
      position: { x: 200, y: 110 },
      data: {
        label: '2. Convert to Base',
        detail: 'Multiply by unit\'s toBase factor. e.g. 1.5 kW \u00D7 1000 = 1500 W',
        color: '#3498db',
        icon: '\uD83D\uDD22',
      },
    },
    {
      id: 'find-direct',
      type: 'step',
      position: { x: 60, y: 230 },
      data: {
        label: '3a. Direct Candidates',
        detail: 'Find all quantities in the same dimension. rawCount = inputBase / entryBase',
        color: '#27ae60',
        icon: '\uD83C\uDFAF',
      },
    },
    {
      id: 'find-hop',
      type: 'step',
      position: { x: 340, y: 230 },
      data: {
        label: '3b. One-Hop Candidates',
        detail: 'Apply each ConversionRule to reach other dimensions. convertedValue = inputBase \u00D7 factor',
        color: '#8e44ad',
        icon: '\uD83D\uDD00',
      },
    },
    {
      id: 'group',
      type: 'step',
      position: { x: 200, y: 360 },
      data: {
        label: '4. Group by Path',
        detail: 'Group candidates by conversion path: "direct" or by rule ID. Each group produces one card.',
        color: '#e67e22',
        icon: '\uD83D\uDCE6',
      },
    },
    {
      id: 'is-duration',
      type: 'decision',
      position: { x: 200, y: 480 },
      data: {
        label: 'Duration-based?',
        detail: 'Does the conversion rule have durationBased: true?',
      },
    },
    {
      id: 'score-duration',
      type: 'step',
      position: { x: 420, y: 590 },
      data: {
        label: '5a. Score Duration',
        detail: 'Prefer durations near 10 hrs. Filter: 1 min \u2013 100 yrs. Score = 5 - |log\u2081\u2080(hrs) - 1| \u00D7 1.5',
        color: '#e74c3c',
        icon: '\u23F1\uFE0F',
      },
    },
    {
      id: 'score-count',
      type: 'step',
      position: { x: -10, y: 590 },
      data: {
        label: '5b. Score Count',
        detail: 'Filter rawCount \u2265 0.1. Use "biggest match under" \u2014 pick largest entry fitting inside the input (count \u2265 1).',
        color: '#2ecc71',
        icon: '\uD83C\uDFC6',
      },
    },
    {
      id: 'display',
      type: 'step',
      position: { x: 200, y: 720 },
      data: {
        label: '6. Display Card',
        detail: 'Render sentence and dropdown of alternatives. User can override the chosen entry.',
        color: '#1abc9c',
        icon: '\uD83C\uDFC1',
      },
    },
  ]

  const edges: Edge[] = [
    { id: 'e-input-base', source: 'input', target: 'to-base', style: { stroke: '#3498db', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3498db' } },
    { id: 'e-base-direct', source: 'to-base', target: 'find-direct', style: { stroke: '#27ae60', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#27ae60' } },
    { id: 'e-base-hop', source: 'to-base', target: 'find-hop', style: { stroke: '#8e44ad', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#8e44ad' } },
    { id: 'e-direct-group', source: 'find-direct', target: 'group', style: { stroke: '#e67e22', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#e67e22' } },
    { id: 'e-hop-group', source: 'find-hop', target: 'group', style: { stroke: '#e67e22', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#e67e22' } },
    { id: 'e-group-decision', source: 'group', target: 'is-duration', style: { stroke: '#e67e22', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#e67e22' } },
    { id: 'e-decision-duration', source: 'is-duration', sourceHandle: 'right', target: 'score-duration', label: 'Yes', labelStyle: { fontSize: 11, fill: '#e74c3c' }, style: { stroke: '#e74c3c', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#e74c3c' } },
    { id: 'e-decision-count', source: 'is-duration', sourceHandle: 'left', target: 'score-count', label: 'No', labelStyle: { fontSize: 11, fill: '#2ecc71' }, style: { stroke: '#2ecc71', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2ecc71' } },
    { id: 'e-duration-display', source: 'score-duration', target: 'display', style: { stroke: '#1abc9c', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#1abc9c' } },
    { id: 'e-count-display', source: 'score-count', target: 'display', style: { stroke: '#1abc9c', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#1abc9c' } },
  ]

  return { nodes, edges }
}

export function AlgorithmDiagram() {
  const { nodes, edges } = useMemo(() => buildAlgorithmGraph(), [])

  const onInit = useCallback(() => {}, [])

  return (
    <div className="about-diagram-container">
      <h3>Algorithm Flow: How Conversions Are Built</h3>
      <p className="about-diagram-desc">
        This diagram shows how an input value becomes the conversion cards you see. The algorithm
        finds all reachable quantities, scores them for visual clarity, and picks the best match
        for each conversion path.
      </p>
      <div style={{ height: 700, border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={algorithmNodeTypes}
          onInit={onInit}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.4}
          maxZoom={1.5}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} color="#f0f0f0" />
        </ReactFlow>
      </div>
    </div>
  )
}

/* ============================================
   3. Main About component
   ============================================ */

export function About() {
  const dimensionList = Object.entries(DIMENSION_BASE_UNITS)

  return (
    <div className="about-page">
      <h2>How Relative Works</h2>
      <p className="about-intro">
        Relative converts quantities into intuitive comparisons. Enter "1 GW" and see it expressed as
        cities, households, or Tesla driving distances. This page explains the system for users and
        contributors.
      </p>

      <section className="about-section">
        <h3>Core Concepts</h3>
        <dl className="about-definitions">
          <dt>Dimension</dt>
          <dd>A type of physical quantity: power, energy, distance, mass, money, or time. Each has a <strong>base unit</strong> used internally for all math.</dd>

          <dt>Unit</dt>
          <dd>A specific scale within a dimension. Defined in <code>src/data/units.ts</code> with a <code>toBase</code> multiplier. Example: 1 kW = 1000 W (base).</dd>

          <dt>Quantity Entry</dt>
          <dd>A real-world thing with a known value, emoji, and description. Defined in <code>src/data/quantities.ts</code>. Example: US household average = 1.2 kW.</dd>

          <dt>Conversion Rule</dt>
          <dd>A bridge between two dimensions. Defined in <code>src/data/conversions.ts</code>. Converts base units of one dimension to another via a factor. All current rules are bidirectional.</dd>
        </dl>
      </section>

      <section className="about-section">
        <h3>Dimensions &amp; Base Units</h3>
        <table className="about-table">
          <thead>
            <tr><th>Dimension</th><th>Base Unit</th><th>Example Units</th></tr>
          </thead>
          <tbody>
            {dimensionList.map(([dim, base]) => {
              const dimUnits = units.filter(u => u.dimension === dim)
              return (
                <tr key={dim}>
                  <td>{DIMENSION_EMOJI[dim]} <strong>{dim.charAt(0).toUpperCase() + dim.slice(1)}</strong></td>
                  <td><code>{base}</code></td>
                  <td>{dimUnits.map(u => u.symbol).join(', ')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="about-section">
        <CrossoverDiagram />
      </section>

      <section className="about-section">
        <h3>Conversion Rules Detail</h3>
        <table className="about-table">
          <thead>
            <tr><th>Rule</th><th>From</th><th>To</th><th>Factor</th><th>Meaning</th></tr>
          </thead>
          <tbody>
            {conversionRules.map(rule => (
              <tr key={rule.id}>
                <td><strong>{rule.name}</strong></td>
                <td>{rule.fromDimension}</td>
                <td>{rule.toDimension}</td>
                <td><code>{rule.factor}</code></td>
                <td>{rule.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="about-section">
        <AlgorithmDiagram />
      </section>

      <section className="about-section">
        <h3>Display Rules: When Conversions Are Shown or Hidden</h3>
        <ul className="about-rules-list">
          <li><strong>Input must be {'>'} 0.</strong> Zero or negative inputs produce no results.</li>
          <li><strong>Minimum count threshold: 0.1.</strong> If a quantity comparison yields rawCount {'<'} 0.1, it is filtered out to avoid scientific notation.</li>
          <li><strong>Duration bounds:</strong> For duration-based conversions (e.g. power/energy), durations must be between 1 minute and 100 years. Outside that range, the comparison is hidden.</li>
          <li><strong>One card per conversion path.</strong> Each rule (and "direct") produces at most one card showing the best-fit quantity, with a dropdown of alternatives.</li>
          <li><strong>"Biggest match under" selection.</strong> Among quantities where count {'\u2265'} 1, the algorithm picks the largest (closest to 1 emoji). This gives "1.1 small cities" rather than "1,000 households."</li>
          <li><strong>User overrides.</strong> If you select a different quantity from the dropdown, that choice is preserved until you change units.</li>
        </ul>
      </section>


      <section className="about-section">
        <h3>Contributing New Content</h3>
        <div className="about-contributing">
          <h4>Adding a new quantity entry</h4>
          <p>Edit <code>src/data/quantities.ts</code>. Each entry needs:</p>
          <ul>
            <li><code>id</code> &mdash; unique string identifier</li>
            <li><code>name</code> &mdash; human-readable label</li>
            <li><code>emoji</code> &mdash; a single emoji for visualization</li>
            <li><code>value</code> + <code>unitId</code> &mdash; the numeric value and which unit it's measured in</li>
            <li><code>description</code> &mdash; source/assumptions for the value</li>
          </ul>

          <h4>Adding a new unit</h4>
          <p>Edit <code>src/data/units.ts</code>. Define the <code>toBase</code> multiplier relative to the dimension's base unit.</p>

          <h4>Adding a new conversion rule (crossover)</h4>
          <p>Edit <code>src/data/conversions.ts</code>. Define the factor that converts 1 base unit of the source dimension into base units of the target dimension. Set <code>bidirectional: true</code> if the reverse conversion makes sense.</p>

          <h4>Adding a new dimension</h4>
          <p>Add the dimension type to <code>src/types/index.ts</code>, create units in <code>units.ts</code>,
          add quantity entries in <code>quantities.ts</code>, and optionally add conversion rules to link it to
          existing dimensions.</p>
        </div>
      </section>
    </div>
  )
}
