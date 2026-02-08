import type { Unit, QuantityEntry, FormulaResult, ConversionStep } from '../types'
import { units, getUnit } from '../data/units'
import { quantities } from '../data/quantities'
import { conversionRules } from '../data/conversions'

/**
 * The conversion engine: given an input (value + unit), finds the best
 * output quantity and builds a formula for visualization.
 *
 * The algorithm:
 * 1. Convert input to base units of its dimension
 * 2. Find all reachable quantities (same dimension = direct, different = 1-hop via ConversionRule)
 * 3. For each candidate, calculate how many emojis we'd need
 * 4. Pick candidates that give a nice emoji count (10–1000, preferring ~100–500)
 * 5. Choose appropriate scale so emoji count stays in range
 */

/** Map of unit IDs to Unit objects for fast lookup */
const unitMap = new Map<string, Unit>(units.map(u => [u.id, u]))

/** Get the dimension of a quantity entry */
function getDimension(entry: QuantityEntry): string {
  const unit = unitMap.get(entry.unitId)
  return unit ? unit.dimension : 'unknown'
}

/** Convert a quantity entry's value to its dimension's base unit */
function toBaseValue(entry: QuantityEntry): number {
  const unit = unitMap.get(entry.unitId)
  if (!unit) throw new Error(`Unknown unit ${entry.unitId}`)
  return entry.value * unit.toBase
}

/**
 * Candidate result from the formula search.
 */
interface Candidate {
  entry: QuantityEntry
  /** How many of this entry equals the input (in base units of the entry's dimension) */
  rawCount: number
  /** Conversion steps taken to reach this entry's dimension */
  steps: ConversionStep[]
  /** The total value in the output dimension's base units */
  outputBaseValue: number
}

/**
 * Find all candidate quantities reachable from the input dimension.
 * @param factorOverrides - Optional map of conversion rule ID → overridden factor
 */
function findCandidates(inputBaseValue: number, inputDimension: string, factorOverrides?: Record<string, number>): Candidate[] {
  const candidates: Candidate[] = []

  // Direct: same dimension
  for (const entry of quantities) {
    if (getDimension(entry) === inputDimension) {
      const entryBase = toBaseValue(entry)
      if (entryBase <= 0) continue
      candidates.push({
        entry,
        rawCount: inputBaseValue / entryBase,
        steps: [],
        outputBaseValue: inputBaseValue,
      })
    }
  }

  // 1-hop: via conversion rules
  for (const rule of conversionRules) {
    const factor = factorOverrides?.[rule.id] ?? rule.factor
    let convertedValue: number | null = null
    let targetDimension: string | null = null
    let step: ConversionStep

    if (rule.fromDimension === inputDimension) {
      convertedValue = inputBaseValue * factor
      targetDimension = rule.toDimension
      step = {
        rule,
        intermediateValue: convertedValue,
        description: `${rule.name}: × ${factor}`,
      }
    } else if (rule.bidirectional && rule.toDimension === inputDimension) {
      convertedValue = inputBaseValue / factor
      targetDimension = rule.fromDimension
      step = {
        rule,
        intermediateValue: convertedValue,
        description: `${rule.name} (reverse): ÷ ${factor}`,
      }
    } else {
      continue
    }

    if (convertedValue === null || targetDimension === null) continue

    for (const entry of quantities) {
      if (getDimension(entry) === targetDimension) {
        const entryBase = toBaseValue(entry)
        if (entryBase <= 0) continue
        candidates.push({
          entry,
          rawCount: convertedValue / entryBase,
          steps: [step!],
          outputBaseValue: convertedValue,
        })
      }
    }
  }

  return candidates
}

/**
 * Choose a nice metric scale for the emoji count.
 * Returns the number of "real units" one emoji represents.
 *
 * Target: emoji count between 10 and 1000, preferring powers of 10.
 */
