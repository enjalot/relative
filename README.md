# Relative

Understand relative quantities by comparison. Enter an electricity value (like "1 GW") and see it visualized as familiar real-world things.

## Architecture

```
src/
  types/index.ts        — Core TypeScript types (Unit, QuantityEntry, ConversionRule, FormulaResult)
  data/
    units.ts            — Unit definitions with base-unit conversion factors
    quantities.ts       — Real-world quantities database (emoji, value, unit, description)
    conversions.ts      — Cross-dimension conversion rules (power→energy→distance, etc.)
  engine/
    converter.ts        — Formula-building algorithm: finds best comparison and emoji scale
  components/
    InputPanel.tsx       — Number input + unit combobox
    OutputSelector.tsx   — Output quantity selector (grouped by conversion path)
    FormulaDisplay.tsx   — Shows equation, conversion steps, and legend
  App.tsx               — Main app wiring state and components together
```

### Key concepts

- **Dimension**: A physical dimension (power, energy, distance, mass, time)
- **Unit**: A measurement unit within a dimension, with a conversion factor to the base unit
- **QuantityEntry**: A real-world thing (e.g. "US household" = 1.2 kW) with an emoji
- **ConversionRule**: Cross-dimension conversion (e.g. energy → distance via Tesla efficiency)
- **FormulaResult**: The output of the algorithm: input → steps → output × emoji count

### Adding data

To add a new quantity, add an entry to `src/data/quantities.ts`. To add a new cross-dimension conversion, add to `src/data/conversions.ts`. Units go in `src/data/units.ts`.

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

Built as a static site for GitHub Pages:

```bash
npm run build    # outputs to dist/
```

Deploys automatically via GitHub Actions on push to `main`.
