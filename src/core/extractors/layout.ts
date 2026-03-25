/**
 * Layout Extractor
 *
 * Parses max-width and container patterns from source files.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtractedLayout {
  maxWidth?: number; // in rem
}

// ---------------------------------------------------------------------------
// Tailwind max-w → rem mapping
// ---------------------------------------------------------------------------

const TW_MAX_W_TO_REM: Record<string, number> = {
  'xs': 20,      // 320px
  'sm': 24,      // 384px
  'md': 28,      // 448px
  'lg': 32,      // 512px
  'xl': 36,      // 576px
  '2xl': 42,     // 672px
  '3xl': 48,     // 768px
  '4xl': 56,     // 896px
  '5xl': 64,     // 1024px
  '6xl': 72,     // 1152px
  '7xl': 80,     // 1280px
  'screen-sm': 40,   // 640px
  'screen-md': 48,   // 768px
  'screen-lg': 64,   // 1024px
  'screen-xl': 80,   // 1280px
  'screen-2xl': 96,  // 1536px
};

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

/**
 * Extract layout constraints from source file contents.
 */
export function extractLayout(contents: string[]): ExtractedLayout | undefined {
  const maxWidths: number[] = [];

  for (const content of contents) {
    // Tailwind max-w-* classes (including arbitrary values with brackets)
    const twMaxW = content.matchAll(/max-w-([\w\[\].\-]+)/g);
    for (const match of twMaxW) {
      const key = match[1];
      // Arbitrary value: max-w-[80rem] or max-w-[1280px]
      const arbitrary = key.match(/^\[(\d+(?:\.\d+)?)(rem|px)\]$/);
      if (arbitrary) {
        const val = parseFloat(arbitrary[1]);
        maxWidths.push(arbitrary[2] === 'px' ? val / 16 : val);
      } else if (TW_MAX_W_TO_REM[key] !== undefined) {
        maxWidths.push(TW_MAX_W_TO_REM[key]);
      }
    }

    // CSS max-width property
    const cssMaxW = content.matchAll(/max-width:\s*(\d+(?:\.\d+)?)(rem|px)/g);
    for (const match of cssMaxW) {
      const val = parseFloat(match[1]);
      maxWidths.push(match[2] === 'px' ? val / 16 : val);
    }
  }

  if (maxWidths.length === 0) return undefined;

  // Use the most common max-width, preferring larger content-width values (>= 40rem)
  const contentWidths = maxWidths.filter((w) => w >= 40);
  const maxWidth = contentWidths.length > 0
    ? mostCommon(contentWidths)
    : mostCommon(maxWidths);

  return { maxWidth };
}

function mostCommon(values: number[]): number {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = values[0];
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) { best = v; bestCount = c; }
  }
  return best;
}
