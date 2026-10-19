# brand-forge — Agent Ingress

This file is the entry point for AI agents (Claude Code, Cursor, Copilot, etc.) working with this repo. Read this first, then the Rules and Pre-Commit Checklist sections below.

## Fastest Path: agent-prompt

Skip reading docs entirely. Run this to get a self-contained prompt payload:

```bash
# Full context with a specific brand kit
npm run dev -- agent-prompt --kit presets/flickday.json

# Scoped to a specific task
npm run dev -- agent-prompt --kit presets/flickday.json --task media

# List available presets
npm run dev -- agent-prompt --list-presets

# Include full kit JSON in output
npm run dev -- agent-prompt --kit presets/flickday.json --full

# Available tasks: init, generate, export, media, batch, review, site, all
```

The output is your complete instruction set — brand context, commands, rules, and validation steps. Copy-paste it into your agent context and go.

## What This Is

CLI-first design agency toolkit. One brand kit schema drives every output — tokens, media, components, docs.

## Quick Orient

```
brand-forge/
├── src/core/schema/     # Zod schemas — the contract everything depends on
├── src/core/review/     # QA gates — blocks export if brand kit fails checks
├── src/core/exporters/  # Deterministic transforms (brand kit → CSS, Tailwind, etc.)
├── src/core/generators/ # AI-assisted creative proposals (palette, fonts, voice, logo)
├── src/core/extractors/ # Parse design tokens from exploration variants (pure, no AI)
├── src/media/           # Visual asset pipeline (Satori templates + AI creative)
├── src/site/            # Web design scaffolding
├── src/cli/             # Commander CLI
├── presets/             # Saved brand kits (flickday, 630, letspepper, etc.)
└── docs/                # Architecture, developer, CLI reference docs
```

## Quick Reference

- **Schema**: `src/core/schema/` — Zod types. The contract.
- **Review gates**: `src/core/review/` — QA checks that block export on failure.
- **Exporters**: `src/core/exporters/` — Pure deterministic transforms.
- **Generators**: `src/core/generators/` — AI-assisted creative proposals.
- **Extractors**: `src/core/extractors/` — Parse design tokens from exploration variants.
- **Media**: `src/media/` — Satori templates + AI image generation.
- **Presets**: `presets/` — Saved brand kits as validated JSON.
- **CLI**: `src/cli/` — Commander commands.

## Dev Commands

```bash
npm run dev -- <command>    # Run CLI in dev mode
npm run build               # TypeScript compile
npm run lint                # Type check without emit
npm run review              # Run QA review on current brand kit
npm test                    # Vitest
```

## Rules

1. Exporters are pure functions. No AI, no network, no randomness.
2. Generators propose. Review gates validate. Humans approve. Then it locks into the schema.
2b. Identity work advances on a `decisions.ledger` entry, never on a status field an agent set. Recorded rejections are enforced against live candidates — do not relitigate one by rewording the descriptor.
2c. Use `candidate add` and `decide` rather than hand-editing the `decisions` block. Both validate before writing, so the kit on disk always passes review. Never fill in a ledger entry's `reviewed` on the operator's behalf — that field asserts a human looked at the artifact.
3. All imports use `.js` extension (ESM).
4. All colors are `#rrggbb` format.
5. Every preset must pass `parseBrandKit()` and `reviewBrandKit()`.
6. No trend-chasing. Every design decision traces to a brand attribute.

## Pre-Commit Checklist

Before committing changes to this project:

1. `npm run lint` passes (no type errors)
2. If schema changed: all presets still parse
2b. If a candidate was rejected this session: the reason is recorded in `decisions.rejections`, not just said in chat
3. If preset changed: `reviewBrandKit()` still passes (no errors)
4. If exporter changed: output is deterministic (same input → same output)
5. If generator changed: output conforms to BrandKit schema
6. If extractor changed: extraction is pure (no AI, no prompts, regex-based only)

## Agent Workflow

When a human points you at this repo, follow this sequence:

### 1. Load Context (automatic for Claude Code and Codex)

