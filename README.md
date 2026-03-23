# brand-forge

CLI-first design agency toolkit. One brand kit JSON drives every output — tokens, media, components, docs.

## Install

```bash
cd brand-forge
npm install
```

Requires `OPENROUTER_API_KEY` in `.env` for AI generators (palette, fonts, voice, identity, logo).

## Commands

### Create a brand kit

```bash
# Interactive discovery
npx tsx src/cli/index.ts init

# Fork from existing preset
npx tsx src/cli/index.ts init --from presets/flickday.json -o my-brand.json
```

### AI generators

```bash
# Propose color palettes (validates WCAG contrast)
npx tsx src/cli/index.ts generate palette --kit brand-kit.json

# Propose font pairings (validates compatibility)
npx tsx src/cli/index.ts generate fonts --kit brand-kit.json

# Synthesize voice rules from brand personality
npx tsx src/cli/index.ts generate voice --kit brand-kit.json

# Generate brand identity from minimal input
npx tsx src/cli/index.ts generate identity --kit brand-kit.json

# Generate logo concepts via AI image models
npx tsx src/cli/index.ts generate logo --kit brand-kit.json
```

All generators propose, review gates validate, human approves.

### Export

```bash
# Individual formats
npx tsx src/cli/index.ts export css --kit brand-kit.json
npx tsx src/cli/index.ts export tailwind --kit brand-kit.json
npx tsx src/cli/index.ts export docs --kit brand-kit.json
npx tsx src/cli/index.ts export figma --kit brand-kit.json
npx tsx src/cli/index.ts export signal-forge --kit brand-kit.json
npx tsx src/cli/index.ts export signal-forge-voice --kit brand-kit.json
npx tsx src/cli/index.ts export image-gen --kit brand-kit.json

# All formats at once
npx tsx src/cli/index.ts export all --kit brand-kit.json
```

### Media

```bash
# List available templates
npx tsx src/cli/index.ts media list --kit brand-kit.json

# Render a template
npx tsx src/cli/index.ts media render social-card --kit brand-kit.json \
  --data '{"title":"My Title","subtitle":"My Subtitle"}'

# Print-resolution output (picks 300dpi size from kit)
npx tsx src/cli/index.ts media render flyer --kit brand-kit.json --print \
  --data '{"eventName":"Event","date":"Jan 1","location":"Chicago"}'

# Generate favicon set (16, 32, 180, 512)
npx tsx src/cli/index.ts media favicon --kit brand-kit.json

# Available templates: social-card, story, flyer, favicon,
#   prescription-label, heat-card, email-header, business-card
```

### Site scaffolding

```bash
npx tsx src/cli/index.ts site nextjs --kit brand-kit.json -o ./my-site
npx tsx src/cli/index.ts site sveltekit --kit brand-kit.json -o ./my-site
npx tsx src/cli/index.ts site static --kit brand-kit.json -o ./my-site
```

### Batch — everything in one shot

```bash
npx tsx src/cli/index.ts batch --kit presets/volley-rx.json
# Outputs: exports/ + media/ + favicons/ for the brand
```

### Quality review

```bash
# Run QA gates (contrast, font compat, consistency)
npx tsx src/cli/index.ts review --kit brand-kit.json

# Diff two kit versions
npx tsx src/cli/index.ts diff old-kit.json new-kit.json
```

## Presets

Pre-built brand kits in `presets/`:

| Preset | Brand | Theme |
|--------|-------|-------|
| `flickday.json` | Flickday Media | Dark, yellow accent, Bebas Neue |
| `630volleyball.json` | 630 Volleyball | Light, red accent, Space Grotesk |
| `signal-dispatch.json` | Signal Dispatch | Dark, coral accent, Rival Sans |
| `volley-rx.json` | Volley Rx | Dark, gold accent, Playfair Display |
| `letspepper.json` | Let's Pepper | Dark, yellow/green, Bebas Neue |

## Creating a new preset

1. Start from `init` or fork an existing preset
2. Edit the JSON — the schema is in `src/core/schema/brand-kit.ts`
3. Run `review` to validate — it checks contrast, font weights, internal consistency
4. Run `export all` to generate tokens and docs
5. Run `batch` to generate all media assets

Required fields: `meta` (schemaVersion, id, created, updated), `identity` (name), `colors`, `typography`, `spacing`, `radius`, `layout`, `voice`, `media`.

## Architecture

```
brand-forge (PRODUCER) → brand-kit.json
    ↓
signal-forge (CONSUMER) → reads theme + voice bridges
image-gen (CONSUMER)    → reads style system + creative context
```

- **Schema** (`src/core/schema/`) — Zod types, the contract
- **Review gates** (`src/core/review/`) — contrast, font compat, consistency; blocks export on failure
- **Exporters** (`src/core/exporters/`) — pure deterministic transforms, no AI
- **Generators** (`src/core/generators/`) — AI proposals via OpenRouter, human-approved
- **Media** (`src/media/`) — Satori + Resvg renderer, JSX templates
- **CLI** (`src/cli/`) — Commander commands
- **Presets** (`presets/`) — validated brand kit JSONs

## Font loading

Templates render with actual brand fonts loaded from Google Fonts (TTF). Fonts are cached at `~/.brand-forge/fonts/` across CLI invocations. Fonts not on Google Fonts (e.g. Adobe Typekit) fall back to Inter unless a `localPath` TTF is specified in the font stack.
