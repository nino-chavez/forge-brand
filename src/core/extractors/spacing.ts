/**
 * Spacing Extractor
 *
 * Parses spacing patterns from Tailwind classes and CSS values.
 */

import { deduplicateByFrequency } from './utils.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtractedSpacing {
  /** Unique rem values found, sorted by frequency */
  values: number[];
  /** Most common large spacing value (for section padding) */
  sectionPadding?: string;
}

// ---------------------------------------------------------------------------
// Tailwind Step → Rem Mapping (default scale)
// ---------------------------------------------------------------------------

const TW_STEP_TO_REM: Record<number, number> = {
  0: 0, 0.5: 0.125, 1: 0.25, 1.5: 0.375, 2: 0.5, 2.5: 0.625,
  3: 0.75, 3.5: 0.875, 4: 1, 5: 1.25, 6: 1.5, 7: 1.75,
  8: 2, 9: 2.25, 10: 2.5, 11: 2.75, 12: 3, 14: 3.5,
  16: 4, 20: 5, 24: 6, 28: 7, 32: 8, 36: 9,
  40: 10, 44: 11, 48: 12, 52: 13, 56: 14, 60: 15, 64: 16,
  72: 18, 80: 20, 96: 24,
};

// brand-forge spacing scale keys
const BRAND_FORGE_STEPS = ['1', '2', '3', '4', '6', '8', '12', '16', '24'];
const BRAND_FORGE_STEP_VALUES = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6];

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

/**
 * Extract spacing patterns from source file contents.
 */
export function extractSpacing(contents: string[]): ExtractedSpacing | undefined {
  const remValues: number[] = [];

  for (const content of contents) {
    // Tailwind spacing classes: p-8, px-4, my-12, gap-6, space-y-4
    const twSpacing = content.matchAll(
      /(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-[xy])-(\d+(?:\.\d+)?)\b/g,
    );
    for (const match of twSpacing) {
      const step = parseFloat(match[1]);
      const rem = TW_STEP_TO_REM[step];
      if (rem !== undefined) {
        remValues.push(rem);
      }
    }

    // Tailwind arbitrary spacing: p-[2rem], m-[24px]
    const twArbitrary = content.matchAll(
      /(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap)-\[(\d+(?:\.\d+)?)(rem|px)\]/g,
    );
    for (const match of twArbitrary) {
      const val = parseFloat(match[1]);
      const unit = match[2];
      remValues.push(unit === 'px' ? val / 16 : val);
    }

    // CSS padding/margin/gap values
    const cssSpacing = content.matchAll(
      /(?:padding|margin|gap):\s*(\d+(?:\.\d+)?)(rem|px)/g,
    );
    for (const match of cssSpacing) {
      const val = parseFloat(match[1]);
      const unit = match[2];
      remValues.push(unit === 'px' ? val / 16 : val);
    }
  }

  if (remValues.length === 0) return undefined;

  const ranked = deduplicateByFrequency(remValues);

  // Find the most common "large" spacing value (>= 3rem) for section padding
  const largeValues = ranked.filter((v) => v >= 3);
  let sectionPadding: string | undefined;
  if (largeValues.length > 0) {
    // Map to nearest brand-forge step
    const nearest = findNearestStep(largeValues[0]);
    if (nearest) sectionPadding = nearest;
  }

  return { values: ranked, sectionPadding };
}

/**
 * Find the nearest brand-forge spacing step for a rem value.
 */
function findNearestStep(rem: number): string | undefined {
  let bestIdx = 0;
  let bestDist = Math.abs(BRAND_FORGE_STEP_VALUES[0] - rem);
  for (let i = 1; i < BRAND_FORGE_STEP_VALUES.length; i++) {
    const dist = Math.abs(BRAND_FORGE_STEP_VALUES[i] - rem);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return BRAND_FORGE_STEPS[bestIdx];
}
