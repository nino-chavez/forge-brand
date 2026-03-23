---
name: exporter-guard
description: Ensures exporters are pure deterministic transforms with no AI or side effects
triggers:
  - file_pattern: "src/core/exporters/**"
---

# Exporter Guard

You are editing a brand-forge exporter. Exporters are the MOST constrained part of the system.

## Hard Rules
- Exporters MUST be pure functions: `(kit: BrandKit, options?) => string | Buffer`
- NO AI calls. NO network requests. NO file system reads (except the kit itself).
- NO randomness. Same input MUST produce identical output every time.
- NO hardcoded values — everything comes from the BrandKit schema.
- NO framework-specific assumptions in shared exporters. Framework-specific logic goes in dedicated exporters (e.g., `tailwind.ts`, `svelte.ts`).

## Output Format Rules
- CSS exporter: use CSS custom properties with `--brand-` prefix
- Tailwind exporter: output a valid `preset` object, not a full config
- Markdown exporter: follow the same structure as flickdaymedia's DESIGN-SYSTEM.md
- JSON exporter: output the raw BrandKit (useful for downstream consumers)

## Testing Mental Model
If you can't write a snapshot test for the exporter, it's not deterministic enough.
