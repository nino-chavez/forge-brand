/**
 * Font Pairing Generator
 *
 * Proposes font pairings (display + body + mono) based on brand personality.
 * AI generates candidates. Font compatibility gate validates.
 * Human approves before locking into the kit.
 */

import type { TypographySystem } from '../schema/typography.js';
import { checkFontCompatibility } from '../schema/typography.js';
import { callModel } from './provider.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FontPairingProposal {
  name: string;
  description: string;
  typography: TypographySystem;
  compatReport: {
    displayBody: { compatible: boolean; issues: string[] };
    passing: boolean;
  };
}

export interface FontPairingOptions {
  personality: string[];
  domain?: string;
  /** Existing display font to keep (optional — only suggest body/mono) */
  anchorDisplay?: string;
  count?: number;
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildFontPrompt(options: FontPairingOptions): string {
  const { personality, domain, anchorDisplay, count = 3 } = options;

  return `You are a typography expert. Propose ${count} font pairings for a brand.

BRAND CONTEXT:
- Personality: ${personality.join(', ')}
${domain ? `- Industry: ${domain}` : ''}
${anchorDisplay ? `- MUST keep display font: ${anchorDisplay} (only suggest body + mono)` : ''}

REQUIREMENTS:
- All fonts must be available on Google Fonts (free)
- Display and body fonts should be different classifications (e.g. serif + sans-serif, display + sans-serif)
- Mono font should be a true monospace font
- Include specific weights that are available for each font
- Each pairing must create clear visual hierarchy

DO NOT:
- Pair two sans-serif fonts as display + body (low contrast)
- Suggest fonts that only have 1 weight (except Bebas Neue for display, which is fine)
- Suggest handwritten or novelty fonts unless personality explicitly demands it
- Pair display + monospace as primary pairing

OUTPUT FORMAT:
Return a JSON array of ${count} objects:
[{
  "name": "Pairing Name",
  "description": "Why this pairing works for this brand",
  "display": {
    "family": "Font Name",
    "classification": "serif|sans-serif|display|slab-serif|condensed",
    "weights": [400, 700],
    "googleFonts": "Font+Name:wght@400;700",
    "textTransform": "none|uppercase",
    "letterSpacing": 0
  },
  "body": {
    "family": "Font Name",
    "classification": "serif|sans-serif",
    "weights": [400, 500, 600, 700],
    "googleFonts": "Font+Name:wght@400;500;600;700",
    "textTransform": "none",
    "letterSpacing": 0
  },
  "mono": {
    "family": "Font Name",
    "classification": "monospace",
    "weights": [400, 700],
    "googleFonts": "Font+Name:wght@400;700",
    "textTransform": "none",
    "letterSpacing": 0
  }
}]

Return ONLY the JSON array, no other text.`;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateFontPairings(
  options: FontPairingOptions,
): Promise<FontPairingProposal[]> {
  const prompt = buildFontPrompt(options);
  const raw = await callModel(prompt);

  const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  const pairings = JSON.parse(jsonStr) as Array<{
    name: string;
    description: string;
    display: { family: string; classification: string; weights: number[]; googleFonts: string; textTransform: string; letterSpacing: number };
    body: { family: string; classification: string; weights: number[]; googleFonts: string; textTransform: string; letterSpacing: number };
    mono: { family: string; classification: string; weights: number[]; googleFonts: string; textTransform: string; letterSpacing: number };
  }>;

  return pairings.map((p) => {
    const displayStack = {
      family: p.display.family,
      fallbacks: ['system-ui', 'sans-serif'],
      classification: p.display.classification as any,
      weights: p.display.weights,
      variable: p.display.weights.length > 2,
      googleFonts: p.display.googleFonts,
      cssVariable: '--font-display',
      textTransform: (p.display.textTransform || 'none') as any,
      letterSpacing: p.display.letterSpacing || 0,
    };

    const bodyStack = {
      family: p.body.family,
      fallbacks: ['system-ui', 'sans-serif'],
      classification: p.body.classification as any,
      weights: p.body.weights,
      variable: p.body.weights.length > 2,
      googleFonts: p.body.googleFonts,
      cssVariable: '--font-body',
      textTransform: (p.body.textTransform || 'none') as any,
      letterSpacing: p.body.letterSpacing || 0,
    };

    const monoStack = {
      family: p.mono.family,
      fallbacks: ['Menlo', 'monospace'],
      classification: 'monospace' as const,
      weights: p.mono.weights,
      variable: p.mono.weights.length > 2,
      googleFonts: p.mono.googleFonts,
      cssVariable: '--font-mono',
      textTransform: (p.mono.textTransform || 'none') as any,
      letterSpacing: p.mono.letterSpacing || 0,
    };

    const displayBody = checkFontCompatibility(displayStack, bodyStack);

    return {
      name: p.name,
      description: p.description,
      typography: {
        display: displayStack,
        body: bodyStack,
        mono: monoStack,
        scale: {
          baseSizePx: 16,
          ratio: 'perfect-fourth' as const,
          steps: [
            { name: 'hero', sizeRem: 4, sizeMobileRem: 2.5, lineHeight: 1.1, weight: p.display.weights.includes(700) ? 700 : p.display.weights[0], font: 'display' as const },
            { name: 'h2', sizeRem: 2.25, sizeMobileRem: 1.75, lineHeight: 1.2, weight: p.display.weights.includes(600) ? 600 : p.display.weights[0], font: 'display' as const },
            { name: 'h3', sizeRem: 1.5, sizeMobileRem: 1.25, lineHeight: 1.3, weight: p.body.weights.includes(600) ? 600 : 500, font: 'body' as const },
            { name: 'body-lg', sizeRem: 1.125, lineHeight: 1.6, weight: 400, font: 'body' as const },
            { name: 'body', sizeRem: 1, lineHeight: 1.5, weight: 400, font: 'body' as const },
            { name: 'caption', sizeRem: 0.875, lineHeight: 1.5, weight: 400, font: 'body' as const },
            { name: 'label', sizeRem: 0.75, lineHeight: 1.4, weight: p.mono.weights.includes(500) ? 500 : 400, font: 'mono' as const },
          ],
        },
      },
      compatReport: {
        displayBody,
        passing: displayBody.compatible,
      },
    };
  });
}