- Read the Rules, Pre-Commit Checklist and Dependency Direction sections of this file — project rules, module boundaries, pre-commit checklist
- Read `docs/architecture/README.md` — full system design, data flow diagrams
- Read `docs/developer/README.md` — setup, commands, module rules
- Read `docs/user/reference/cli.md` — every CLI command with options

### 2. Ask the Human

You cannot do useful work without knowing **which brand** and **what task**. Prompt:

```
I've loaded the brand-forge project. To help you, I need:

1. Which brand kit? (pick one or tell me a new brand name)
   Available presets: 630volleyball, flickday, letspepper, signal-dispatch, volley-rx

2. What do you want to do?
   - Create a new brand from scratch (init)
   - Extract tokens from a website prototype (init --from-exploration)
   - Generate creative proposals — palette, fonts, voice, identity, logo (generate)
   - Export to a format — CSS, Tailwind, Figma, Markdown, etc. (export)
   - Render media — social card, flyer, favicon, business card, etc. (media)
   - Full asset package (batch)
   - Review/validate an existing kit (review)
   - Scaffold a branded site — Next.js, SvelteKit, or static (site)
   - Something else?
```

### 3. Execute

All commands run through the CLI:

```bash
# Dev mode (from source)
npm run dev -- <command> [options]

# Always specify the kit
npm run dev -- review --kit presets/flickday.json
npm run dev -- export css --kit presets/signal-dispatch.json
npm run dev -- batch --kit presets/volley-rx.json --output ./output
```

### 4. Validate Before Committing

Always run before committing changes:

```bash
npm run lint          # Type-check
npm test              # Run test suite
npm run dev -- review --kit presets/<name>.json  # QA gates on any modified preset
```

## Key Rules for Agents

1. **Exporters are pure functions.** No AI, no network, no randomness. If you modify an exporter, the output must be deterministic.
2. **Generators propose, humans approve.** Never auto-apply AI-generated output. The interactive prompt step is mandatory.
3. **Extractors are pure.** Regex-based parsing only. No AI, no prompts.
4. **Schema changes cascade everywhere.** If you change `src/core/schema/`, update ALL presets and run ALL tests.
5. **Review gates must pass before export.** Don't use `--skip-review` unless the human explicitly asks.
6. **All imports use `.js` extension.** ESM project.
7. **All colors are `#rrggbb`.** 6-digit hex with `#` prefix. No shorthand, no rgb(), no named colors.

## Dependency Direction

```
website-exploration (DISCOVERY) → winning variant (source files)
    ↓
brand-forge (PRODUCER) → brand-kit.json
    ↓
signal-forge (CONSUMER) — reads brand kit → PresentationTheme + VoiceRules
image-gen (CONSUMER)    — reads brand kit → style systems + prompt context
```

Do NOT introduce imports from signal-forge or image-gen. The arrow is one-way.

Do not introduce dependencies from brand-forge TO signal-forge or image-gen. The arrow goes one way.
website-exploration is an upstream producer — brand-forge extracts from its output but does not depend on it at runtime.

## Environment

Generators need an AI provider key. Everything else works without one.

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | Primary AI provider (preferred) |
| `ANTHROPIC_API_KEY` | Fallback AI provider |
| `VERCEL_OIDC_TOKEN` | Vercel AI Gateway (requires `ai` package) |

## Anti-Slop Rules

- No AI-generated palettes without WCAG AA contrast validation
- No AI-generated font pairings without optical compatibility checks
- No generated content without voice check scoring above threshold
- No "inspired by trends" — every design decision traces to a brand attribute
- No freehand generation — all output parameterized by brand-kit.json

## Deeper Documentation

| Doc | When to Read |
|-----|-------------|
| `AGENTS.md` (Rules and Pre-Commit Checklist sections) | Always — project rules and boundaries |
| `docs/architecture/README.md` | Understanding system design, data flows, decisions |
| `docs/developer/README.md` | Setup, module rules, troubleshooting |
| `docs/developer/contributing.md` | Adding new exporters, generators, templates, extractors |
| `docs/user/reference/cli.md` | Complete CLI command reference |
| `docs/audit-report.md` | Documentation coverage gaps |
