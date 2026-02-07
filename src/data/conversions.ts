import type { ConversionRule } from '../types'

/**
 * Cross-dimension conversion rules.
 *
 * Each rule converts from one dimension's base unit to another's.
 * For example, the Tesla efficiency rule converts watt-hours to meters.
 *
 * Base units reminder:
 * - power: watts (W)
 * - energy: watt-hours (Wh)
 * - distance: meters (m)
 * - currency: US dollars ($)
 * - time: seconds (s)
 * - mass: kilograms (kg)
 *
 * To add a conversion: define the factor that converts 1 base unit of
 * fromDimension into base units of toDimension.
 */
export const conversionRules: ConversionRule[] = [
  // === Power ↔ Energy ===
  // Power (W) × time (s) = Energy (Ws). But our energy base is Wh, so:
  // 1 W for 1 hour = 1 Wh → factor is 1 (with time=1hr implicit)
  // We handle power↔energy specially: user picks a time duration.
  // For the default, we use "per hour" to make power→energy easy.
  {
    id: 'power-to-energy-per-hour',
    name: 'Power to energy (per hour)',
    fromDimension: 'power',
    toDimension: 'energy',
    factor: 1, // 1 watt for 1 hour = 1 watt-hour
    description: 'Running at X watts for 1 hour uses X watt-hours.',
    bidirectional: true,
  },
  {
    id: 'power-to-energy-per-day',
    name: 'Power to energy (per day)',
    fromDimension: 'power',
    toDimension: 'energy',
    factor: 24, // 1 watt for 24 hours = 24 watt-hours
    description: 'Running at X watts for 1 day uses 24·X watt-hours.',
    bidirectional: true,
  },
  {
    id: 'power-to-energy-per-year',
    name: 'Power to energy (per year)',
    fromDimension: 'power',
    toDimension: 'energy',
    factor: 8766, // 1 watt for 1 year ≈ 8,766 watt-hours (365.25 days)
    description: 'Running at X watts for 1 year uses ~8,766·X watt-hours.',
    bidirectional: true,
  },

  // === Energy → Distance (via EV efficiency) ===
  {
    id: 'energy-to-distance-tesla',
    name: 'Tesla Model 3 driving',
    fromDimension: 'energy',
    toDimension: 'distance',
    // Tesla Model 3 efficiency: ~150 Wh/km (or ~241 Wh/mile)
    // 1 Wh = 1/150 km = 6.667 meters
    factor: 1000 / 150, // ≈ 6.667 meters per Wh
    description: 'A Tesla Model 3 uses about 150 Wh/km. So 1 Wh drives about 6.7 meters.',
    bidirectional: true,
  },

  // === Energy → Currency (electricity pricing) ===
  {
    id: 'energy-to-currency-residential',
    name: 'US residential electricity price',
    fromDimension: 'energy',
    toDimension: 'currency',
    // US average residential: ~$0.16/kWh = $0.00016/Wh
    factor: 0.00016,
    description: 'US average residential electricity costs ~$0.16/kWh (EIA 2024). So 1 Wh costs $0.00016.',
    bidirectional: true,
  },
  {
    id: 'energy-to-currency-commercial',
    name: 'US commercial electricity price',
    fromDimension: 'energy',
    toDimension: 'currency',
    // US average commercial: ~$0.13/kWh = $0.00013/Wh
    factor: 0.00013,
    description: 'US average commercial electricity costs ~$0.13/kWh (EIA 2024). So 1 Wh costs $0.00013.',
    bidirectional: true,
  },
  {
    id: 'energy-to-currency-industrial',
    name: 'US industrial electricity price',
    fromDimension: 'energy',
    toDimension: 'currency',
    // US average industrial: ~$0.08/kWh = $0.00008/Wh
    factor: 0.00008,
    description: 'US average industrial electricity costs ~$0.08/kWh (EIA 2024). So 1 Wh costs $0.00008.',
    bidirectional: true,
  },

  // === Energy → Mass (aluminum smelting) ===
  {
    id: 'energy-to-mass-aluminum',
    name: 'Aluminum smelting',
    fromDimension: 'energy',
    toDimension: 'mass',
    // 15 kWh per kg = 15,000 Wh per kg → 1 Wh = 1/15000 kg
    factor: 1 / 15000,
    description: 'Producing aluminum requires ~15 kWh per kg. So 1 Wh produces ~0.067 g of aluminum.',
    bidirectional: true,
  },
]
