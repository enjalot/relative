/**
 * Core type definitions for the Relative Quantities visualizer.
 *
 * Key concepts:
 * - Dimension: A physical dimension (power, energy, distance, etc.)
 * - Unit: A specific measurement unit within a dimension (watts, kilowatts, etc.)
 * - QuantityEntry: A real-world thing with a known quantity (a house uses 1.2 kW)
 * - ConversionRule: A cross-dimension conversion (energy → distance via Tesla efficiency)
 */

/** Physical dimensions we track. Power and energy are separate: power = energy/time. */
export type Dimension =
  | 'power'      // watts (instantaneous rate)
  | 'energy'     // watt-hours (cumulative over time)
  | 'distance'   // meters
  | 'currency'   // US dollars
  | 'temperature'// degrees celsius (for heat conversions)
  | 'compute'    // FLOPS (floating point operations per second)
  | 'mass'       // kilograms
  | 'time'       // seconds

/**
 * A unit of measurement. All units within a dimension share a base unit,
 * and `toBase` converts a value in this unit to the base unit.
 *
 * Base units by dimension:
 * - power: watts (W)
 * - energy: watt-hours (Wh)
 * - distance: meters (m)
 * - currency: US dollars ($)
 * - temperature: degrees celsius (°C)
 * - compute: FLOPS
 * - mass: kilograms (kg)
 * - time: seconds (s)
 */
export interface Unit {
  id: string
  name: string
  symbol: string
  dimension: Dimension
  /** Multiply a value in this unit by this factor to get the base unit value */
  toBase: number
}

/**
 * A real-world quantity with an emoji representation.
 * Examples: "US household average power consumption" = 1.2 kW 🏠
 */
export interface QuantityEntry {
  id: string
  name: string
  emoji: string
  /** The numeric value in the specified unit */
  value: number
  /** Reference to a Unit.id */
  unitId: string
  /** Human-readable description, including assumptions */
  description: string
  /** Optional category for grouping in the UI */
  category?: string
}

/**
 * A rule for converting between dimensions.
 * Example: "Tesla Model 3 efficiency" converts energy (Wh) to distance (m)
 * by dividing energy by 250 Wh/mile (factor = 1/250 * 1609.34 to get meters per Wh).
 *
 * Usage: output_base_value = input_base_value * factor
 */
export interface ConversionRule {
  id: string
  name: string
  fromDimension: Dimension
  toDimension: Dimension
  /** Multiply base-unit value of fromDimension by this to get base-unit value of toDimension */
  factor: number
  description: string
  /** Is this conversion bidirectional? (most are) */
  bidirectional: boolean
}

/**
 * The result of the formula-building algorithm.
 * Represents a chain: input → (optional hop) → output quantity × count
 */
export interface FormulaResult {
  /** The input value in base units */
  inputBaseValue: number
  /** The input unit used */
  inputUnit: Unit
  /** The raw input number the user typed */
  inputNumber: number
  /** Conversion steps taken */
  steps: ConversionStep[]
  /** The output quantity entry chosen */
  outputEntry: QuantityEntry
  /** How many of the output entry's emoji to show */
  emojiCount: number
  /** What one emoji represents (in the output entry's unit) */
  emojiScale: number
  /** Human-readable label for what one emoji represents */
  emojiLabel: string
  /** The output unit */
  outputUnit: Unit
}

export interface ConversionStep {
  rule: ConversionRule
  /** The intermediate value after this step (in base units of the target dimension) */
  intermediateValue: number
  description: string
}