function chooseEmojiScale(rawCount: number): { emojiCount: number; scale: number } {
  if (rawCount <= 0) return { emojiCount: 0, scale: 1 }
  if (rawCount <= 1000) return { emojiCount: Math.max(1, Math.round(rawCount)), scale: 1 }

  // Find the power of 10 that brings rawCount into 10-1000 range
  const log = Math.log10(rawCount)
  const power = Math.floor(log) - 2 // target ~100s
  const scale = Math.pow(10, Math.max(0, power))
  const emojiCount = Math.round(rawCount / scale)

  // If still too many, bump up the scale
  if (emojiCount > 1000) {
    const adjustedScale = scale * Math.ceil(emojiCount / 1000)
    return { emojiCount: Math.round(rawCount / adjustedScale), scale: adjustedScale }
  }

  return { emojiCount, scale }
}

/**
 * Score a candidate for quality of visualization.
 * Higher is better. Prefers emoji counts in the 50-500 range.
 */
function scoreCandidate(rawCount: number): number {
  if (rawCount <= 0) return -Infinity
  const { emojiCount } = chooseEmojiScale(rawCount)
  if (emojiCount < 1) return -Infinity

  // Sweet spot: 50-500 emojis
  const idealCount = 200
  const logDistance = Math.abs(Math.log10(emojiCount) - Math.log10(idealCount))

  // Penalize very small counts heavily, moderate penalty for very large
  let score = 10 - logDistance * 3
  if (emojiCount < 5) score -= 5
  if (rawCount < 1) score -= 3 // less than 1 of something is confusing

  return score
}

/**
 * Pick the best candidate using "biggest match under" algorithm.
 * Finds the largest quantity whose base value is <= the converted value,
 * yielding a count >= 1 (e.g. "1.1 small cities" rather than "0.001 large cities").
 */
function pickBestUnder(candidates: Candidate[]): Candidate | null {
  // Filter to candidates with rawCount >= 1 (the entry fits inside the value)
  const fitting = candidates.filter(c => c.rawCount >= 1)
  if (fitting.length === 0) {
    // Nothing fits — pick the one closest to 1 from above
    let best: Candidate | null = null
    let bestCount = Infinity
    for (const c of candidates) {
      if (c.rawCount > 0 && c.rawCount < bestCount) {
        bestCount = c.rawCount
        best = c
      }
    }
    return best
  }

  // Among fitting candidates, pick the one with count closest to 1 (i.e. largest entry value)
  // This gives us "1.1 small cities" instead of "1,000 households"
  let best: Candidate | null = null
  let bestCount = Infinity
  for (const c of fitting) {
    if (c.rawCount < bestCount) {
      bestCount = c.rawCount
      best = c
    }
  }
  return best
}

/**
 * A single conversion sentence result.
 */
export interface ConversionSentence {
  /** The conversion path identifier (e.g. 'direct', or a conversion rule id) */
  conversionId: string
  /** Human-readable name for this conversion type */
  conversionName: string
  /** The dimension of the output */
  outputDimension: string
  /** The chosen output entry */
  outputEntry: QuantityEntry
  /** How many of the output entry equals the input */
  count: number
  /** The output unit */
  outputUnit: Unit
  /** Conversion steps taken */
  steps: ConversionStep[]
  /** All candidate entries for this conversion path (for the dropdown) */
  alternatives: Array<{ entry: QuantityEntry; count: number; durationHours?: number }>
  /** The converted base value in the output dimension */
  outputBaseValue: number
  /** For power↔energy conversions: how long in hours to run/consume */
  durationHours?: number
}

/**
 * Compute duration in hours for a power↔energy conversion.
 * @param inputBaseValue - Input in base units (W or Wh)
 * @param inputDimension - 'power' or 'energy'
 * @param entryBaseValue - Output entry in base units (W or Wh)
 */
function computeDurationHours(
  inputBaseValue: number,
  inputDimension: string,
  entryBaseValue: number,
): number {
  if (inputDimension === 'energy') {
    // Energy input, power output: duration = energy(Wh) / power(W)
    return inputBaseValue / entryBaseValue
  } else {
    // Power input, energy output: duration = energy(Wh) / power(W)
    return entryBaseValue / inputBaseValue
  }
}

