/**
 * Consistency Review Gate
 *
 * Detects drift between a brand kit and its exported artifacts.
 * Compares the current brand-kit.json against the last-exported state
 * to flag changes that haven't been propagated.
 *
 * Also validates internal consistency:
 * - Spacing references exist in the scale
 * - Type scale steps reference valid fonts
 * - Media templates reference valid data fields
 */

import type { BrandKit } from '../schema/brand-kit.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConsistencyIssue {
  area: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ConsistencyReport {
  passed: boolean;
  issues: ConsistencyIssue[];
}

// ---------------------------------------------------------------------------
// Internal Consistency
// ---------------------------------------------------------------------------

export function reviewConsistency(kit: BrandKit): ConsistencyReport {
  const issues: ConsistencyIssue[] = [];

  // Layout references valid spacing scale keys
  const spacingKeys = Object.keys(kit.spacing);
  if (!spacingKeys.includes(kit.layout.sectionPadding)) {
    issues.push({
      area: 'layout.sectionPadding',
      message: `References spacing step "${kit.layout.sectionPadding}" which doesn't exist in the scale. Available: ${spacingKeys.join(', ')}`,
      severity: 'error',
    });
  }
  if (!spacingKeys.includes(kit.layout.containerPadding)) {
    issues.push({
      area: 'layout.containerPadding',
      message: `References spacing step "${kit.layout.containerPadding}" which doesn't exist in the scale. Available: ${spacingKeys.join(', ')}`,
      severity: 'error',
    });
  }

  // Type scale steps reference valid font roles
  const validFontRoles = ['display', 'body', 'mono'] as const;
  for (const step of kit.typography.scale.steps) {
    if (!validFontRoles.includes(step.font)) {
      issues.push({
        area: `typography.scale.steps[${step.name}]`,
        message: `References font role "${step.font}" — must be one of: ${validFontRoles.join(', ')}`,
        severity: 'error',
      });
    }
  }

  // Voice minimum score is reasonable
  if (kit.voice.minimumScore > 95) {
    issues.push({
      area: 'voice.minimumScore',
      message: `Score threshold ${kit.voice.minimumScore} is unrealistically high — most content will fail. Consider 60-80.`,
      severity: 'warning',
    });
  }

  // Brand identity has minimum viable content
  if (!kit.identity.tagline && !kit.identity.mission) {
    issues.push({
      area: 'identity',
      message: 'Brand kit has neither tagline nor mission — generators will produce generic output',
      severity: 'warning',
    });
  }
  if (kit.identity.personality.length === 0) {
    issues.push({
      area: 'identity.personality',
      message: 'No personality traits defined — AI generators need these to produce on-brand output',
      severity: 'warning',
    });
  }

  return {
    passed: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

// ---------------------------------------------------------------------------
// Drift Detection (between two kit versions)
// ---------------------------------------------------------------------------

export interface DriftChange {
  path: string;
  type: 'added' | 'removed' | 'changed';
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Shallow diff two brand kits. Returns list of changed paths.
 * Used by `brand-forge diff` and the pre-commit gate.
 */
export function diffBrandKits(prev: BrandKit, next: BrandKit): DriftChange[] {
  const changes: DriftChange[] = [];

  function walk(a: unknown, b: unknown, path: string) {
    if (a === b) return;

    if (typeof a !== typeof b || a === null || b === null) {
      changes.push({ path, type: 'changed', oldValue: a, newValue: b });
      return;
    }

    if (typeof a === 'object' && typeof b === 'object') {
      const aObj = a as Record<string, unknown>;
      const bObj = b as Record<string, unknown>;
      const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);

      for (const key of allKeys) {
        const childPath = path ? `${path}.${key}` : key;
        if (!(key in aObj)) {
          changes.push({ path: childPath, type: 'added', newValue: bObj[key] });
        } else if (!(key in bObj)) {
          changes.push({ path: childPath, type: 'removed', oldValue: aObj[key] });
        } else {
          walk(aObj[key], bObj[key], childPath);
        }
      }
      return;
    }

    changes.push({ path, type: 'changed', oldValue: a, newValue: b });
  }

  walk(prev, next, '');
  return changes;
}
