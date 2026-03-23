/**
 * Font Compatibility Review Gate
 *
 * Validates font pairings and weight availability.
 * Flags incompatible pairings before they reach production.
 */

import type { BrandKit } from '../schema/brand-kit.js';
import { checkFontCompatibility, type FontStack } from '../schema/typography.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FontIssue {
  pair: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface FontCompatReport {
  passed: boolean;
  issues: FontIssue[];
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

export function reviewFontCompat(kit: BrandKit): FontCompatReport {
  const issues: FontIssue[] = [];
  const { display, body, mono } = kit.typography;

  // Check display + body pairing
  const displayBody = checkFontCompatibility(display, body);
  for (const issue of displayBody.issues) {
    issues.push({
      pair: `${display.family} + ${body.family}`,
      message: issue,
      severity: 'warning',
    });
  }

  // Check body + mono pairing (less critical but still relevant)
  const bodyMono = checkFontCompatibility(body, mono);
  for (const issue of bodyMono.issues) {
    // mono is expected to be different classification, so relax
    if (!issue.includes('same class')) {
      issues.push({
        pair: `${body.family} + ${mono.family}`,
        message: issue,
        severity: 'warning',
      });
    }
  }

  // Check that type scale references valid weights
  for (const step of kit.typography.scale.steps) {
    const font = kit.typography[step.font];
    if (!font.weights.includes(step.weight)) {
      issues.push({
        pair: `${font.family} @ weight ${step.weight}`,
        message: `Type scale step "${step.name}" uses weight ${step.weight} but ${font.family} only has weights: ${font.weights.join(', ')}`,
        severity: 'error',
      });
    }
  }

  return {
    passed: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}
