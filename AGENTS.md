# brand-forge

CLI-first design agency toolkit. One brand kit schema drives every output — tokens, media, components, docs.

## Architecture

```
brand-forge/
├── src/core/schema/     # Zod schemas — the contract everything depends on
├── src/core/review/     # QA gates — blocks export if brand kit fails checks
├── src/core/exporters/  # Deterministic transforms (brand kit → CSS, Tailwind, etc.)
├── src/core/generators/ # AI-assisted creative proposals (palette, fonts, voice, logo)
├── src/media/           # Visual asset pipeline (Satori templates + AI creative)
├── src/site/            # Web design scaffolding
├── src/cli/             # Commander CLI
└── presets/             # Saved brand kits (flickday, 630, letspepper, etc.)
```

## Dependency Graph

```
brand-forge (PRODUCER) → brand-kit.json
    ↓
signal-forge (CONSUMER) — reads brand kit → PresentationTheme + VoiceRules
image-gen (CONSUMER)    — reads brand kit → style systems + prompt context
```

## Key Principles

1. **Schema is the contract** — every generator reads from BrandKit, every exporter serializes from it. Nothing freehand.
2. **Exporters are pure functions** — `(BrandKit, options) => output`. No AI, no side effects. Deterministic.
3. **Generators propose, humans approve** — AI suggests palettes/fonts/voice. Approved outputs lock into the schema.
4. **Review gates block** — contrast, font compat, and consistency checks must pass before any export.
5. **Templates are parameterized, not generated** — Satori templates take brand tokens as input. AI fills parameters, not layouts.

## Anti-Slop Rules

- No AI-generated palettes without WCAG AA contrast validation
- No AI-generated font pairings without optical compatibility checks
- No generated content without voice check scoring above threshold
- No "inspired by trends" — every design decision traces to a brand attribute
- No freehand generation — all output parameterized by brand-kit.json

## File Conventions

- Schema files: `src/core/schema/*.ts` — Zod schemas with `.js` extensions in imports
- Review gates: `src/core/review/*.ts` — pure functions returning `{ passed, issues }`
- Exporters: `src/core/exporters/*.ts` — pure functions `(BrandKit) => string`
- Generators: `src/core/generators/*.ts` — async functions that call AI providers
- Presets: `presets/*.json` — validated BrandKit JSON files
- All imports use `.js` extension (ESM)
