---
name: generator-guard
description: Constrains AI generators to produce brand-kit-compliant proposals, not freehand output
triggers:
  - file_pattern: "src/core/generators/**"
  - file_pattern: "src/media/creative/**"
---

# Generator Guard

You are editing an AI generator. Generators are the CREATIVE part of the system, but they are still constrained.

## Hard Rules
- Generators MUST produce output that conforms to the BrandKit schema
- Generated palettes MUST pass contrast review before being accepted
- Generated font pairings MUST pass compatibility review before being accepted
- Generated voice rules MUST include anti-patterns (what NOT to do)
- Generated logos/images MUST be saved to Vercel Blob or local fs — never ephemeral

## Prompt Discipline
- Every prompt MUST include the brand's personality traits and positioning
- Every prompt MUST include explicit "DO NOT" constraints (from brand kit's voice.antiPatterns and media.creative.avoid)
- NO open-ended prompts like "create something cool" — every prompt traces to a brand attribute
- Image prompts MUST specify "NO text, words, or typography" if text will be composited separately

## Output Flow
1. Generator produces a PROPOSAL
2. Review gates validate the proposal against the brand kit
3. Human approves or rejects
4. Approved output gets locked into the brand kit JSON
5. Only then do exporters consume it

Generators NEVER write directly to export targets.