/**
 * Score a duration for how "readable" it is.
 * Prefers durations that produce nice numbers in natural time units.
 */
function scoreDuration(hours: number): number {
  if (hours <= 0) return -Infinity
  // Sweet spot: 1–100 hours
  const logHours = Math.log10(hours)
  const distance = Math.abs(logHours - 1) // distance from 10 hours
  let score = 5 - distance * 1.5
  // Penalize very small durations (< 1 minute)
  if (hours < 1 / 60) score -= 5
  // Penalize very large durations (> 100 years)
  if (hours > 876600) score -= 5
  return score
}

/** Minimum count threshold: skip conversions needing scientific notation */
const MIN_COUNT_THRESHOLD = 0.1

/**
 * Build one conversion sentence per conversion type.
 * Uses the "biggest match under" algorithm for selection.
 * Power↔energy conversions use duration-based sentences instead of count.
 */
export function buildAllConversions(
  inputNumber: number,
  inputUnitId: string,
  factorOverrides?: Record<string, number>,
  /** Optional map of conversionId -> selected entryId overrides */
  entryOverrides?: Record<string, string>,
): ConversionSentence[] {
  const inputUnit = getUnit(inputUnitId)
  const inputBaseValue = inputNumber * inputUnit.toBase

  if (inputBaseValue <= 0) return []

  const candidates = findCandidates(inputBaseValue, inputUnit.dimension, factorOverrides)

  // Group candidates by conversion path
  const groups = new Map<string, { name: string; dimension: string; steps: ConversionStep[]; candidates: Candidate[] }>()

  for (const c of candidates) {
    const convId = c.steps.length === 0 ? 'direct' : c.steps[0].rule.id
    const convName = c.steps.length === 0 ? getDimensionLabel(inputUnit.dimension) : c.steps[0].rule.name
    const dim = getDimension(c.entry)

    if (!groups.has(convId)) {
      groups.set(convId, { name: convName, dimension: dim, steps: c.steps, candidates: [] })
    }
    groups.get(convId)!.candidates.push(c)
  }

  const sentences: ConversionSentence[] = []

  // Put 'direct' first
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === 'direct') return -1
    if (b === 'direct') return 1
    return 0
  })

  for (const convId of sortedKeys) {
    const group = groups.get(convId)!
    const isDurationBased = group.candidates[0]?.steps[0]?.rule.durationBased === true

    // Check if user has overridden the entry for this conversion
    const overrideEntryId = entryOverrides?.[convId]
    let chosen: Candidate | null = null

    if (overrideEntryId) {
      chosen = group.candidates.find(c => c.entry.id === overrideEntryId) || null
    }

    if (!chosen) {
      if (isDurationBased) {
        // Pick best by duration quality
        let bestScore = -Infinity
        for (const c of group.candidates) {
          const entryBase = toBaseValue(c.entry)
          const duration = computeDurationHours(inputBaseValue, inputUnit.dimension, entryBase)
          const score = scoreDuration(duration)
          if (score > bestScore) {
            bestScore = score
            chosen = c
          }
        }
      } else {
        // Filter out very small counts before picking
        const filtered = group.candidates.filter(c => c.rawCount >= MIN_COUNT_THRESHOLD)
        // If no candidates pass the threshold, skip this group entirely
        if (filtered.length === 0) continue
        chosen = pickBestUnder(filtered)
      }
    }

    if (!chosen) continue

    const outputUnit = getUnit(chosen.entry.unitId)

    if (isDurationBased) {
      // Duration-based: compute duration for chosen and all alternatives
      const chosenBase = toBaseValue(chosen.entry)
      const chosenDuration = computeDurationHours(inputBaseValue, inputUnit.dimension, chosenBase)

      const alternatives = group.candidates
        .map(c => {
          const entryBase = toBaseValue(c.entry)
          const duration = computeDurationHours(inputBaseValue, inputUnit.dimension, entryBase)
          return { entry: c.entry, count: c.rawCount, durationHours: duration }
        })
        // Filter out very small or very large durations
        .filter(a => a.durationHours >= 1 / 60 && a.durationHours <= 876600)
        .sort((a, b) => {
          const aBase = toBaseValue(a.entry)
          const bBase = toBaseValue(b.entry)
          return bBase - aBase
        })

      sentences.push({
        conversionId: convId,
        conversionName: group.name,
        outputDimension: group.dimension,
        outputEntry: chosen.entry,
        count: chosen.rawCount,
        outputUnit,
        steps: chosen.steps,
        alternatives,
        outputBaseValue: chosen.outputBaseValue,
        durationHours: chosenDuration,
      })
    } else {
      // Standard count-based conversion
      const alternatives = group.candidates
        .filter(c => c.rawCount >= MIN_COUNT_THRESHOLD)
        .map(c => ({ entry: c.entry, count: c.rawCount }))
        .sort((a, b) => {
          const aBase = toBaseValue(a.entry)
          const bBase = toBaseValue(b.entry)
          return bBase - aBase
        })

      sentences.push({
        conversionId: convId,
        conversionName: group.name,
        outputDimension: group.dimension,
        outputEntry: chosen.entry,
        count: chosen.rawCount,
        outputUnit,
        steps: chosen.steps,
        alternatives,
        outputBaseValue: chosen.outputBaseValue,
      })
    }
  }

  return sentences
}

