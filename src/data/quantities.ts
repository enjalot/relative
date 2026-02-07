import type { QuantityEntry } from '../types'

/**
 * Database of real-world quantities with emoji representations.
 *
 * Organized by category, roughly from smallest to largest within each.
 * Each entry documents its assumptions in the description field.
 *
 * To add entries: add to the appropriate category section below.
 * Ensure the unitId matches an entry in units.ts.
 */
export const quantities: QuantityEntry[] = [

  // ============================================================
  // POWER — Small electronics
  // ============================================================
  {
    id: 'led-indicator',
    name: 'LED indicator light',
    emoji: '🔴',
    value: 20,
    unitId: 'mW',
    description: 'A small indicator LED draws about 20 mW (typical 2V × 10mA).',
    category: 'electronics',
  },
  {
    id: 'smartphone-idle',
    name: 'Smartphone (idle)',
    emoji: '📱',
    value: 0.5,
    unitId: 'W',
    description: 'A modern smartphone in idle/standby draws roughly 0.3–0.7 W. Using 0.5 W as average.',
    category: 'electronics',
  },
  {
    id: 'smartphone-active',
    name: 'Smartphone (active use)',
    emoji: '📱',
    value: 3,
    unitId: 'W',
    description: 'Active smartphone use (browsing, video) draws about 2–5 W. Using 3 W as typical.',
    category: 'electronics',
  },
  {
    id: 'laptop',
    name: 'Laptop computer',
    emoji: '💻',
    value: 50,
    unitId: 'W',
    description: 'A typical laptop draws 30–65 W during normal use. Using 50 W as average.',
    category: 'electronics',
  },
  {
    id: 'gaming-pc',
    name: 'Gaming PC',
    emoji: '🖥️',
    value: 400,
    unitId: 'W',
    description: 'A gaming desktop with GPU under load draws 300–500 W. Using 400 W as typical.',
    category: 'electronics',
  },
  {
    id: 'wifi-router',
    name: 'Wi-Fi router',
    emoji: '📡',
    value: 10,
    unitId: 'W',
    description: 'A home Wi-Fi router draws about 6–15 W. Using 10 W as average.',
    category: 'electronics',
  },
  {
    id: 'tv',
    name: 'Television (55")',
    emoji: '📺',
    value: 100,
    unitId: 'W',
    description: 'A modern 55" LED TV draws about 80–120 W. Using 100 W as average.',
    category: 'electronics',
  },

  // ============================================================
  // POWER — Household appliances
  // ============================================================
  {
    id: 'led-bulb',
    name: 'LED light bulb',
    emoji: '💡',
    value: 10,
    unitId: 'W',
    description: 'A standard LED bulb (60W equivalent) draws about 8–12 W. Using 10 W.',
    category: 'appliances',
  },
  {
    id: 'incandescent-bulb',
    name: 'Incandescent bulb',
    emoji: '💡',
    value: 60,
    unitId: 'W',
    description: 'A traditional 60W incandescent light bulb.',
    category: 'appliances',
  },
  {
    id: 'ceiling-fan',
    name: 'Ceiling fan',
    emoji: '🌀',
    value: 75,
    unitId: 'W',
    description: 'A ceiling fan on medium speed draws about 50–100 W. Using 75 W.',
    category: 'appliances',
  },
  {
    id: 'refrigerator',
    name: 'Refrigerator',
    emoji: '🧊',
    value: 150,
    unitId: 'W',
    description: 'A modern refrigerator draws about 100–200 W average (compressor cycles on/off). Using 150 W average.',
    category: 'appliances',
  },
  {
    id: 'washing-machine',
    name: 'Washing machine',
    emoji: '👕',
    value: 500,
    unitId: 'W',
    description: 'A washing machine draws about 400–600 W during a cycle. Using 500 W average.',
    category: 'appliances',
  },
  {
    id: 'dishwasher',
    name: 'Dishwasher',
    emoji: '🍽️',
    value: 1.8,
    unitId: 'kW',
    description: 'A dishwasher draws about 1.2–2.4 kW (heating element is the main draw). Using 1.8 kW.',
    category: 'appliances',
  },
  {
    id: 'hair-dryer',
    name: 'Hair dryer',
    emoji: '💨',
    value: 1.5,
    unitId: 'kW',
    description: 'A hair dryer on high draws about 1.0–1.8 kW. Using 1.5 kW.',
    category: 'appliances',
  },
  {
    id: 'microwave',
    name: 'Microwave oven',
    emoji: '🔲',
    value: 1.2,
    unitId: 'kW',
    description: 'A typical microwave draws about 1.0–1.5 kW. Using 1.2 kW.',
    category: 'appliances',
  },
  {
    id: 'electric-oven',
    name: 'Electric oven',
    emoji: '🔥',
    value: 3,
    unitId: 'kW',
    description: 'An electric oven at 350°F draws about 2–5 kW. Using 3 kW as average.',
    category: 'appliances',
  },
  {
    id: 'ac-unit',
    name: 'Central air conditioner',
    emoji: '❄️',
    value: 3.5,
    unitId: 'kW',
    description: 'A central AC unit (3-ton) draws about 3–4 kW. Using 3.5 kW.',
    category: 'appliances',
  },
  {
    id: 'ev-charger',
    name: 'EV charger (Level 2)',
    emoji: '🔌',
    value: 7.2,
    unitId: 'kW',
    description: 'A Level 2 EV charger (240V, 30A) delivers about 7.2 kW.',
    category: 'appliances',
  },

  // ============================================================
  // POWER — Buildings and communities
  // ============================================================
  {
    id: 'us-household',
    name: 'US household (average)',
    emoji: '🏠',
    value: 1.2,
    unitId: 'kW',
    description: 'Average US household uses ~10,500 kWh/year ≈ 1.2 kW average continuous draw. (EIA 2022 data)',
    category: 'buildings',
  },
  {
    id: 'school',
    name: 'School building',
    emoji: '🏫',
    value: 100,
    unitId: 'kW',
    description: 'A typical K-12 school draws about 50–150 kW average. Using 100 kW. Varies widely by size and climate.',
    category: 'buildings',
  },
  {
    id: 'hospital',
    name: 'Hospital',
    emoji: '🏥',
    value: 2,
    unitId: 'MW',
    description: 'A medium-sized hospital (200 beds) draws about 1.5–3 MW. Using 2 MW.',
    category: 'buildings',
  },
  {
    id: 'office-building',
    name: 'Office building',
    emoji: '🏢',
    value: 500,
    unitId: 'kW',
    description: 'A mid-size office building (100k sqft) draws about 300–700 kW. Using 500 kW.',
    category: 'buildings',
  },
  {
    id: 'shopping-mall',
    name: 'Shopping mall',
    emoji: '🏬',
    value: 3,
    unitId: 'MW',
    description: 'A large shopping mall draws about 2–5 MW. Using 3 MW.',
    category: 'buildings',
  },
  {
    id: 'small-town',
    name: 'Small town (5,000 people)',
    emoji: '🏘️',
    value: 5,
    unitId: 'MW',
    description: 'A town of ~5,000 people (~2,000 households + commercial) draws roughly 5 MW average.',
    category: 'buildings',
  },
  {
    id: 'small-city',
    name: 'Small city (100k people)',
    emoji: '🏙️',
    value: 100,
    unitId: 'MW',
    description: 'A city of 100,000 people draws roughly 100 MW including residential, commercial, and light industry.',
    category: 'buildings',
  },
  {
    id: 'large-city',
    name: 'Large city (1M people)',
    emoji: '🌆',
    value: 1,
    unitId: 'GW',
    description: 'A large city of ~1 million people draws roughly 1 GW. New York City peaks at about 11 GW.',
    category: 'buildings',
  },

  // ============================================================
  // POWER — Industrial & infrastructure
  // ============================================================
  {
    id: 'electric-kiln',
    name: 'Electric kiln (pottery)',
    emoji: '🏺',
    value: 8,
    unitId: 'kW',
    description: 'A medium pottery kiln (e.g. firing plates/bowls to cone 6) draws about 5–11 kW. Using 8 kW.',
    category: 'industrial',
  },
  {
    id: 'arc-furnace',
    name: 'Electric arc furnace',
    emoji: '🔩',
    value: 50,
    unitId: 'MW',
    description: 'A steel electric arc furnace draws about 30–80 MW during operation. Using 50 MW.',
    category: 'industrial',
  },
  {
    id: 'aluminum-smelter',
    name: 'Aluminum smelter',
    emoji: '🪙',
    value: 300,
    unitId: 'MW',
    description: 'A large aluminum smelter draws about 200–500 MW continuously. Using 300 MW.',
    category: 'industrial',
  },
  {
    id: 'data-center-small',
    name: 'Small data center',
    emoji: '🖥️',
    value: 5,
    unitId: 'MW',
    description: 'A small enterprise data center draws about 2–10 MW. Using 5 MW.',
    category: 'industrial',
  },
  {
    id: 'data-center-hyperscale',
    name: 'Hyperscale data center',
    emoji: '🏗️',
    value: 100,
    unitId: 'MW',
    description: 'A modern hyperscale data center draws about 50–150 MW. Using 100 MW.',
    category: 'industrial',
  },
  {
    id: 'gw-data-center',
    name: 'Gigawatt data center campus',
    emoji: '⚡',
    value: 1,
    unitId: 'GW',
    description: 'A proposed next-gen data center campus at gigawatt scale (e.g. Microsoft/OpenAI plans).',
    category: 'industrial',
  },

  // ============================================================
  // POWER — Generation
  // ============================================================
  {
    id: 'solar-panel',
    name: 'Solar panel (residential)',
    emoji: '☀️',
    value: 400,
    unitId: 'W',
    description: 'A standard residential solar panel is rated at ~400 W peak. Actual average output is lower (~20% capacity factor).',
    category: 'generation',
  },
  {
    id: 'wind-turbine',
    name: 'Wind turbine (onshore)',
    emoji: '🌬️',
    value: 3,
    unitId: 'MW',
    description: 'A modern onshore wind turbine is rated at 2–4 MW peak. Using 3 MW peak (~35% capacity factor).',
    category: 'generation',
  },
  {
    id: 'nuclear-reactor',
    name: 'Nuclear reactor',
    emoji: '☢️',
    value: 1,
    unitId: 'GW',
    description: 'A typical nuclear reactor produces about 1 GW electric. (e.g. a Westinghouse AP1000)',
    category: 'generation',
  },

  // ============================================================
  // ENERGY — Batteries and stored energy
  // ============================================================
  {
    id: 'aaa-battery',
    name: 'AAA battery',
    emoji: '🔋',
    value: 1.8,
    unitId: 'Wh',
    description: 'A AAA alkaline battery stores about 1.8 Wh (1.5V × 1200mAh).',
    category: 'batteries',
  },
  {
    id: 'aa-battery',
    name: 'AA battery',
    emoji: '🔋',
    value: 3.9,
    unitId: 'Wh',
    description: 'A AA alkaline battery stores about 3.9 Wh (1.5V × 2600mAh).',
    category: 'batteries',
  },
  {
    id: 'phone-battery',
    name: 'Smartphone battery',
    emoji: '📱',
    value: 15,
    unitId: 'Wh',
    description: 'A modern smartphone battery is about 4000 mAh at 3.8V ≈ 15 Wh.',
    category: 'batteries',
  },
  {
    id: 'laptop-battery',
    name: 'Laptop battery',
    emoji: '💻',
    value: 60,
    unitId: 'Wh',
    description: 'A typical laptop battery is about 50–70 Wh. Using 60 Wh.',
    category: 'batteries',
  },
  {
    id: 'tesla-battery',
    name: 'Tesla Model 3 battery',
    emoji: '🚗',
    value: 60,
    unitId: 'kWh',
    description: 'A Tesla Model 3 Standard Range has a ~60 kWh battery pack.',
    category: 'batteries',
  },
  {
    id: 'powerwall',
    name: 'Tesla Powerwall',
    emoji: '🔋',
    value: 13.5,
    unitId: 'kWh',
    description: 'A Tesla Powerwall home battery stores 13.5 kWh usable.',
    category: 'batteries',
  },

  // ============================================================
  // ENERGY — Consumption events
  // ============================================================
  {
    id: 'charge-phone',
    name: 'Charge a smartphone',
    emoji: '🔌',
    value: 15,
    unitId: 'Wh',
    description: 'Fully charging a smartphone uses about 15 Wh (roughly the battery capacity plus charging losses).',
    category: 'energy-events',
  },
  {
    id: 'load-laundry',
    name: 'Load of laundry',
    emoji: '👕',
    value: 0.5,
    unitId: 'kWh',
    description: 'One load in a front-load washer uses about 0.3–0.8 kWh. Using 0.5 kWh (cold wash).',
    category: 'energy-events',
  },
  {
    id: 'kiln-firing',
    name: 'Fire a kiln load (pottery)',
    emoji: '🏺',
    value: 80,
    unitId: 'kWh',
    description: 'Firing an electric kiln (8 kW for ~10 hours to cone 6) uses about 80 kWh per firing.',
    category: 'energy-events',
  },
  {
    id: 'household-daily',
    name: 'US household daily use',
    emoji: '🏠',
    value: 29,
    unitId: 'kWh',
    description: 'Average US household uses ~29 kWh per day (10,500 kWh/year ÷ 365).',
    category: 'energy-events',
  },
  {
    id: 'smelt-aluminum-kg',
    name: 'Smelt 1 kg of aluminum',
    emoji: '🪙',
    value: 15,
    unitId: 'kWh',
    description: 'Producing 1 kg of aluminum via electrolysis takes about 13–17 kWh. Using 15 kWh.',
    category: 'energy-events',
  },

  // ============================================================
  // DISTANCE — for cross-dimension conversions
  // ============================================================
  {
    id: 'city-block',
    name: 'City block',
    emoji: '🧱',
    value: 100,
    unitId: 'm',
    description: 'A typical city block is about 80–120 m. Using 100 m.',
    category: 'distance',
  },
  {
    id: 'marathon',
    name: 'Marathon',
    emoji: '🏃',
    value: 42.195,
    unitId: 'km',
    description: 'A marathon is 42.195 km (26.2 miles).',
    category: 'distance',
  },
  {
    id: 'cross-country-us',
    name: 'Cross-country US trip',
    emoji: '🗺️',
    value: 4500,
    unitId: 'km',
    description: 'New York to Los Angeles is about 4,500 km (2,800 miles) by road.',
    category: 'distance',
  },
  {
    id: 'earth-circumference',
    name: 'Around the Earth',
    emoji: '🌍',
    value: 40075,
    unitId: 'km',
    description: 'Earth\'s circumference at the equator is 40,075 km.',
    category: 'distance',
  },
  {
    id: 'earth-to-moon',
    name: 'Earth to Moon',
    emoji: '🌙',
    value: 384400,
    unitId: 'km',
    description: 'Average Earth-Moon distance is 384,400 km.',
    category: 'distance',
  },
]

/** Lookup a quantity entry by ID */
export function getQuantity(id: string): QuantityEntry | undefined {
  return quantities.find(q => q.id === id)
}

/** Get all quantities for a given dimension (by looking up their unit) */
export function getQuantitiesByDimension(dimension: string, unitsMap: Map<string, { dimension: string }>): QuantityEntry[] {
  return quantities.filter(q => {
    const unit = unitsMap.get(q.unitId)
    return unit && unit.dimension === dimension
  })
}
