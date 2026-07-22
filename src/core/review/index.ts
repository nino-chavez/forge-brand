/**
 * Review System — The QA Gate
 *
 * Every output passes through this before export.
 * If any gate returns severity: 'error', the export is blocked.
 *
 * Gates run in order:
 * 1. Contrast — are text/background pairs accessible?
 * 2. Font compatibility — do font pairings work optically?
 * 3. Consistency — is the kit internally coherent?
 * 4. Decisions — did a human approve this, and does it violate a past rejection?
 *
 * The full report is what `brand-forge review` prints.
 */

import type { BrandKit } from '../schema/brand-kit.js';
import { reviewContrast, type ContrastReport } from './contrast.js';
import { reviewFontCompat, type FontCompatReport } from './font-compat.js';
import { reviewConsistency, type ConsistencyReport } from './consistency.js';
import { reviewDecisions, type DecisionsReport } from './decisions.js';

// ---------------------------------------------------------------------------
// Full Review Report
// ---------------------------------------------------------------------------

export interface ReviewReport {
  passed: boolean;
  timestamp: string;
  kit: { id: string; name: string; version: string };
  gates: {
    contrast: ContrastReport;
    fontCompat: FontCompatReport;
    consistency: ConsistencyReport;
    decisions: DecisionsReport;
  };
  errorCount: number;
  warningCount: number;
}

export function reviewBrandKit(kit: BrandKit): ReviewReport {
  const contrast = reviewContrast(kit);
  const fontCompat = reviewFontCompat(kit);
  const consistency = reviewConsistency(kit);
  const decisions = reviewDecisions(kit);

  const allIssues = [
    ...contrast.issues,
    ...fontCompat.issues,
    ...consistency.issues,
    ...decisions.issues,
  ];

  const errorCount = allIssues.filter((i) => i.severity === 'error').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;

  return {
    passed:
      contrast.passed &&
      fontCompat.passed &&
      consistency.passed &&
      decisions.passed,
    timestamp: new Date().toISOString(),
    kit: {
      id: kit.meta.id,
      name: kit.identity.name,
      version: kit.meta.version,
    },
    gates: { contrast, fontCompat, consistency, decisions },
    errorCount,
    warningCount,
  };
}

// Re-export individual gates
export { reviewContrast, type ContrastReport } from './contrast.js';
export { reviewFontCompat, type FontCompatReport } from './font-compat.js';
export {
  reviewConsistency,
  diffBrandKits,
  type ConsistencyReport,
  type DriftChange,
} from './consistency.js';
export {
  reviewDecisions,
  matchesPattern,
  violatedPatterns,
  type DecisionsReport,
  type DecisionsIssue,
} from './decisions.js';
