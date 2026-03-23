---
name: brand-kit-guard
description: Validates brand kit schema compliance and anti-slop rules during implementation
triggers:
  - file_pattern: "src/core/schema/**"
  - file_pattern: "presets/**"
  - file_pattern: "brand-kit.json"
---

# Brand Kit Guard

You are editing brand-forge schema or preset files. Enforce these rules:

## Schema Rules
- Every color MUST be a 7-char hex string with `#` prefix
- Every font stack MUST include at least one weight and a classification
- Every type scale step MUST reference a valid font role: `display`, `body`, or `mono`
- Every spacing value MUST be in rem (not px, not em)
- Brand identity MUST have at least `name` and one of `tagline` or `mission`
- Voice system MUST have at least one attribute and `minimumScore` between 60-90

## Anti-Slop Checks
- NO trend-chasing color names ("millennial pink", "gen-z yellow") — use descriptive names tied to brand ("Flickday Yellow", "Rally Orange")
- NO generic personality traits ("modern", "clean", "professional") without brand-specific justification
- NO copy-paste font stacks from other brands — verify each font is licensed and available
- NO semantic color values that are too similar to primary/accent (causes confusion)
- NO spacing scales with gaps (if you have step 8, you need 6 and 12)

## When Editing Presets
- Run `parseBrandKit()` mentally against the JSON — every required field must exist
- Cross-check colors against WCAG AA (4.5:1 for text on background)
- Verify font weights in the scale match the font stack's available weights
