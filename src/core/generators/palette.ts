/**
 * Palette Generator
 *
 * Proposes color palettes based on brand personality and constraints.
 * AI generates candidates. Review gate validates contrast.
 * Human approves before locking into the kit.
 *
 * Uses AI Gateway via plain model strings when VERCEL_OIDC_TOKEN is available,
 * falls back to direct Anthropic SDK when ANTHROPIC_API_KEY is set.
 */

import type { ColorSystem } from '../schema/color.js';
import { contrastRatio, CONTRAST_THRESHOLDS } from '../schema/color.js';
import { callModel } from './provider.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaletteProposal {
  name: string;
  description: string;
  colors: ColorSystem;
  contrastReport: {
    textOnBg: number;
    primaryOnBg: number;
    passing: boolean;
  };
}

export interface PaletteGeneratorOptions {
  /** Brand personality traits to inform the palette */
  personality: string[];
  /** Target mode */
  mode: 'dark' | 'light';
  /** Number of proposals to generate */
  count?: number;
  /** Existing primary color to anchor around (optional) */
  anchorColor?: string;
  /** Industry/domain context */
  domain?: string;
}

// ---------------------------------------------------------------------------
// Prompt Construction
// ---------------------------------------------------------------------------

function buildPalettePrompt(options: PaletteGeneratorOptions): string {
  const { personality, mode, count = 3, anchorColor, domain } = options;

  return `You are a brand color system designer. Generate ${count} distinct color palette proposals.

BRAND CONTEXT:
- Personality: ${personality.join(', ')}
- Theme mode: ${mode}
${domain ? `- Industry: ${domain}` : ''}
${anchorColor ? `- Must include this primary color: ${anchorColor}` : ''}

REQUIREMENTS:
- Every palette must pass WCAG AA contrast (4.5:1 for text on background)
- Primary color must be visually distinct from secondary
- Accent color should complement but not clash with primary
- Neutral scale must progress evenly from light to dark
- Semantic colors (success=green, warning=amber, error=red, info=blue) must be visible on the background
${mode === 'dark' ? '- Dark mode: background should be near-black (#0a-#1a range), text should be light' : '- Light mode: background should be near-white (#f5-#ff range), text should be dark'}

DO NOT:
- Use trendy/seasonal colors without functional justification
- Copy popular brand palettes (Material, Tailwind defaults)
- Generate colors that look similar to each other
- Use pure white (#ffffff) or pure black (#000000) as primary/secondary

OUTPUT FORMAT:
Return a JSON array of ${count} palette objects, each with this exact structure:
{
  "name": "Palette Name",
  "description": "Why this palette works for this brand",
  "primary": { "hex": "#rrggbb", "name": "Color Name" },
  "secondary": { "hex": "#rrggbb", "name": "Color Name" },
  "accent": { "hex": "#rrggbb", "name": "Color Name" },
  "background": "#rrggbb",
  "foreground": "#rrggbb"
}

Return ONLY the JSON array, no other text.`;
}


// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/**
 * Generate palette proposals. Returns proposals with contrast reports.
 * The caller (CLI) presents these for human approval.
 */
export async function generatePalettes(
  options: PaletteGeneratorOptions,
): Promise<PaletteProposal[]> {
  const prompt = buildPalettePrompt(options);
  const raw = await callModel(prompt);

  // Parse JSON from response (handle markdown code blocks)
  const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  const palettes = JSON.parse(jsonStr) as Array<{
    name: string;
    description: string;
    primary: { hex: string; name: string };
    secondary: { hex: string; name: string };
    accent: { hex: string; name: string };
    background: string;
    foreground: string;
  }>;

  return palettes.map((p) => {
    const textOnBg = contrastRatio(p.foreground, p.background);
    const primaryOnBg = contrastRatio(p.primary.hex, p.background);

    return {
      name: p.name,
      description: p.description,
      colors: {
        primary: { hex: p.primary.hex, name: p.primary.name, usage: 'Primary accent' },
        secondary: { hex: p.secondary.hex, name: p.secondary.name, usage: 'Secondary accent' },
        accent: { hex: p.accent.hex, name: p.accent.name, usage: 'Accent' },
        neutral: options.mode === 'dark'
          ? { '50': '#fafafa', '100': '#f5f5f5', '200': '#e5e5e5', '300': '#d1d5db', '400': '#a3a3a3', '500': '#6b7280', '600': '#525252', '700': '#374151', '800': '#262626', '900': '#111827', '950': '#0a0a0f' }
          : { '50': '#fafaf9', '100': '#f5f5f4', '200': '#e7e5e4', '300': '#d6d3d1', '400': '#a8a29e', '500': '#78716c', '600': '#57534e', '700': '#44403c', '800': '#292524', '900': '#1c1917', '950': '#0c0a09' },
        semantic: {
          success: { hex: '#22c55e', name: 'Success', usage: 'Positive states' },
          warning: { hex: '#f59e0b', name: 'Warning', usage: 'Caution states' },
          error: { hex: '#ef4444', name: 'Error', usage: 'Error states' },
          info: { hex: '#3b82f6', name: 'Info', usage: 'Informational states' },
        },
        surfaces: {
          background: p.background,
          foreground: p.foreground,
          card: options.mode === 'dark' ? '#111827' : '#ffffff',
          cardForeground: p.foreground,
          muted: options.mode === 'dark' ? '#1f2937' : '#f5f5f4',
          mutedForeground: options.mode === 'dark' ? '#9ca3af' : '#57534e',
          border: options.mode === 'dark' ? '#374151' : '#e7e5e4',
        },
      },
      contrastReport: {
        textOnBg: Math.round(textOnBg * 100) / 100,
        primaryOnBg: Math.round(primaryOnBg * 100) / 100,
        passing: textOnBg >= CONTRAST_THRESHOLDS.normalText && primaryOnBg >= CONTRAST_THRESHOLDS.normalText,
      },
    };
  });
}