/** Get a human-friendly label for a dimension */
function getDimensionLabel(dim: string): string {
  const labels: Record<string, string> = {
    power: 'Power',
    energy: 'Energy',
    distance: 'Distance',
    mass: 'Mass',
    money: 'Money',
    time: 'Time',
    temperature: 'Temperature',
    compute: 'Compute',
  }
  return labels[dim] || dim
}

/**
 * Format the emoji label: what one emoji represents.
 * e.g., "1 🏠 = 1.2 kW" or "1 🗺️ = 4,500 km (1 cross-country US trip)"
 */
function formatEmojiLabel(entry: QuantityEntry, scale: number): string {
  const unit = unitMap.get(entry.unitId)!
  if (scale === 1) {
    return `1 ${entry.emoji} = ${formatNumber(entry.value)} ${unit.symbol} (${entry.name})`
  }
  const scaledValue = entry.value * scale
  const scaledUnit = chooseBestUnit(scaledValue * unit.toBase, unit.dimension)
  const displayValue = scaledValue * unit.toBase / scaledUnit.toBase
  return `1 ${entry.emoji} = ${formatNumber(displayValue)} ${scaledUnit.symbol} (${formatNumber(scale)} × ${entry.name})`
}

/**
 * Choose the best unit for displaying a value in base units.
 * Picks the unit where the display value is between 0.1 and 9999.
 */
function chooseBestUnit(baseValue: number, dimension: string): Unit {
  const dimUnits = units.filter(u => u.dimension === dimension).sort((a, b) => a.toBase - b.toBase)
  // Find the largest unit where the value is >= 1
  let best = dimUnits[0]
  for (const u of dimUnits) {
    const display = baseValue / u.toBase
    if (display >= 1) best = u
  }
  return best
}

/**
 * Format a duration in hours into a natural-language string.
 * Picks the most natural unit (minutes, hours, days, months, years).
 */
export function formatDuration(hours: number): string {
  if (hours < 1 / 60) {
    // Less than 1 minute: show seconds
    const seconds = hours * 3600
    return `${formatNumber(seconds)} seconds`
  }
  if (hours < 1) {
    const minutes = hours * 60
    return `${formatNumber(minutes)} minutes`
  }
  if (hours < 48) {
    return `${formatNumber(hours)} hours`
  }
  if (hours < 720) {
    // Up to ~30 days
    const days = hours / 24
    return `${formatNumber(days)} days`
  }
  if (hours < 8766) {
    // Up to ~1 year
    const months = hours / 730
    return `${formatNumber(months)} months`
  }
  const years = hours / 8766
  return `${formatNumber(years)} years`
}

