/**
 * Color Extractor
 *
 * Parses hex colors from source files using regex patterns.
 * Ranks by frequency, classifies by luminance context.
 */

import { relativeLuminance } from '../schema/color.js';
import { normalizeHex, deduplicateByFrequency, countFrequency } from './utils.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtractedColors {
  primary?: { hex: string; name?: string };
  secondary?: { hex: string; name?: string };
  accent?: { hex: string; name?: string };
  background?: string;
  foreground?: string;
  /** All unique hex values found, sorted by frequency */
  allExtracted: string[];
}

interface ContextualHex {
  hex: string;
  context: 'background' | 'text' | 'border' | 'general';
}

// ---------------------------------------------------------------------------
// Regex Patterns
// ---------------------------------------------------------------------------

const PATTERNS: Array<{ regex: RegExp; context: ContextualHex['context'] }> = [
  // Tailwind arbitrary values
  { regex: /bg-\[#([0-9a-fA-F]{3,8})\]/g, context: 'background' },
  { regex: /text-\[#([0-9a-fA-F]{3,8})\]/g, context: 'text' },
  { regex: /border-\[#([0-9a-fA-F]{3,8})\]/g, context: 'border' },
  { regex: /ring-\[#([0-9a-fA-F]{3,8})\]/g, context: 'general' },
  { regex: /from-\[#([0-9a-fA-F]{3,8})\]/g, context: 'background' },
  { regex: /to-\[#([0-9a-fA-F]{3,8})\]/g, context: 'background' },
  { regex: /via-\[#([0-9a-fA-F]{3,8})\]/g, context: 'background' },
  { regex: /shadow-\[#([0-9a-fA-F]{3,8})\]/g, context: 'general' },
  { regex: /fill-\[#([0-9a-fA-F]{3,8})\]/g, context: 'general' },
  { regex: /stroke-\[#([0-9a-fA-F]{3,8})\]/g, context: 'general' },
  { regex: /accent-\[#([0-9a-fA-F]{3,8})\]/g, context: 'general' },
  { regex: /divide-\[#([0-9a-fA-F]{3,8})\]/g, context: 'border' },
  { regex: /outline-\[#([0-9a-fA-F]{3,8})\]/g, context: 'border' },
  { regex: /placeholder-\[#([0-9a-fA-F]{3,8})\]/g, context: 'text' },

  // CSS properties
  { regex: /background(?:-color)?:\s*#([0-9a-fA-F]{3,8})/g, context: 'background' },
  { regex: /(?<!background-)color:\s*#([0-9a-fA-F]{3,8})/g, context: 'text' },
  { regex: /border(?:-color)?:\s*[^;]*#([0-9a-fA-F]{3,8})/g, context: 'border' },

  // CSS custom properties
  { regex: /--[\w-]+:\s*#([0-9a-fA-F]{3,8})/g, context: 'general' },

  // JSX style objects — quoted hex values
  { regex: /['"]#([0-9a-fA-F]{3,8})['"]/g, context: 'general' },
];

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

/**
 * Extract colors from source file contents.
 * Returns classified colors ranked by frequency and luminance context.
 */
export function extractColors(contents: string[]): ExtractedColors | undefined {
  const allContextual: ContextualHex[] = [];

  for (const content of contents) {
    for (const { regex, context } of PATTERNS) {
      // Reset lastIndex for each content string
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        const hex = normalizeHex(match[1]);
        if (hex) {
          allContextual.push({ hex, context });
        }
      }
    }
  }

  if (allContextual.length === 0) return undefined;

  const allHexes = allContextual.map((c) => c.hex);
  const allExtracted = deduplicateByFrequency(allHexes);

  // Classify background: most frequent bg-context color
  const bgHexes = allContextual
    .filter((c) => c.context === 'background')
    .map((c) => c.hex);
  const bgCandidates = deduplicateByFrequency(bgHexes);

  // Classify foreground: most frequent text-context color
  const textHexes = allContextual
    .filter((c) => c.context === 'text')
    .map((c) => c.hex);
  const textCandidates = deduplicateByFrequency(textHexes);

  const background = bgCandidates[0];
  const foreground = textCandidates[0];

  // Separate neutral from chromatic colors
  const neutralSet = new Set<string>();
  if (background) neutralSet.add(background);
  if (foreground) neutralSet.add(foreground);

  // Colors that are very low or very high luminance are likely neutrals
  for (const hex of allExtracted) {
    const lum = relativeLuminance(hex);
    if (lum < 0.05 || lum > 0.9) {
      neutralSet.add(hex);
    }
  }

  // Chromatic colors (non-neutral, non-bg/fg) ranked by frequency
  const chromaticRanked = countFrequency(
    allHexes.filter((h) => !neutralSet.has(h)),
  );

  const primary = chromaticRanked[0]?.item;
  const secondary = chromaticRanked[1]?.item;

  const result: ExtractedColors = { allExtracted };

  if (primary) {
    result.primary = { hex: primary };
  }
  if (secondary) {
    result.secondary = { hex: secondary };
  }
  if (background) result.background = background;
  if (foreground) result.foreground = foreground;

  return result;
}

/**
 * Infer dark or light mode from extracted background color.
 */
export function inferMode(colors: ExtractedColors): 'dark' | 'light' | undefined {
  const bg = colors.background;
  if (!bg) return undefined;
  const lum = relativeLuminance(bg);
  if (lum < 0.2) return 'dark';
  if (lum > 0.5) return 'light';
  return undefined; // ambiguous
}
