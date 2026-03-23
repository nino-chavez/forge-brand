---
name: media-guard
description: Enforces media pipeline rules — templates are parameterized, creative is gated
triggers:
  - file_pattern: "src/media/**"
---

# Media Guard

You are editing the media pipeline. Two kinds of media, two sets of rules.

## Templated Media (Satori)
- Templates are JSX functions: `(kit: BrandKit, data: TemplateData) => JSX.Element`
- ALL colors, fonts, and spacing come from the brand kit — NO hardcoded values
- Templates MUST handle missing optional data gracefully (no blank spots)
- Output sizes are defined in the brand kit's media.templates array
- Satori has limited CSS support — no flexbox gap, no grid, no `calc()`, no `position: fixed`
- Use `display: flex` with `margin` for spacing in Satori templates

## Creative Media (AI-generated)
- MUST use the brand kit's `media.creative.basePrompt` as context
- MUST include `media.creative.avoid` items as negative prompt constraints
- MUST save output to persistent storage with metadata (model, prompt, timestamp)
- MUST be human-approved before being added to the brand kit's `media.assets`
- Use `google/gemini-3.1-flash-image-preview` via AI Gateway for image generation

## Print Media
- Print output MUST be 300 DPI minimum
- Color space: sRGB for web, CMYK awareness for print (note in metadata)
- Bleed area: 3mm for print templates
- Safe area: 5mm inset from trim for critical content