/** Format a number with appropriate precision */
export function formatNumber(n: number): string {
  if (n === 0) return '0'
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString()
  if (Math.abs(n) >= 1000) return Math.round(n).toLocaleString()
  if (Math.abs(n) >= 100) return n.toFixed(1)
  if (Math.abs(n) >= 10) return n.toFixed(1)
  if (Math.abs(n) >= 1) return n.toFixed(2)
  if (Math.abs(n) >= 0.01) return n.toFixed(3)
  // Avoid scientific notation for very small values
  if (n > 0) return '< 0.01'
  if (n < 0) return '> -0.01'
  return n.toExponential(2)
}

/**
 * Main entry point: build a formula for visualizing the given input.
 *
 * @param inputNumber - The number the user typed
 * @param inputUnitId - The unit the user selected
 * @param targetEntryId - Optional: force a specific output quantity
 * @param targetConversionId - Optional: force a specific conversion rule
 * @returns FormulaResult or null if no valid conversion found
 */
export function buildFormula(
  inputNumber: number,
  inputUnitId: string,
  targetEntryId?: string,
  targetConversionId?: string,
  factorOverrides?: Record<string, number>,
): FormulaResult | null {
  const inputUnit = getUnit(inputUnitId)
  const inputBaseValue = inputNumber * inputUnit.toBase

  if (inputBaseValue <= 0) return null

  const candidates = findCandidates(inputBaseValue, inputUnit.dimension, factorOverrides)

  let chosen: Candidate | null = null

  if (targetEntryId) {
    // User selected a specific output quantity
    const filtered = candidates.filter(c => c.entry.id === targetEntryId)
    if (targetConversionId) {
      chosen = filtered.find(c =>
        c.steps.length === 0 ? targetConversionId === 'direct' : c.steps[0].rule.id === targetConversionId
      ) || filtered[0] || null
    } else {
      chosen = filtered[0] || null
    }
  }

  if (!chosen) {
    // Auto-select the best candidate
    let bestScore = -Infinity
    for (const c of candidates) {
      // Skip self-referential (same entry would give count of 1)
      if (c.rawCount === 1) continue
      const score = scoreCandidate(c.rawCount)
      if (score > bestScore) {
        bestScore = score
        chosen = c
      }
    }
  }

  if (!chosen) return null

  const { emojiCount, scale } = chooseEmojiScale(chosen.rawCount)
  const outputUnit = getUnit(chosen.entry.unitId)

  return {
    inputBaseValue,
    inputUnit,
    inputNumber,
    steps: chosen.steps,
    outputEntry: chosen.entry,
    emojiCount,
    emojiScale: scale,
    emojiLabel: formatEmojiLabel(chosen.entry, scale),
    outputUnit,
  }
}

/**
 * Get all valid output quantity IDs reachable from a given input unit.
 * Used to populate the output combobox.
 */
export function getReachableQuantities(inputUnitId: string): Array<{
  entry: QuantityEntry
  conversionId: string
  conversionName: string
}> {
  const inputUnit = getUnit(inputUnitId)
  const results: Array<{ entry: QuantityEntry; conversionId: string; conversionName: string }> = []

  // Direct (same dimension)
  for (const entry of quantities) {
    if (getDimension(entry) === inputUnit.dimension) {
      results.push({ entry, conversionId: 'direct', conversionName: 'Direct' })
    }
  }

  // Via conversion rules
  for (const rule of conversionRules) {
    let targetDimension: string | null = null
    if (rule.fromDimension === inputUnit.dimension) {
      targetDimension = rule.toDimension
    } else if (rule.bidirectional && rule.toDimension === inputUnit.dimension) {
      targetDimension = rule.fromDimension
    }
    if (!targetDimension) continue

    for (const entry of quantities) {
      if (getDimension(entry) === targetDimension) {
        results.push({ entry, conversionId: rule.id, conversionName: rule.name })
      }
    }
  }

  return results
}
