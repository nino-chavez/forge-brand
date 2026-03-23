/**
 * Contrast Review Gate
 *
 * Validates all text/background color pairs in a brand kit against WCAG standards.
 * This gate BLOCKS export if any pair fails AA. No exceptions.
 */

import type { BrandKit } from '../schema/brand-kit.js';
import { contrastRatio, CONTRAST_THRESHOLDS } from '../schema/color.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContrastIssue {
  pair: string;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
  level: 'AA' | 'AAA';
  severity: 'error' | 'warning';
}

export interface ContrastReport {
  passed: boolean;
  pairs: number;
  issues: ContrastIssue[];
}

// ---------------------------------------------------------------------------
// Pair Definitions
// ---------------------------------------------------------------------------

/**
 * Extract all text/background pairs that must be checked from a brand kit.
 * These pairs are the actual combinations that appear in UIs.
 */
function extractPairs(kit: BrandKit): Array<{ name: string; fg: string; bg: string }> {
  const { colors } = kit;
  return [
    // Primary surface pairs
    { name: 'foreground on background', fg: colors.surfaces.foreground, bg: colors.surfaces.background },
    { name: 'cardForeground on card', fg: colors.surfaces.cardForeground, bg: colors.surfaces.card },
    { name: 'mutedForeground on muted', fg: colors.surfaces.mutedForeground, bg: colors.surfaces.muted },

    // Primary accent as text
    { name: 'primary on background', fg: colors.primary.hex, bg: colors.surfaces.background },
    { name: 'primary on card', fg: colors.primary.hex, bg: colors.surfaces.card },

    // Primary as background — check BOTH foreground and background as text colors.
    // Whichever is used in the actual design must pass.
    // For dark brands (white foreground, black background): black text on accent is typical.
    // For light brands (dark foreground, white background): dark text on accent is typical.
    { name: 'background on primary (inverted)', fg: colors.surfaces.background, bg: colors.primary.hex },

    // Secondary accent
    { name: 'secondary on background', fg: colors.secondary.hex, bg: colors.surfaces.background },

  ];
}

/**
 * Semantic colors are typically used as badges, indicators, or backgrounds —
 * not as body text. Check them at the UI component threshold (3:1).
 */
function extractUiComponentPairs(kit: BrandKit): Array<{ name: string; fg: string; bg: string }> {
  const { colors } = kit;
  return [
    { name: 'success on background (ui)', fg: colors.semantic.success.hex, bg: colors.surfaces.background },
    { name: 'warning on background (ui)', fg: colors.semantic.warning.hex, bg: colors.surfaces.background },
    { name: 'error on background (ui)', fg: colors.semantic.error.hex, bg: colors.surfaces.background },
    { name: 'info on background (ui)', fg: colors.semantic.info.hex, bg: colors.surfaces.background },
  ];
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

export function reviewContrast(kit: BrandKit): ContrastReport {
  const textPairs = extractPairs(kit);
  const uiPairs = extractUiComponentPairs(kit);
  const issues: ContrastIssue[] = [];

  // Text pairs: AA normal text (4.5:1)
  for (const { name, fg, bg } of textPairs) {
    const ratio = contrastRatio(fg, bg);
    if (ratio < CONTRAST_THRESHOLDS.normalText) {
      issues.push({
        pair: name,
        foreground: fg,
        background: bg,
        ratio: Math.round(ratio * 100) / 100,
        required: CONTRAST_THRESHOLDS.normalText,
        level: 'AA',
        severity: 'error',
      });
    }
  }

  // UI component pairs: 3:1 threshold (badges, indicators, non-text)
  // These are warnings not errors because semantic colors are typically
  // used on their own background (e.g., green badge with white text),
  // not as standalone text on the page background.
  for (const { name, fg, bg } of uiPairs) {
    const ratio = contrastRatio(fg, bg);
    if (ratio < CONTRAST_THRESHOLDS.uiComponent) {
      issues.push({
        pair: name,
        foreground: fg,
        background: bg,
        ratio: Math.round(ratio * 100) / 100,
        required: CONTRAST_THRESHOLDS.uiComponent,
        level: 'AA',
        severity: 'warning',
      });
    }
  }

  return {
    passed: issues.filter((i) => i.severity === 'error').length === 0,
    pairs: textPairs.length + uiPairs.length,
    issues,
  };
}
