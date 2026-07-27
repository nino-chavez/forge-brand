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
| **Review gate** | A QA check that blocks export on failure (contrast, font compatibility, consistency, decisions). | Pure deterministic check on a parsed kit. |
| **Exporter** | Pure transform from a brand kit to a downstream format (CSS, Tailwind, markdown, glossary, signal-forge bridge, image-gen style). | No AI, no network, no randomness. Same input → same output. |

> The **deletion test** for brand-forge: if you can't tell which of these four buckets a new module belongs in, it doesn't belong here yet. Find the bucket first, then build it.

## Bridge terms (downstream contracts)

| Term | Definition |
|---|---|
| **Signal-forge theme** | Bridge file (`.theme.json`) consumed by signal-forge as `PresentationTheme`. Maps brand colors, typography, spacing for PPTX rendering. |
| **Signal-forge voice** | Bridge file (`.voice.json`) consumed by signal-forge as `VoiceRules`. Maps voice attributes + anti-patterns into validation rules. |
| **Image-gen style** | Bridge file (`.style.json`) consumed by image-gen as a style system + base prompt + concept map. |
| **Brand glossary** | Bridge file (`.CONTEXT.md`) — markdown view of the kit's canonical terms for use as a project glossary. New in 0.1.x. |

## Decision terms

These mirror the Decisions schema (`src/core/schema/decisions.ts`). The kit records what a brand *is*; `decisions` records how it got there and what it must never become again. It is contract data, not a fifth module category — it extends the schema, and one review gate enforces it.

| Term | Definition |
|---|---|
| **Constitution** | The reconciled brief in prose, plus non-goals and prior approvals. Deliberately thin — name, audience, personality, and positioning stay in `identity`. Duplicating them here creates two sources of truth. |
| **Gate** | An ordered decision point (territory, wordmark, symbol, lockup, stress-test, production, motion). `requires` names the gates that must be approved first. |
| **Rubric criterion** | An evaluation criterion, agreed *before* generation. Criteria written after the first artifact appears describe that artifact instead of the brief. |
| **Rejection constraint** | A durable "never again" rule, in one of two **constraint classes**. The visual counterpart to a voice **anti-pattern**, and the reason a rejection recorded once stops recurring. Write patterns narrow enough that an honest candidate cannot trip them — a constraint that fires on everything trains the reader to ignore the gate, which is the failure it exists to prevent. |
| **Mechanical constraint** | `class: "mechanical"` — the violation is decidable from text: a forbidden font family, a banned slogan, a required spelling. A descriptor match is a verdict and blocks review. |
| **Judgment constraint** | `class: "judgment"` — the violation is a visual call ("reads as the Facebook mark", "the aperture geometry is wrong"). No string match can decide it, so a descriptor hit only warns. Enforcement is the **mandatory look**. The default class, because claiming mechanical certainty you don't have is the more expensive mistake. |
| **Mandatory look** | Approving in a judgment constraint's gate scope requires naming its id in the ledger entry's `reviewed`. Governed by `acknowledgement` (`required` blocks, `optional` warns) — deliberately *not* by `severity`, which describes only how much a descriptor hit matters. One field meaning both let an author lower it for evidentiary reasons and silently switch off the real enforcement. |
| **Conceptual anchor** | The metaphor the identity is built on — the idea, not the apparatus. "The instant of contact" is an anchor; "aperture, shutter, viewfinder" is a parts list, which is what gets generated when work starts before an anchor exists. Approving any gate without one recorded is an error. |
| **Candidate** | One proposal at one gate: neutral id, round, descriptor, generation method, optional asset, status. Neutral ids exist so candidates can be shown blind before a font name or a recommendation biases the reaction. |
| **Descriptor** | Plain-language description of what a candidate *is*, in mechanical terms ("filmstrip perforations forming the d bowl"), not vibe terms. This is the text rejection constraints match against, so vague descriptors defeat the gate. |
| **Decision entry** | A recorded human decision in the **ledger** — gate, verdict, candidates, rationale, who decided. A gate advances only when one of these lands. A `status: "approved"` with no ledger entry is a review-gate error. |

> What the gate buys: approval becomes a deliberate, explained, attributed, diff-able act instead of a silently flipped flag. It is a **soft control** — the gate cannot prove a human wrote the ledger entry, and a forged one passes. Git review is the checkpoint it enables, not one it replaces.

> Where the gate reads structure instead of prose, it wins. `method: "trace"` on an approved candidate is caught mechanically; "traced from a generated image" in a descriptor is caught only if someone writes it, and nobody defending a trace does. Prefer a structured field over a **rejection constraint** whenever the fact already has a home in the schema.

> The `decisions` block lives inside the brand kit rather than a companion file. It is contract data and no exporter serializes it, so nothing leaks downstream to signal-forge or image-gen. Split it out if candidate history ever grows large enough that reading a kit means paging past it — the trigger is file ergonomics, not correctness.

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
