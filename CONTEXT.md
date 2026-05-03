# brand-forge — Domain Glossary

This is the canonical vocabulary for brand-forge. Use these terms exactly. Operational rules and dev commands live in [`CLAUDE.md`](./CLAUDE.md); this file is *just* the language.

For per-brand glossaries (terms specific to a *particular* brand kit), generate one with:
```
brand-forge export glossary --kit <kit>.json --output ./output
```

---

## Core artifacts

| Term | Definition |
|---|---|
| **Brand kit** | A single Zod-validated JSON document (`brand-kit.json`) that is the authoritative contract for one brand. Every output downstream is derived from it. |
| **Schema** | The Zod types in `src/core/schema/` that define what a brand kit must contain. Schema changes are breaking changes. |
| **Preset** | A saved, validated brand kit in `presets/`. Presets are starting points for new brands, not final outputs. |

## The four module categories

brand-forge enforces strict separation. Every module belongs to exactly one of these:

| Term | Definition | Constraint |
|---|---|---|
| **Extractor** | Parses design tokens from external source files (a website variant, a Figma export). Pure regex/parsing. | No AI, no network, no randomness. |
| **Generator** | AI-assisted creative proposal (palette, fonts, voice, identity). Proposes; humans approve. | Output must conform to schema. Approval is interactive. |
| **Review gate** | A QA check that blocks export on failure (contrast, font compatibility, consistency). | Pure deterministic check on a parsed kit. |
| **Exporter** | Pure transform from a brand kit to a downstream format (CSS, Tailwind, markdown, glossary, signal-forge bridge, image-gen style). | No AI, no network, no randomness. Same input → same output. |

> The **deletion test** for brand-forge: if you can't tell which of these four buckets a new module belongs in, it doesn't belong here yet. Find the bucket first, then build it.

## Bridge terms (downstream contracts)

| Term | Definition |
|---|---|
| **Signal-forge theme** | Bridge file (`.theme.json`) consumed by signal-forge as `PresentationTheme`. Maps brand colors, typography, spacing for PPTX rendering. |
| **Signal-forge voice** | Bridge file (`.voice.json`) consumed by signal-forge as `VoiceRules`. Maps voice attributes + anti-patterns into validation rules. |
| **Image-gen style** | Bridge file (`.style.json`) consumed by image-gen as a style system + base prompt + concept map. |
| **Brand glossary** | Bridge file (`.CONTEXT.md`) — markdown view of the kit's canonical terms for use as a project glossary. New in 0.1.x. |

## Voice terms

These mirror the Voice schema (`src/core/schema/voice.ts`). Use them precisely:

| Term | Definition |
|---|---|
| **Voice attribute** | A trait the brand sounds like (e.g., "direct", "self-interrogating"). Positive enforcement target. |
| **Anti-pattern** | A pattern the brand must never use. Categorized (corporate-jargon, academic-distance, etc.). Severity is `error` or `warning`. |
| **Structural pattern** | A required or optional structural feature (e.g., "question-first-opening", "compare-contrast-frame"). |
| **Voice score** | 0–100 alignment score computed by signal-forge's `ModeVoiceChecker` against this kit's voice rules. The kit specifies a `minimumScore` threshold. |

## Avoid (vocabulary drift)

These terms have caused confusion — replace if encountered:

- "design token" alone is ambiguous → say "color token", "spacing token", "type scale step"
- "brand guidelines" → "brand kit" (the JSON) or "design system docs" (the markdown export)
- "theme" without qualifier → say "PresentationTheme" (signal-forge bridge), "color theme" (light/dark mode), or just "brand kit"
- "approval" used loosely → reserve for the interactive `@inquirer/prompts` step where a generator's proposal is locked into the kit
- "boundary" → use "seam" if talking about architecture; use "constraint" if talking about layout limits
