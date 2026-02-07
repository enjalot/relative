import type { Unit } from '../types'

/**
 * All supported units, organized by dimension.
 * Each dimension has a base unit (toBase = 1).
 *
 * To add a new unit: add an entry here with the correct toBase multiplier.
 */
export const units: Unit[] = [
  // === POWER (base: watts) ===
  { id: 'mW',  name: 'milliwatts',  symbol: 'mW',  dimension: 'power', toBase: 0.001 },
  { id: 'W',   name: 'watts',       symbol: 'W',   dimension: 'power', toBase: 1 },
  { id: 'kW',  name: 'kilowatts',   symbol: 'kW',  dimension: 'power', toBase: 1_000 },
  { id: 'MW',  name: 'megawatts',   symbol: 'MW',  dimension: 'power', toBase: 1_000_000 },
  { id: 'GW',  name: 'gigawatts',   symbol: 'GW',  dimension: 'power', toBase: 1_000_000_000 },
  { id: 'TW',  name: 'terawatts',   symbol: 'TW',  dimension: 'power', toBase: 1_000_000_000_000 },

  // === ENERGY (base: watt-hours) ===
  { id: 'mWh', name: 'milliwatt-hours', symbol: 'mWh', dimension: 'energy', toBase: 0.001 },
  { id: 'Wh',  name: 'watt-hours',      symbol: 'Wh',  dimension: 'energy', toBase: 1 },
  { id: 'kWh', name: 'kilowatt-hours',   symbol: 'kWh', dimension: 'energy', toBase: 1_000 },
  { id: 'MWh', name: 'megawatt-hours',   symbol: 'MWh', dimension: 'energy', toBase: 1_000_000 },
  { id: 'GWh', name: 'gigawatt-hours',   symbol: 'GWh', dimension: 'energy', toBase: 1_000_000_000 },

  // === DISTANCE (base: meters) ===
  { id: 'm',   name: 'meters',     symbol: 'm',   dimension: 'distance', toBase: 1 },
  { id: 'km',  name: 'kilometers', symbol: 'km',  dimension: 'distance', toBase: 1_000 },
  { id: 'mi',  name: 'miles',      symbol: 'mi',  dimension: 'distance', toBase: 1_609.34 },

  // === TIME (base: seconds) ===
  { id: 's',   name: 'seconds', symbol: 's',   dimension: 'time', toBase: 1 },
  { id: 'min', name: 'minutes', symbol: 'min', dimension: 'time', toBase: 60 },
  { id: 'hr',  name: 'hours',   symbol: 'hr',  dimension: 'time', toBase: 3_600 },
  { id: 'day', name: 'days',    symbol: 'day', dimension: 'time', toBase: 86_400 },
  { id: 'yr',  name: 'years',   symbol: 'yr',  dimension: 'time', toBase: 31_557_600 },

  // === MASS (base: kilograms) ===
  { id: 'g',   name: 'grams',     symbol: 'g',   dimension: 'mass', toBase: 0.001 },
  { id: 'kg',  name: 'kilograms', symbol: 'kg',  dimension: 'mass', toBase: 1 },
  { id: 'ton', name: 'metric tons', symbol: 't', dimension: 'mass', toBase: 1_000 },

  // === CURRENCY (base: US dollars) ===
  { id: 'cent', name: 'cents',           symbol: '¢',   dimension: 'currency', toBase: 0.01 },
  { id: 'USD',  name: 'US dollars',      symbol: '$',   dimension: 'currency', toBase: 1 },
  { id: 'kUSD', name: 'thousand dollars', symbol: 'k$', dimension: 'currency', toBase: 1_000 },
  { id: 'MUSD', name: 'million dollars',  symbol: 'M$', dimension: 'currency', toBase: 1_000_000 },
  { id: 'BUSD', name: 'billion dollars',  symbol: 'B$', dimension: 'currency', toBase: 1_000_000_000 },
]

/** Lookup a unit by ID. Throws if not found. */
export function getUnit(id: string): Unit {
  const unit = units.find(u => u.id === id)
  if (!unit) throw new Error(`Unknown unit: ${id}`)
  return unit
}

/** Get all units for a given dimension. */
export function getUnitsForDimension(dimension: string): Unit[] {
  return units.filter(u => u.dimension === dimension)
}

/** Convert a value from one unit to another within the same dimension. */
export function convertWithinDimension(value: number, fromUnit: Unit, toUnit: Unit): number {
  if (fromUnit.dimension !== toUnit.dimension) {
    throw new Error(`Cannot directly convert ${fromUnit.dimension} to ${toUnit.dimension}`)
  }
  const baseValue = value * fromUnit.toBase
  return baseValue / toUnit.toBase
}
