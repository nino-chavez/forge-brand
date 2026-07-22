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

# Extract from a website-exploration winning variant
npx tsx src/cli/index.ts init --from-exploration ./explorations/winning-slug/ -o my-brand.json
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
# Run QA gates (contrast, font compat, consistency, decisions)
npx tsx src/cli/index.ts review --kit brand-kit.json

# Diff two kit versions
npx tsx src/cli/index.ts diff old-kit.json new-kit.json
```

### Decisions — durable creative state

An identity that is still being developed carries a `decisions` block. It records the brief, the ordered gates, the evaluation rubric, every candidate, the decision ledger, and the rejections. The `review` command enforces it and exits non-zero on failure:

- A candidate marked `approved` with no matching ledger entry is an **error**. Approval has to be an explained, attributed entry rather than a silently flipped flag.
- A live candidate matching a **mechanical** rejection constraint is an **error** — those are decidable from text (a banned slogan, a forbidden font).
- A **judgment** constraint ("reads as the Facebook mark") can't be decided from text, so a descriptor match only warns. Its real enforcement is that approving inside its gate scope requires the human to list it in the ledger entry's `reviewed`. That mandatory look is the honest version of enforcing a visual call, and it's governed by `acknowledgement`, not `severity` — lowering how much a text match matters must not switch off the look.
- Adding a constraint does **not** retroactively invalidate earlier approvals, as long as both carry dates. Otherwise the only way to clear the error would be backdating a claim that someone checked a rule that didn't exist yet.
- A ledger entry rejecting a candidate that is still marked live is an **error**. Otherwise a recorded rejection is inert and the candidate keeps competing.
- Approving any gate with no `conceptualAnchor` recorded is an **error**. Generating before the metaphor exists is how a project ends up describing camera parts instead of an idea.
- An approved candidate with `method: "trace"` is an **error**. A traced raster is not a master. Rebuild it as `hand-vector` with `parent` pointing at the trace.
- A gate approved before its prerequisite is an **error**. Generating at the symbol gate before territory is settled is how a project ends up defending an early artifact instead of solving the brief.
- Candidates with an empty rubric is a **warning**. Agree the bar before generating, or the first artifact becomes the bar.

Two limits worth knowing. This is a **soft control on authorship**: the gate checks that a ledger entry exists with a rationale and an author, not that a human wrote it — a forged entry passes, and git review is where that gets caught. And descriptor matching is a **self-report channel**: it catches an honest describer, not a motivated one. Describe candidates mechanically ("filmstrip perforations forming the d bowl"), not by vibe. Where a structured field already carries the fact — generation method, gate, parentage — the gate reads that field instead of the prose.

`agent-prompt` emits the whole creative state: anchor, gate status, recorded rejections, criteria, and the instruction not to self-approve. Point a fresh session or a different harness at it and it inherits every past rejection instead of relitigating them.

```bash
npx tsx src/cli/index.ts agent-prompt --kit presets/flickday.json
```

### The loop

Generation is scoped to a gate, and a managed kit refuses to generate at the wrong moment — before the anchor exists, at a gate whose prerequisites are open, or at one already decided. When it does generate, the anchor, the in-scope rejections, and the criteria go into the prompt, so a generator can't re-propose a direction you already killed.

```bash
# refuses: no anchor yet, so there is nothing to generate toward
brand-forge generate logo -k kit.json -g territory

# record a candidate — describe the construction, not the vibe;
# the descriptor is what rejection constraints match against
brand-forge candidate add -k kit.json -g territory -m other \
  -d "The instant of contact — the mark is the moment the ball is struck"

brand-forge candidate list -k kit.json

# refuses, and prints the exact flag to re-run with once you have looked
brand-forge decide -k kit.json -g territory --approve C-001 \
  --rationale "Reads across stills and video without a camera cliche." --by nino

brand-forge decide -k kit.json -g territory --approve C-001 \
  --rationale "Reads across stills and video without a camera cliche." --by nino \
  --reviewed no-multi-metaphor

# now the downstream gates open
brand-forge generate logo -k kit.json -g symbol
```

`candidate add` and `decide` validate against both the schema and the review gate before writing, and refuse to persist anything either would reject — so the file on disk always parses and always passes.

Reopening a decided gate is explicit and keeps the record:

```bash
brand-forge generate logo -k kit.json -g territory --reopen
brand-forge decide -k kit.json -g territory --approve C-002 \
  --rationale "Crowd reaction travels further on social than the play does." \
  --by nino --reviewed no-multi-metaphor
# → Gate "territory": approved C-002; superseded C-001
```

Both ledger entries survive. The old candidate becomes `superseded`, so the gate still resolves to exactly one live winner and nothing has to be deleted to change your mind.

The block is optional — kits imported wholesale have no decision history and pass trivially. `presets/flickday.json` is the worked example.

```bash
npx tsx src/cli/index.ts review --kit presets/flickday.json
# Decisions
#   0 live candidates against 7 rejection constraints
#   PASSED
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
website-exploration (DISCOVERY) → winning variant (source files)
    ↓
brand-forge (PRODUCER) → brand-kit.json
    ↓
signal-forge (CONSUMER) → reads theme + voice bridges
image-gen (CONSUMER)    → reads style system + creative context
```

- **Schema** (`src/core/schema/`) — Zod types, the contract
- **Review gates** (`src/core/review/`) — contrast, font compat, consistency; blocks export on failure
- **Exporters** (`src/core/exporters/`) — pure deterministic transforms, no AI
- **Generators** (`src/core/generators/`) — AI proposals via OpenRouter, human-approved
- **Extractors** (`src/core/extractors/`) — parse design tokens from exploration variants, pure regex-based
- **Media** (`src/media/`) — Satori + Resvg renderer, JSX templates
- **CLI** (`src/cli/`) — Commander commands
- **Presets** (`presets/`) — validated brand kit JSONs

## Font loading

Templates render with actual brand fonts loaded from Google Fonts (TTF). Fonts are cached at `~/.brand-forge/fonts/` across CLI invocations. Fonts not on Google Fonts (e.g. Adobe Typekit) fall back to Inter unless a `localPath` TTF is specified in the font stack.
