/**
 * Typography Schema
 *
 * Defines font stacks, type scales, and pairing rules.
 * Modular scale ratios follow Robert Bringhurst's classifications.
 * Font metadata enables compatibility checks in the review gate.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Font Classification
// ---------------------------------------------------------------------------

export const FontClassification = z.enum([
  'sans-serif',
  'serif',
  'slab-serif',
  'monospace',
  'display',
  'handwritten',
  'condensed',
]);
export type FontClassification = z.infer<typeof FontClassification>;

// ---------------------------------------------------------------------------
// Font Stack
// ---------------------------------------------------------------------------

export const FontStack = z.object({
  family: z.string().min(1).describe('Primary font family name'),
  fallbacks: z.array(z.string()).default([]).describe('CSS fallback stack'),
  classification: FontClassification,
  /** Available weights — used for compatibility checks */
  weights: z.array(z.number().min(100).max(900)).min(1),
  /** Is this a variable font? */
  variable: z.boolean().default(false),
  /** Google Fonts family name (if applicable) */
  googleFonts: z.string().optional(),
  /** Adobe Typekit ID (if applicable) */
  typekitId: z.string().optional(),
  /** Local file path (if self-hosted) */
  localPath: z.string().optional(),
  /** CSS variable name for this font */
  cssVariable: z.string().optional().describe('e.g. --font-display'),
  /** Text transform applied to this font by default */
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).default('none'),
  /** Letter spacing adjustment (em units) */
  letterSpacing: z.number().default(0),
});
export type FontStack = z.infer<typeof FontStack>;

// ---------------------------------------------------------------------------
// Type Scale
// ---------------------------------------------------------------------------

/** Named scale ratios from classical typography */
export const ScaleRatio = z.enum([
  'minor-second',    // 1.067
  'major-second',    // 1.125
  'minor-third',     // 1.200
  'major-third',     // 1.250
  'perfect-fourth',  // 1.333
  'augmented-fourth', // 1.414
  'perfect-fifth',   // 1.500
  'golden-ratio',    // 1.618
]);
export type ScaleRatio = z.infer<typeof ScaleRatio>;

export const SCALE_VALUES: Record<ScaleRatio, number> = {
  'minor-second': 1.067,
  'major-second': 1.125,
  'minor-third': 1.2,
  'major-third': 1.25,
  'perfect-fourth': 1.333,
  'augmented-fourth': 1.414,
  'perfect-fifth': 1.5,
  'golden-ratio': 1.618,
};

export const TypeScaleStep = z.object({
  /** Step name */
  name: z.string(),
  /** Font size in rem */
  sizeRem: z.number().positive(),
  /** Font size in rem for mobile */
  sizeMobileRem: z.number().positive().optional(),
  /** Line height (unitless multiplier) */
  lineHeight: z.number().positive(),
  /** Font weight */
  weight: z.number().min(100).max(900),
  /** Which font stack to use */
  font: z.enum(['display', 'body', 'mono']),
});
export type TypeScaleStep = z.infer<typeof TypeScaleStep>;

export const TypeScale = z.object({
  /** Base size in pixels (typically 16) */
  baseSizePx: z.number().positive().default(16),
  /** Scale ratio for size progression */
  ratio: ScaleRatio,
  /** Explicit named steps */
  steps: z.array(TypeScaleStep).min(1),
});
export type TypeScale = z.infer<typeof TypeScale>;

// ---------------------------------------------------------------------------
// Full Typography System
// ---------------------------------------------------------------------------

export const TypographySystem = z.object({
  display: FontStack.describe('Headlines, hero text'),
  body: FontStack.describe('Running text, paragraphs'),
  mono: FontStack.describe('Code, labels, technical text'),
  scale: TypeScale,
});
export type TypographySystem = z.infer<typeof TypographySystem>;

// ---------------------------------------------------------------------------
// Compatibility Checks (used by review gates)
// ---------------------------------------------------------------------------

/**
 * Check if two font stacks are optically compatible for pairing.
 * Rules:
 * - Same classification is usually bad (except serif + slab-serif)
 * - display + monospace rarely works
 * - At least one shared weight is required
 */
export function checkFontCompatibility(
  a: FontStack,
  b: FontStack,
): { compatible: boolean; issues: string[] } {
  const issues: string[] = [];

  // Same classification (except serif variants)
  if (a.classification === b.classification) {
    const serifPair =
      (a.classification === 'serif' || a.classification === 'slab-serif') &&
      (b.classification === 'serif' || b.classification === 'slab-serif');
    if (!serifPair) {
      issues.push(
        `Both fonts are ${a.classification} — pairing fonts of the same class reduces visual contrast`,
      );
    }
  }

  // display + monospace is almost always bad
  if (
    (a.classification === 'display' && b.classification === 'monospace') ||
    (a.classification === 'monospace' && b.classification === 'display')
  ) {
    issues.push('Display + monospace pairing is rarely effective');
  }

  // Check for shared weights
  const sharedWeights = a.weights.filter((w) => b.weights.includes(w));
  if (sharedWeights.length === 0) {
    issues.push('No shared font weights — may cause visual inconsistency in UI');
  }

  return { compatible: issues.length === 0, issues };
}
