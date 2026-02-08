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
 * - time: seconds (s)
 * - mass: kilograms (kg)
 * - money: US dollars ($)
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
    id: 'power-energy-duration',
    name: 'Running time',
    fromDimension: 'power',
    toDimension: 'energy',
    factor: 1, // 1 watt for 1 hour = 1 watt-hour (base relation)
    description: 'Energy = Power × Time. Duration is computed per appliance.',
    bidirectional: true,
    durationBased: true,
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

  // === Energy → Time (household consumption duration) ===
  {
    id: 'energy-to-time-household',
    name: 'US household consumption time',
    fromDimension: 'energy',
    toDimension: 'time',
    // At average US household draw of ~1.2 kW (1200 W):
    // 1 Wh / 1200 W = 1/1200 hours = 3600/1200 seconds = 3 seconds per Wh
    factor: 3600 / 1200, // 3 seconds per Wh
    description: 'At US average household draw (~1.2 kW), 1 Wh lasts 3 seconds.',
    bidirectional: true,
  },

  // === Energy → Money (electricity cost) ===
  {
    id: 'energy-to-money-electricity',
    name: 'US electricity cost',
    fromDimension: 'energy',
    toDimension: 'money',
    // Average US residential electricity rate: ~$0.16/kWh = $0.00016/Wh
    factor: 0.16 / 1000, // $0.00016 per Wh
    description: 'Average US residential electricity costs ~$0.16 per kWh.',
    bidirectional: true,
  },
]
