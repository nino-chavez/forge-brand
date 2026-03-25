/**
 * Exploration Extractor — Orchestrator
 *
 * Reads source files from a website-exploration variant directory
 * and extracts a partial BrandKit from the design decisions embedded in the code.
 */

import { readSourceFiles } from './utils.js';
import { extractColors, inferMode, type ExtractedColors } from './colors.js';
import { extractTypography, type ExtractedTypography } from './typography.js';
import { extractSpacing, type ExtractedSpacing } from './spacing.js';
import { extractLayout, type ExtractedLayout } from './layout.js';
import { extractVoiceHints, type ExtractedVoiceHints } from './voice-hints.js';

// ---------------------------------------------------------------------------
// Public Types
// ---------------------------------------------------------------------------

export interface PartialBrandKit {
  colors?: ExtractedColors;
  typography?: ExtractedTypography;
  spacing?: ExtractedSpacing;
  layout?: ExtractedLayout;
  mode?: 'dark' | 'light';
  voiceHints?: ExtractedVoiceHints;
}

// Re-export sub-types for consumers
export type { ExtractedColors } from './colors.js';
export type { ExtractedTypography, ExtractedFont } from './typography.js';
export type { ExtractedSpacing } from './spacing.js';
export type { ExtractedLayout } from './layout.js';
export type { ExtractedVoiceHints } from './voice-hints.js';

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Extract a partial BrandKit from a website-exploration variant directory.
 * Pure function — no AI, no prompts, no side effects beyond file reading.
 */
export function extractFromExploration(dirPath: string): PartialBrandKit {
  const files = readSourceFiles(dirPath);

  if (files.length === 0) {
    return {};
  }

  const contents = files.map((f) => f.content);

  const colors = extractColors(contents);
  const typography = extractTypography(contents);
  const spacing = extractSpacing(contents);
  const layout = extractLayout(contents);
  const voiceHints = extractVoiceHints(contents);

  // Infer mode from extracted colors
  const mode = colors ? inferMode(colors) : undefined;

  return {
    ...(colors && { colors }),
    ...(typography && { typography }),
    ...(spacing && { spacing }),
    ...(layout && { layout }),
    ...(mode && { mode }),
    ...(voiceHints && { voiceHints }),
  };
}
