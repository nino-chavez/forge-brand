/**
 * Color Schema
 *
 * All colors stored as 6-char hex WITH '#' prefix (web standard).
 * Exporters strip the '#' for consumers that need it (e.g., PptxGenJS).
 *
 * Contrast validation is built into the schema — colors that claim to be
 * text/background pairs must pass WCAG AA (4.5:1 for normal text).
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** 7-char hex color: #rrggbb */
const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a 6-digit hex color with # prefix');

/** A named color with usage context */
export const ColorToken = z.object({
  hex: hexColor,
  name: z.string().min(1).describe('Human-readable name, e.g. "Flickday Yellow"'),
  usage: z.string().optional().describe('Where/how this color is used'),
});
export type ColorToken = z.infer<typeof ColorToken>;

// ---------------------------------------------------------------------------
// Scales
// ---------------------------------------------------------------------------

/** Neutral scale — must have at least 50, 100, 200, ..., 900, 950 */
export const NeutralScale = z.object({
  '50': hexColor,
  '100': hexColor,
  '200': hexColor,
  '300': hexColor,
  '400': hexColor,
  '500': hexColor,
  '600': hexColor,
  '700': hexColor,
  '800': hexColor,
  '900': hexColor,
  '950': hexColor,
});
export type NeutralScale = z.infer<typeof NeutralScale>;

// ---------------------------------------------------------------------------
// Semantic Colors
// ---------------------------------------------------------------------------

export const SemanticColors = z.object({
  success: ColorToken,
  warning: ColorToken,
  error: ColorToken,
  info: ColorToken,
});
export type SemanticColors = z.infer<typeof SemanticColors>;

// ---------------------------------------------------------------------------
// Surface Colors
// ---------------------------------------------------------------------------

export const SurfaceColors = z.object({
  background: hexColor.describe('Page/app background'),
  foreground: hexColor.describe('Default text on background'),
  card: hexColor.describe('Card/panel surface'),
  cardForeground: hexColor.describe('Text on card surface'),
  muted: hexColor.describe('Muted/secondary background'),
  mutedForeground: hexColor.describe('Text on muted background'),
  border: hexColor.describe('Default border color'),
});
export type SurfaceColors = z.infer<typeof SurfaceColors>;

// ---------------------------------------------------------------------------
// Full Color System
// ---------------------------------------------------------------------------

export const ColorSystem = z.object({
  primary: ColorToken,
  secondary: ColorToken,
  accent: ColorToken,
  neutral: NeutralScale,
  semantic: SemanticColors,
  surfaces: SurfaceColors,
});
export type ColorSystem = z.infer<typeof ColorSystem>;

// ---------------------------------------------------------------------------
// Contrast Utilities (used by review gates, not by schema validation)
// ---------------------------------------------------------------------------

/**
 * Relative luminance per WCAG 2.1
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const srgb = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );

  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/**
 * Contrast ratio between two hex colors.
 * Returns a number >= 1. WCAG AA requires >= 4.5 for normal text, >= 3 for large text.
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA thresholds */
export const CONTRAST_THRESHOLDS = {
  normalText: 4.5,
  largeText: 3.0,
  uiComponent: 3.0,
} as const;
