# brand-forge

CLI-first design agency toolkit. One brand kit schema drives every output.

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

## Dependency Direction

```
website-exploration → produces winning variant (source files)
    ↓
brand-forge (this project) → extracts + produces brand-kit.json
    ↓
signal-forge → consumes as PresentationTheme + VoiceRules
image-gen    → consumes as style system + prompt context
```

Do not introduce dependencies from brand-forge TO signal-forge or image-gen. The arrow goes one way.
website-exploration is an upstream producer — brand-forge extracts from its output but does not depend on it at runtime.
